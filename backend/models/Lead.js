const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    leadId: {
        type: String,
        required: true,
        unique: true
    },
    botId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    
    // Contact Information
    name: String,
    email: String,
    phone: String,
    
    // Lead Details
    interestedIn: String, // Property ID or service
    budget: {
        min: Number,
        max: Number,
        currency: String
    },
    preferredLocation: String,
    propertyType: String,
    
    // Custom Fields
    customFields: {
        type: Map,
        of: String
    },
    
    // Conversation Context
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant', 'system']
        },
        content: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Lead Quality Score (1-5)
    qualityScore: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    
    // Status
    status: {
        type: String,
        enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
        default: 'new'
    },
    
    // Source Tracking
    source: {
        url: String,
        referrer: String,
        utmSource: String,
        utmMedium: String,
        utmCampaign: String
    },
    
    // Session Info
    sessionId: String,
    ipAddress: String,
    userAgent: String,
    
    // Notifications Sent
    notificationsSent: {
        whatsapp: {
            type: Boolean,
            default: false
        },
        email: {
            type: Boolean,
            default: false
        },
        webhook: {
            type: Boolean,
            default: false
        },
        sentAt: Date
    },
    
    // Notes
    notes: String,
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
leadSchema.index({ botId: 1, createdAt: -1 });
leadSchema.index({ userId: 1, status: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ phone: 1 });

// Update timestamp
leadSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Lead', leadSchema);
