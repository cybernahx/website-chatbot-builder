#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const troubleshot = async () => {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 Admin Login Troubleshooter');
    console.log('='.repeat(60) + '\n');

    try {
        // Check MongoDB Connection
        console.log('1️⃣  Testing MongoDB Connection...');
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot-builder';
        console.log(`   📍 Connection string: ${mongoUri}`);

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('   ✅ MongoDB connected successfully!\n');

        // Check if admin user exists
        console.log('2️⃣  Checking for admin user...');
        const adminEmail = 'admin@chatbotbuilder.com';
        let adminUser = await User.findOne({ email: adminEmail });

        if (!adminUser) {
            console.log(`   ⚠️  Admin user does not exist!`);
            console.log(`   📝 Creating default admin user...\n`);
            
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('adminpassword123', salt);

            adminUser = new User({
                name: 'Super Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                plan: 'enterprise'
            });

            await adminUser.save();
            console.log(`   ✅ Admin user created successfully!\n`);
        } else {
            console.log(`   ✅ Admin user exists: ${adminUser.email}`);
            console.log(`   👤 Name: ${adminUser.name}`);
            console.log(`   🔑 Role: ${adminUser.role}`);
            console.log(`   📋 Plan: ${adminUser.plan}\n`);
        }

        // Test password
        console.log('3️⃣  Testing password authentication...');
        const testPassword = 'adminpassword123';
        const isMatch = await adminUser.comparePassword(testPassword);
        
        if (isMatch) {
            console.log(`   ✅ Password verification successful!\n`);
        } else {
            console.log(`   ❌ Password verification failed!`);
            console.log(`   🔄 Resetting password...\n`);
            
            const salt = await bcrypt.genSalt(10);
            adminUser.password = await bcrypt.hash(testPassword, salt);
            await adminUser.save();
            console.log(`   ✅ Password reset to: ${testPassword}\n`);
        }

        // Summary
        console.log('='.repeat(60));
        console.log('✅ TROUBLESHOOTING COMPLETE');
        console.log('='.repeat(60) + '\n');

        console.log('📌 Admin Login Credentials:');
        console.log(`   Email:    ${adminEmail}`);
        console.log(`   Password: ${testPassword}`);
        console.log(`   URL:      http://localhost:3000/admin_login.html\n`);

        console.log('🔧 Next Steps:');
        console.log('   1. Start the backend server: npm start');
        console.log('   2. Open admin login page in browser');
        console.log('   3. Enter credentials above');
        console.log('   4. Should see admin dashboard\n');

        console.log('📋 If still having issues:');
        console.log('   • Check browser console (F12) for errors');
        console.log('   • Check server logs for API errors');
        console.log('   • Verify MongoDB is running');
        console.log('   • Clear browser cache: localStorage.clear()\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.log('\n🆘 Troubleshooting tips:');
        console.log('   • Is MongoDB running? (mongod)');
        console.log('   • Check .env file exists and is configured');
        console.log('   • Check MongoDB URI is correct');
        console.log('   • Try: mongosh (to verify MongoDB connection)\n');
    } finally {
        if (mongoose.connection) {
            await mongoose.disconnect();
            console.log('🔌 MongoDB disconnected\n');
        }
    }
};

troubleshot();
