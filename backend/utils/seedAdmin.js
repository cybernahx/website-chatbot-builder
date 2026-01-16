const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedDefaultAdmin = async () => {
    try {
        const email = 'admin@chatbotbuilder.com';
        const password = 'adminpassword123';
        const name = 'Super Admin';

        let user = await User.findOne({ email });

        if (!user) {
            console.log('Seeding: Creating default admin user...');
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
            console.log(`Seeding: Default admin created (${email}).`);
        } else {
            // Ensure the default user is always an admin
            if (user.role !== 'admin') {
                user.role = 'admin';
                await user.save();
                console.log('Seeding: Updated default user to admin role.');
            }
        }
    } catch (error) {
        console.error('Seeding Error:', error);
    }
};

module.exports = seedDefaultAdmin;
