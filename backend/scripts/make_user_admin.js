const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const email = process.argv[2];

if (!email) {
    console.log('Please provide an email address.');
    console.log('Usage: npm run make-admin <email>');
    process.exit(1);
}

const makeAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot-builder');
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email });
        
        if (!user) {
            console.log(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();

        console.log(`Success! User ${user.name} (${user.email}) is now an Admin.`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

makeAdmin();
