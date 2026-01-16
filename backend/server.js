const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { connectDatabase, dbAdapter } = require('./db/dbAdapter');
const seedDefaultAdmin = require('./utils/seedAdmin');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const authRoutes = require('./routes/auth');
const chatbotRoutes = require('./routes/chatbot');
const billingRoutes = require('./routes/billing');
const adminRoutes = require('./routes/admin');
const { authMiddleware } = require('./middleware/auth');

// Import models
const Chatbot = require('./models/Chatbot');

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000', 'https://api.openai.com', 'https://twilio.com'],
            frameSrc: ["'self'"],
            objectSrc: ["'none'"]
        }
    }
}));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date(),
        service: 'Chatbot Builder API' 
    });
});

// CORS configuration - Allow widget to be embedded
const corsOptions = {
    origin: function(origin, callback) {
        // Allow specific origins
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5000',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5000',
            process.env.FRONTEND_URL || 'http://localhost:3000',
            // In production, add your domain:
            'https://your-production-domain.com',
            'https://www.your-production-domain.com'
        ];
        
        // For development, allow all. For production, be restrictive.
        if (process.env.NODE_ENV === 'production') {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        } else {
            // Development: allow all origins
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};
app.use(cors(corsOptions));

// Serve widget files statically
app.use('/widget', express.static(path.join(__dirname, '../widget')));

// Serve frontend files statically
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// Serve root as frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Stripe webhook needs raw body
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);

// Make dbAdapter available to routes
app.locals.dbAdapter = dbAdapter;

// Conversation Schema (for storing chat history)
const conversationSchema = new mongoose.Schema({
    botId: {
        type: String,
        required: true
    },
    sessionId: {
        type: String,
        required: true
    },
    messages: [{
        type: {
            type: String,
            enum: ['user', 'bot']
        },
        content: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    userInfo: {
        ip: String,
        userAgent: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Conversation = mongoose.model('Conversation', conversationSchema);

// Routes

// Get all chatbots for a user (PROTECTED)
app.get('/api/chatbots/:userId', authMiddleware, async (req, res) => {
    try {
        // Ensure user can only access their own chatbots
        if (req.userId !== req.params.userId) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        
        const chatbots = await Chatbot.find({ userId: req.params.userId });
        res.json(chatbots);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a specific chatbot
app.get('/api/chatbot/:botId', async (req, res) => {
    try {
        const chatbot = await Chatbot.findOne({ botId: req.params.botId });
        if (!chatbot) {
            return res.status(404).json({ error: 'Chatbot not found' });
        }
        res.json(chatbot);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new chatbot (PROTECTED)
app.post('/api/chatbot', authMiddleware, async (req, res) => {
    try {
        const botId = 'bot_' + Math.random().toString(36).substr(2, 9);
        
        const chatbot = new Chatbot({
            botId,
            userId: req.userId, // Use authenticated user ID
            name: req.body.name,
            welcomeMessage: req.body.welcomeMessage,
            primaryColor: req.body.primaryColor,
            avatar: req.body.avatar,
            flow: req.body.flow || { nodes: [], connections: [] }
        });

        await chatbot.save();
        res.status(201).json(chatbot);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a chatbot
app.put('/api/chatbot/:botId', async (req, res) => {
    try {
        const chatbot = await Chatbot.findOneAndUpdate(
            { botId: req.params.botId },
            { 
                ...req.body,
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!chatbot) {
            return res.status(404).json({ error: 'Chatbot not found' });
        }

        res.json(chatbot);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a chatbot
app.delete('/api/chatbot/:botId', async (req, res) => {
    try {
        const chatbot = await Chatbot.findOneAndDelete({ botId: req.params.botId });
        
        if (!chatbot) {
            return res.status(404).json({ error: 'Chatbot not found' });
        }

        // Also delete all conversations for this bot
        await Conversation.deleteMany({ botId: req.params.botId });

        res.json({ message: 'Chatbot deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Publish/Unpublish chatbot
app.patch('/api/chatbot/:botId/publish', async (req, res) => {
    try {
        const chatbot = await Chatbot.findOneAndUpdate(
            { botId: req.params.botId },
            { 
                isPublished: req.body.isPublished,
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!chatbot) {
            return res.status(404).json({ error: 'Chatbot not found' });
        }

        res.json(chatbot);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Chat endpoint - process user messages
app.post('/api/chat/:botId', async (req, res) => {
    try {
        const { botId } = req.params;
        const { sessionId, message } = req.body;

        const chatbot = await Chatbot.findOne({ botId });
        
        if (!chatbot || !chatbot.isPublished) {
            return res.status(404).json({ error: 'Chatbot not found or not published' });
        }

        // Find or create conversation
        let conversation = await Conversation.findOne({ botId, sessionId });
        
        if (!conversation) {
            conversation = new Conversation({
                botId,
                sessionId,
                messages: [],
                userInfo: {
                    ip: req.ip,
                    userAgent: req.headers['user-agent']
                }
            });
        }

        // Add user message
        conversation.messages.push({
            type: 'user',
            content: message
        });

        // Simple bot response (in production, this would be based on the flow)
        const botResponse = processMessage(message, chatbot.flow);
        
        conversation.messages.push({
            type: 'bot',
            content: botResponse
        });

        await conversation.save();

        res.json({
            response: botResponse,
            sessionId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get chat history
app.get('/api/conversations/:botId', async (req, res) => {
    try {
        const conversations = await Conversation.find({ botId: req.params.botId })
            .sort({ createdAt: -1 })
            .limit(100);
        
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Simple message processing function
function processMessage(message, flow) {
    // This is a simple implementation
    // In production, you would traverse the flow based on conditions
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return 'Hello! How can I assist you today?';
    } else if (lowerMessage.includes('help')) {
        return 'I\'m here to help! What do you need assistance with?';
    } else if (lowerMessage.includes('bye')) {
        return 'Goodbye! Have a great day!';
    } else {
        return 'Thank you for your message. How else can I help you?';
    }
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// Start server
const startServer = async () => {
    try {
        // Database Connection (MongoDB with NeDB fallback)
        const result = await connectDatabase(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot-builder');
        console.log(`\n📊 Database Type: ${result.type.toUpperCase()}`);
        if (result.type === 'nedb') {
            console.log('💡 Tip: Install MongoDB for production use. See MONGODB_SETUP_INSTRUCTIONS.md');
        }

        // Seed default admin
        await seedDefaultAdmin();

        const server = app.listen(PORT, () => {
            console.log(`\n🚀 Server running on port ${PORT}`);
            console.log(`📍 API endpoints: http://localhost:${PORT}/api`);
            console.log(`🤖 Widget demo: http://localhost:${PORT}/widget/demo.html`);
            console.log(`\n✅ Server ready to accept connections!`);
        });

        // Keep the server alive
        server.on('error', (err) => {
            console.error('Server error:', err);
        });

        return server;
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();

module.exports = app;
