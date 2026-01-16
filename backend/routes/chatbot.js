const express = require('express');
const router = express.Router();
const Chatbot = require('../models/Chatbot');
const Lead = require('../models/Lead');
const { authMiddleware } = require('../middleware/auth');
const aiService = require('../services/aiService');
const fileService = require('../services/fileService');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const { v4: uuidv4 } = require('uuid');

// Create new chatbot
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const botId = 'bot_' + uuidv4().substring(0, 12);
        
        const chatbot = new Chatbot({
            botId,
            userId: req.userId,
            name: req.body.name || 'My Chatbot',
            welcomeMessage: req.body.welcomeMessage || 'Hello! How can I help you today?',
            primaryColor: req.body.primaryColor || '#4A90E2',
            systemPrompt: req.body.systemPrompt || `You are a helpful AI assistant for ${req.body.name || 'customer support'}. 
Answer questions based on the provided knowledge base. Be professional and friendly.
If you don't know something, politely say so and offer to connect with a human agent.`
        });

        await chatbot.save();
        
        res.status(201).json({
            success: true,
            message: 'Chatbot created successfully',
            chatbot
        });
    } catch (error) {
        console.error('Create chatbot error:', error);
        res.status(500).json({ error: 'Failed to create chatbot' });
    }
});

// Upload and process knowledge base file
router.post('/:botId/upload-knowledge', authMiddleware, 
    fileService.getUploadMiddleware('file'),
    async (req, res) => {
    try {
        const { botId } = req.params;
        
        // Validation: Check if botId exists
        if (!botId || botId.trim() === '') {
            return res.status(400).json({ error: 'Invalid chatbot ID provided' });
        }
        
        const chatbot = await Chatbot.findOne({ botId, userId: req.userId });
        
        if (!chatbot) {
            return res.status(404).json({ error: 'Chatbot not found or access denied' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded. Please provide a PDF, TXT, DOC, or DOCX file.' });
        }
        
        // Validate file size
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (req.file.size > MAX_FILE_SIZE) {
            return res.status(413).json({ error: 'File exceeds maximum size of 10MB' });
        }

        // Process file
        const fileData = await fileService.processFile(req.file);
        
        // Chunk the text
        const chunks = aiService.chunkText(fileData.text, 500, 50);
        
        // Generate embeddings for chunks (in batches)
        console.log(`Generating embeddings for ${chunks.length} chunks...`);
        const embeddings = await aiService.generateEmbeddings(chunks);
        
        // Create knowledge base entry
        const knowledgeEntry = {
            id: uuidv4(),
            source: 'pdf',
            filename: fileData.filename,
            content: fileData.text,
            chunks: chunks.map((text, i) => ({
                text,
                embedding: embeddings[i],
                metadata: { chunkIndex: i }
            }))
        };
        
        chatbot.knowledgeBase.push(knowledgeEntry);
        await chatbot.save();
        
        // Clean up uploaded file
        await fileService.deleteFile(fileData.path);
        
        res.json({
            success: true,
            message: 'Knowledge base updated successfully',
            chunksProcessed: chunks.length,
            knowledgeBaseId: knowledgeEntry.id
        });
    } catch (error) {
        console.error('Upload knowledge error:', error);
        res.status(500).json({ error: 'Failed to process file: ' + error.message });
    }
});

// Add property to chatbot (for Real Estate)
router.post('/:botId/add-property', authMiddleware, async (req, res) => {
    try {
        const { botId } = req.params;
        const chatbot = await Chatbot.findOne({ botId, userId: req.userId });
        
        if (!chatbot) {
            return res.status(404).json({ error: 'Chatbot not found' });
        }

        const property = {
            propertyId: uuidv4(),
            location: req.body.location,
            city: req.body.city,
            country: req.body.country,
            size: req.body.size,
            sizeUnit: req.body.sizeUnit || 'SQFT',
            price: req.body.price,
            currency: req.body.currency || 'PKR',
            bedrooms: req.body.bedrooms,
            propertyType: req.body.propertyType,
            titleStatus: req.body.titleStatus,
            features: req.body.features || [],
            imageLinks: req.body.imageLinks || [],
            contactInfo: req.body.contactInfo || {},
            isActive: true
        };

        chatbot.properties.push(property);
        await chatbot.save();
        
        res.json({
            success: true,
            message: 'Property added successfully',
            property
        });
    } catch (error) {
        console.error('Add property error:', error);
        res.status(500).json({ error: 'Failed to add property' });
    }
});

// Chat endpoint (PUBLIC - for widget)
router.post('/:botId/chat', async (req, res) => {
    try {
        const { botId } = req.params;
        const { message, sessionId } = req.body;
        
        if (!message || !sessionId) {
            return res.status(400).json({ error: 'Message and sessionId required' });
        }

        const chatbot = await Chatbot.findOne({ botId, isPublished: true, isActive: true });
        
        if (!chatbot) {
            return res.status(404).json({ error: 'Chatbot not found or not published' });
        }

        // Update usage stats
        chatbot.stats.totalMessages += 1;
        chatbot.stats.lastUsed = new Date();
        
        // Get or create conversation
        let lead = await Lead.findOne({ botId, sessionId });
        
        if (!lead) {
            lead = new Lead({
                leadId: uuidv4(),
                botId,
                userId: chatbot.userId,
                sessionId,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                source: {
                    url: req.headers.referer,
                    referrer: req.headers.referer
                },
                messages: []
            });
        }

        // Add user message
        lead.messages.push({
            role: 'user',
            content: message
        });

        // Find relevant context from knowledge base
        const context = await aiService.findRelevantContext(
            message,
            chatbot.knowledgeBase,
            3
        );

        // Check if this is a property inquiry (Real Estate specific)
        let propertyMatches = [];
        if (chatbot.properties && chatbot.properties.length > 0) {
            const requirements = await aiService.extractPropertyRequirements(message);
            if (requirements) {
                propertyMatches = aiService.matchProperties(requirements, chatbot.properties);
                lead.interestedIn = requirements.propertyType || 'property';
                lead.preferredLocation = requirements.location;
                lead.budget = requirements.budget;
            }
        }

        // Prepare conversation history
        const conversationHistory = lead.messages.slice(-5).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));

        // Generate AI response
        const aiResponse = await aiService.chat(
            conversationHistory,
            chatbot.systemPrompt,
            context,
            chatbot.aiSettings
        );

        let botResponse = aiResponse.message;

        // Add property recommendations if found
        if (propertyMatches.length > 0) {
            botResponse += '\n\n🏠 I found some properties that might interest you:\n\n';
            propertyMatches.slice(0, 3).forEach((prop, i) => {
                botResponse += `${i + 1}. ${prop.propertyType} in ${prop.location}\n`;
                botResponse += `   💰 Price: ${prop.price.toLocaleString()} ${prop.currency}\n`;
                botResponse += `   🛏️ Bedrooms: ${prop.bedrooms}\n`;
                botResponse += `   📐 Size: ${prop.size} ${prop.sizeUnit}\n`;
                if (prop.imageLinks && prop.imageLinks.length > 0) {
                    botResponse += `   📷 View: ${prop.imageLinks[0]}\n`;
                }
                botResponse += '\n';
            });
            botResponse += 'Would you like more details about any of these properties?';
        }

        // Add bot response
        lead.messages.push({
            role: 'assistant',
            content: botResponse
        });

        // Check if we should capture lead
        const shouldCaptureLead = this.shouldCaptureLead(lead.messages);
        if (shouldCaptureLead && !lead.notificationsSent.whatsapp) {
            // Send notifications
            if (chatbot.leadCapture.whatsappNotification?.enabled) {
                await whatsappService.sendLeadNotification(
                    chatbot.leadCapture.whatsappNotification.phoneNumber,
                    lead,
                    chatbot.name
                );
                lead.notificationsSent.whatsapp = true;
            }

            if (chatbot.leadCapture.emailNotification?.enabled) {
                await emailService.sendLeadNotification(
                    chatbot.leadCapture.emailNotification.recipients,
                    lead,
                    chatbot.name
                );
                lead.notificationsSent.email = true;
            }

            lead.notificationsSent.sentAt = new Date();
            chatbot.stats.leadsGenerated += 1;
        }

        await lead.save();
        await chatbot.save();

        res.json({
            response: botResponse,
            sessionId,
            propertyMatches: propertyMatches.slice(0, 3).map(p => ({
                id: p.propertyId,
                location: p.location,
                price: p.price,
                currency: p.currency,
                bedrooms: p.bedrooms,
                images: p.imageLinks
            }))
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

// Helper function to determine if lead should be captured
router.shouldCaptureLead = function(messages) {
    // Capture lead if conversation has at least 3 messages
    // and user has shown interest (keywords: interested, price, visit, contact, etc.)
    if (messages.length < 3) return false;
    
    const interestKeywords = ['interested', 'price', 'visit', 'schedule', 'contact', 
                               'number', 'email', 'call', 'meeting', 'details'];
    
    const lastMessages = messages.slice(-3).map(m => m.content.toLowerCase());
    return interestKeywords.some(keyword => 
        lastMessages.some(msg => msg.includes(keyword))
    );
};

// Get chatbot details
router.get('/:botId', async (req, res) => {
    try {
        const { botId } = req.params;
        const chatbot = await Chatbot.findOne({ botId }).select('-knowledgeBase.chunks.embedding');
        
        if (!chatbot) {
            return res.status(404).json({ error: 'Chatbot not found' });
        }

        // Check user plan to enforce branding
        const User = require('../models/User');
        const user = await User.findById(chatbot.userId);
        
        if (user && user.plan === 'free') {
            // Enforce branding for free plan
            if (!chatbot.widgetSettings) chatbot.widgetSettings = {};
            chatbot.widgetSettings.showAds = true;
            chatbot.widgetSettings.adContent = 'Powered by Chatbot Builder';
            chatbot.widgetSettings.adLink = process.env.FRONTEND_URL || 'http://localhost:5500';
        }

        res.json({ chatbot });
    } catch (error) {
        console.error('Get chatbot error:', error);
        res.status(500).json({ error: 'Failed to get chatbot' });
    }
});

// Get user's chatbots
router.get('/user/list', authMiddleware, async (req, res) => {
    try {
        const chatbots = await Chatbot.find({ userId: req.userId })
            .select('-knowledgeBase -properties')
            .sort({ createdAt: -1 });
        
        res.json({ chatbots });
    } catch (error) {
        console.error('List chatbots error:', error);
        res.status(500).json({ error: 'Failed to list chatbots' });
    }
});

// Update chatbot
router.put('/:botId', authMiddleware, async (req, res) => {
    try {
        const { botId } = req.params;
        const chatbot = await Chatbot.findOneAndUpdate(
            { botId, userId: req.userId },
            {
                name: req.body.name,
                welcomeMessage: req.body.welcomeMessage,
                systemPrompt: req.body.systemPrompt,
                primaryColor: req.body.primaryColor,
                aiSettings: req.body.aiSettings,
                leadCapture: req.body.leadCapture,
                widgetSettings: req.body.widgetSettings,
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!chatbot) {
            return res.status(404).json({ error: 'Chatbot not found' });
        }

        res.json({ success: true, chatbot });
    } catch (error) {
        console.error('Update chatbot error:', error);
        res.status(500).json({ error: 'Failed to update chatbot' });
    }
});

// Publish/unpublish chatbot
router.patch('/:botId/publish', authMiddleware, async (req, res) => {
    try {
        const { botId } = req.params;
        const { isPublished } = req.body;
        
        const chatbot = await Chatbot.findOneAndUpdate(
            { botId, userId: req.userId },
            { isPublished, updatedAt: Date.now() },
            { new: true }
        );

        if (!chatbot) {
            return res.status(404).json({ error: 'Chatbot not found' });
        }

        res.json({
            success: true,
            message: `Chatbot ${isPublished ? 'published' : 'unpublished'} successfully`,
            chatbot
        });
    } catch (error) {
        console.error('Publish chatbot error:', error);
        res.status(500).json({ error: 'Failed to update chatbot status' });
    }
});

// Get leads for a chatbot (with pagination & filtering)
router.get('/:botId/leads', authMiddleware, async (req, res) => {
    try {
        const { botId } = req.params;
        const { page = 1, limit = 50, startDate, endDate, status } = req.query;
        
        // Verify bot ownership
        const chatbot = await Chatbot.findOne({ botId, userId: req.userId });
        if (!chatbot) {
            return res.status(404).json({ error: 'Chatbot not found' });
        }

        // Build query filters
        const query = { botId };
        
        // Date range filtering
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }
        
        // Status filtering
        if (status) {
            query.status = status;
        }
        
        // Calculate pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 50));
        const skip = (pageNum - 1) * pageSize;
        
        // Get total count for pagination
        const total = await Lead.countDocuments(query);
        
        // Fetch leads with pagination
        const leads = await Lead.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize);
        
        res.json({ 
            leads,
            pagination: {
                page: pageNum,
                limit: pageSize,
                total,
                pages: Math.ceil(total / pageSize)
            }
        });
    } catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({ error: 'Failed to get leads: ' + error.message });
    }
});

// Delete chatbot
router.delete('/:botId', authMiddleware, async (req, res) => {
    try {
        const { botId } = req.params;
        const chatbot = await Chatbot.findOneAndDelete({ botId, userId: req.userId });
        
        if (!chatbot) {
            return res.status(404).json({ error: 'Chatbot not found' });
        }

        // Also delete associated leads
        await Lead.deleteMany({ botId });

        res.json({ success: true, message: 'Chatbot deleted successfully' });
    } catch (error) {
        console.error('Delete chatbot error:', error);
        res.status(500).json({ error: 'Failed to delete chatbot' });
    }
});

module.exports = router;
