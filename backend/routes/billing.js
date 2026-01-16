const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');

// Create Stripe Checkout Session
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
    try {
        const { plan, priceId } = req.body;
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Create Stripe customer if doesn't exist
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    userId: user._id.toString()
                }
            });
            customerId = customer.id;
            user.stripeCustomerId = customerId;
            await user.save();
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard.html?view=billing`,
            metadata: {
                userId: user._id.toString(),
                plan: plan
            }
        });

        res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        res.status(500).json({ error: 'Failed to create checkout session: ' + error.message });
    }
});

// Stripe Webhook Handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            await handleCheckoutSessionCompleted(session);
            break;

        case 'customer.subscription.updated':
            const subscription = event.data.object;
            await handleSubscriptionUpdated(subscription);
            break;

        case 'customer.subscription.deleted':
            const canceledSubscription = event.data.object;
            await handleSubscriptionCanceled(canceledSubscription);
            break;

        case 'invoice.payment_succeeded':
            const invoice = event.data.object;
            await handlePaymentSucceeded(invoice);
            break;

        case 'invoice.payment_failed':
            const failedInvoice = event.data.object;
            await handlePaymentFailed(failedInvoice);
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

// Get current subscription
router.get('/subscription', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        
        if (!user || !user.stripeCustomerId) {
            return res.json({
                plan: 'free',
                status: 'active',
                messageLimit: 30,
                messagesUsed: user?.messagesUsed || 0
            });
        }

        // Get active subscriptions
        const subscriptions = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: 'active',
            limit: 1
        });

        if (subscriptions.data.length === 0) {
            return res.json({
                plan: 'free',
                status: 'active',
                messageLimit: 30,
                messagesUsed: user.messagesUsed || 0
            });
        }

        const subscription = subscriptions.data[0];
        const plan = getPlanFromSubscription(subscription);

        res.json({
            plan: plan.name,
            status: subscription.status,
            messageLimit: plan.messageLimit,
            messagesUsed: user.messagesUsed || 0,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end
        });
    } catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ error: 'Failed to get subscription' });
    }
});

// Cancel subscription
router.post('/cancel-subscription', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        
        if (!user || !user.stripeCustomerId) {
            return res.status(400).json({ error: 'No active subscription' });
        }

        const subscriptions = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: 'active',
            limit: 1
        });

        if (subscriptions.data.length === 0) {
            return res.status(400).json({ error: 'No active subscription' });
        }

        const subscription = await stripe.subscriptions.update(
            subscriptions.data[0].id,
            { cancel_at_period_end: true }
        );

        res.json({
            success: true,
            message: 'Subscription will be canceled at the end of the billing period',
            cancelAt: new Date(subscription.current_period_end * 1000)
        });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});

// Get invoices
router.get('/invoices', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        
        if (!user || !user.stripeCustomerId) {
            return res.json({ invoices: [] });
        }

        const invoices = await stripe.invoices.list({
            customer: user.stripeCustomerId,
            limit: 10
        });

        res.json({
            invoices: invoices.data.map(inv => ({
                id: inv.id,
                amount: inv.amount_paid / 100,
                currency: inv.currency.toUpperCase(),
                status: inv.status,
                date: new Date(inv.created * 1000),
                pdfUrl: inv.invoice_pdf
            }))
        });
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ error: 'Failed to get invoices' });
    }
});

// Helper Functions
async function handleCheckoutSessionCompleted(session) {
    const userId = session.metadata.userId;
    const plan = session.metadata.plan;

    const user = await User.findById(userId);
    if (user) {
        user.subscription = {
            plan: plan,
            status: 'active',
            stripeSubscriptionId: session.subscription,
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        };
        await user.save();
        console.log(`Subscription activated for user ${userId}, plan: ${plan}`);
    }
}

async function handleSubscriptionUpdated(subscription) {
    const customerId = subscription.customer;
    const user = await User.findOne({ stripeCustomerId: customerId });
    
    if (user) {
        const plan = getPlanFromSubscription(subscription);
        user.subscription = {
            plan: plan.name,
            status: subscription.status,
            stripeSubscriptionId: subscription.id,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        };
        await user.save();
        console.log(`Subscription updated for user ${user._id}`);
    }
}

async function handleSubscriptionCanceled(subscription) {
    const customerId = subscription.customer;
    const user = await User.findOne({ stripeCustomerId: customerId });
    
    if (user) {
        user.subscription = {
            plan: 'free',
            status: 'canceled',
            currentPeriodEnd: new Date()
        };
        await user.save();
        console.log(`Subscription canceled for user ${user._id}`);
    }
}

async function handlePaymentSucceeded(invoice) {
    console.log(`Payment succeeded for invoice ${invoice.id}`);
    // Optional: Send payment receipt email
}

async function handlePaymentFailed(invoice) {
    const customerId = invoice.customer;
    const user = await User.findOne({ stripeCustomerId: customerId });
    
    if (user) {
        console.log(`Payment failed for user ${user._id}`);
        // Optional: Send payment failed notification
    }
}

function getPlanFromSubscription(subscription) {
    // Map Stripe price IDs to plan details
    const plans = {
        'price_starter123': { name: 'starter', messageLimit: 1000 },
        'price_pro456': { name: 'pro', messageLimit: 10000 },
        'price_business789': { name: 'business', messageLimit: 50000 }
    };

    const priceId = subscription.items.data[0]?.price?.id;
    return plans[priceId] || { name: 'free', messageLimit: 30 };
}

module.exports = router;
