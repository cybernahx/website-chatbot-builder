document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = token ? await fetchUser(token) : null;

    updatePricingButtons(user);
});

async function fetchUser(token) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/auth/me`, {
            headers: { 'x-auth-token': token }
        });
        if (response.ok) return await response.json();
    } catch (e) {
        console.error(e);
    }
    return null;
}

function updatePricingButtons(user) {
    const cards = document.querySelectorAll('.pricing-card');
    
    cards.forEach(card => {
        const title = card.querySelector('h3').innerText.toLowerCase();
        const btn = card.querySelector('.btn');
        
        // Map card titles to plan IDs (must match backend/Stripe)
        let planId = 'free';
        let priceId = ''; // You need to put your actual Stripe Price IDs here

        if (title.includes('starter')) {
            planId = 'free';
        } else if (title.includes('pro')) {
            planId = 'pro';
            priceId = 'price_1234567890'; // REPLACE WITH REAL STRIPE PRICE ID
        } else if (title.includes('agency')) {
            planId = 'business';
            priceId = 'price_0987654321'; // REPLACE WITH REAL STRIPE PRICE ID
        }

        if (user) {
            if (user.plan === planId) {
                btn.innerText = 'Current Plan';
                btn.classList.add('btn-disabled');
                btn.href = '#';
                btn.style.opacity = '0.6';
                btn.style.cursor = 'default';
            } else {
                if (planId === 'free') {
                    btn.innerText = 'Downgrade'; // Or hide
                } else {
                    btn.innerText = 'Upgrade';
                    btn.onclick = (e) => {
                        e.preventDefault();
                        initiateCheckout(planId, priceId);
                    };
                    btn.removeAttribute('href');
                }
            }
        } else {
            // Not logged in
            btn.href = 'register.html';
            btn.innerText = 'Get Started';
        }
    });
}

async function initiateCheckout(plan, priceId) {
    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = 'Processing...';
    btn.disabled = true;

    try {
        const response = await fetch(`${CONFIG.API_URL}/billing/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ plan, priceId })
        });

        const data = await response.json();
        
        if (data.url) {
            window.location.href = data.url;
        } else {
            alert('Failed to start checkout');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Something went wrong');
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}
