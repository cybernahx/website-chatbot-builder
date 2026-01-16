const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

(async () => {
  try {
    console.log('\n🔍 Checking admin user and password...\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot-builder');
    const user = await User.findOne({ email: 'admin@chatbotbuilder.com' });
    
    if (user) {
      console.log('✅ Admin user found');
      console.log('📦 Current password hash length:', user.password.length);
      
      // Test with current hash
      const testPass = 'adminpassword123';
      const match = await bcrypt.compare(testPass, user.password);
      console.log('🔓 Password match test:', match ? '✅ YES' : '❌ NO');
      
      if (!match) {
        console.log('\n🔄 Password mismatch detected!');
        console.log('📝 Resetting password now...\n');
        
        // Set the plain password - the pre-save hook will hash it
        user.password = testPass;
        await user.save();
        
        console.log('✅ Password reset successfully!');
        
        // Reload from database to verify
        const reloadedUser = await User.findOne({ email: 'admin@chatbotbuilder.com' });
        const verifyMatch = await bcrypt.compare(testPass, reloadedUser.password);
        console.log('✅ Verification test:', verifyMatch ? 'PASS ✅' : 'FAIL ❌');
      }
      
      console.log('\n📌 Admin Credentials:');
      console.log('   Email: admin@chatbotbuilder.com');
      console.log('   Password: adminpassword123');
    } else {
      console.log('❌ Admin user NOT found');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Done\n');
  }
})();
