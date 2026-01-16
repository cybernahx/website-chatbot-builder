const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const createDefaultAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot-builder');
        console.log('Connected to MongoDB');

        const email = 'admin@chatbotbuilder.com';
        const password = 'adminpassword123';
        const name = 'Super Admin';

        let user = await User.findOne({ email });

        if (user) {
            console.log('Admin user already exists. Updating role...');
            user.role = 'admin';
            await user.save();
            console.log('User role updated to admin.');
        } else {
            console.log('Creating new admin user...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = new User({
                name,
                email,
                password: hashedPassword,
                role: 'admin',
                plan: 'enterprise'
            });

            await user.save();
            console.log('Admin user created successfully.');
        }

        console.log('----------------------------------------');
        console.log('Default Admin Credentials:');
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log('----------------------------------------');
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createDefaultAdmin();
