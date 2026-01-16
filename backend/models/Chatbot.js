const mongoose = require('mongoose');

const chatbotSchema = new mongoose.Schema({
    botId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    welcomeMessage: {
        type: String,
        default: 'Hello! How can I help you today?'
    },
    systemPrompt: {
        type: String,
        default: `You are a helpful AI assistant. Answer questions based on the provided knowledge base. 
If you don't know the answer, politely say you don't have that information.`
    },
    primaryColor: {
        type: String,
        default: '#4A90E2'
    },
    avatar: {
        type: String,
        default: ''
    },
    
    // AI Configuration
    aiSettings: {
        model: {
            type: String,
            default: 'gpt-4o-mini'
        },
        temperature: {
            type: Number,
            default: 0.7,
            min: 0,
            max: 2
        },
        maxTokens: {
            type: Number,
            default: 500
        },
        responseLanguage: {
            type: String,
            enum: ['english', 'urdu', 'hindi', 'mixed'],
            default: 'mixed'
        }
    },

    // Knowledge Base
    knowledgeBase: {
        type: [{
            id: String,
            source: String, // 'pdf', 'text', 'url', 'manual'
            filename: String,
            content: String,
            chunks: [{
                text: String,
                embedding: [Number],
                metadata: Object
            }],
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }],
        default: []
    },

    // Property Specific (for Real Estate)
    properties: [{
        propertyId: String,
        location: String,
        city: String,
        country: String,
        size: Number,
        sizeUnit: String,
        price: Number,
        currency: String,
        bedrooms: Number,
        propertyType: String,
        titleStatus: String,
        features: [String],
        imageLinks: [String],
        contactInfo: Object,
        isActive: {
            type: Boolean,
            default: true
        }
    }],

    // Lead Capture Settings
    leadCapture: {
        enabled: {
            type: Boolean,
            default: true
        },
        fields: [{
            name: String,
            type: String, // 'text', 'email', 'phone', 'select'
            required: Boolean,
            options: [String]
        }],
        webhook: String,
        whatsappNotification: {
            enabled: Boolean,
            phoneNumber: String
        },
        emailNotification: {
            enabled: Boolean,
            recipients: [String]
        }
    },

    // Widget Settings
    widgetSettings: {
        position: {
            type: String,
            enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
            default: 'bottom-right'
        },
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'light'
        },
        showBranding: {
            type: Boolean,
            default: true
        },
        customCSS: String,
        allowedDomains: [String],
        showAds: {
            type: Boolean,
            default: false
        },
        adContent: {
            type: String,
            default: ''
        },
        adLink: {
            type: String,
            default: ''
        }
    },

    // Usage Stats
    stats: {
        totalConversations: {
            type: Number,
            default: 0
        },
        totalMessages: {
            type: Number,
            default: 0
        },
        leadsGenerated: {
            type: Number,
            default: 0
        },
        lastUsed: Date,
        monthlyMessageCount: {
            type: Number,
            default: 0
        },
        lastResetDate: {
            type: Date,
            default: Date.now
        }
    },

    // Flow Builder (if needed later)
    flow: {
        nodes: [{
            id: String,
            type: String,
            x: Number,
            y: Number,
            properties: Object
        }],
        connections: [{
            from: String,
            to: String
        }]
    },

    isPublished: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for better performance
chatbotSchema.index({ userId: 1, botId: 1 });
chatbotSchema.index({ isPublished: 1, isActive: 1 });

// Update timestamp on save
chatbotSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Chatbot', chatbotSchema);
