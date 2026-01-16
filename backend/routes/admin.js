const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Chatbot = require('../models/Chatbot');
const SystemSettings = require('../models/SystemSettings');
const adminAuth = require('../middleware/adminAuth');

// @route   GET api/admin/stats
// @desc    Get system-wide statistics
// @access  Admin
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalChatbots = await Chatbot.countDocuments();
    
    // Calculate total messages (aggregation)
    const messagesStats = await Chatbot.aggregate([
      { $group: { _id: null, total: { $sum: "$analytics.totalMessages" } } }
    ]);
    const totalMessages = messagesStats.length > 0 ? messagesStats[0].total : 0;

    // Get recent users
    const recentUsers = await User.find({ role: 'user' })
      .sort({ date: -1 })
      .limit(5)
      .select('-password');

    res.json({
      totalUsers,
      totalChatbots,
      totalMessages,
      recentUsers
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/users
// @desc    Get all users with pagination
// @access  Admin
router.get('/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({ role: { $ne: 'admin' } }) // Exclude admins
      .select('-password')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ role: { $ne: 'admin' } });

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/users/:id
// @desc    Update user (plan, limits, role, etc.)
// @access  Admin
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { plan, chatbotLimit, conversationLimit, role } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          plan, 
          chatbotLimit, 
          conversationLimit,
          role
        } 
      },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/admin/users/:id
// @desc    Delete user and their chatbots
// @access  Admin
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Delete user's chatbots
    await Chatbot.deleteMany({ user: req.params.id });
    
    // Delete user
    await User.findByIdAndDelete(req.params.id);

    res.json({ msg: 'User and their data removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/settings
// @desc    Get system settings
// @access  Admin
router.get('/settings', adminAuth, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      // Create default settings if not exists
      settings = new SystemSettings({
        pricingPlans: {
          free: { name: 'Free', price: 0, limits: { chatbots: 1, conversations: 100 } },
          starter: { name: 'Starter', price: 29, limits: { chatbots: 5, conversations: 1000 } },
          pro: { name: 'Pro', price: 79, limits: { chatbots: 15, conversations: 5000 } },
          business: { name: 'Business', price: 199, limits: { chatbots: 50, conversations: 20000 } }
        }
      });
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/settings
// @desc    Update system settings (pricing, etc.)
// @access  Admin
router.put('/settings', adminAuth, async (req, res) => {
  try {
    const { pricingPlans, general } = req.body;
    
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings();
    }

    if (pricingPlans) settings.pricingPlans = pricingPlans;
    if (general) settings.general = general;
    settings.updatedAt = Date.now();

    await settings.save();
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
