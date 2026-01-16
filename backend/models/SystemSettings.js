const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: String,
  price: Number,
  currency: { type: String, default: 'USD' },
  features: [String],
  limits: {
    chatbots: Number,
    conversations: Number,
    messages: Number
  },
  stripePriceId: String
});

const systemSettingsSchema = new mongoose.Schema({
  pricingPlans: {
    free: planSchema,
    starter: planSchema,
    pro: planSchema,
    business: planSchema
  },
  general: {
    allowRegistration: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    appName: { type: String, default: 'Chatbot Builder SaaS' }
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
