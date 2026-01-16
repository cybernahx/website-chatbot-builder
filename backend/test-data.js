/**
 * Test Data Script
 * This script helps you quickly populate the database with sample data for testing
 * 
 * Usage:
 * 1. Ensure server is running
 * 2. Update the variables below with your actual values
 * 3. Run: node test-data.js
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000';
const TEST_USER = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
};

let authToken = '';
let botId = '';

// Sample properties for testing
const sampleProperties = [
    {
        location: 'DHA Phase 5, Lahore',
        price: 15000000,
        currency: 'PKR',
        bedrooms: 3,
        size: '10 Marla',
        propertyType: 'House',
        description: 'Beautiful 3 bedroom house with modern amenities in prime DHA location',
        amenities: ['Parking', 'Garden', 'Security', '24/7 Water', 'Gas']
    },
    {
        location: 'Bahria Town, Karachi',
        price: 8500000,
        currency: 'PKR',
        bedrooms: 2,
        size: '5 Marla',
        propertyType: 'House',
        description: 'Compact 2 bedroom house perfect for small families',
        amenities: ['Parking', 'Security', 'Electricity Backup']
    },
    {
        location: 'F-11 Markaz, Islamabad',
        price: 25000000,
        currency: 'PKR',
        bedrooms: 4,
        size: '1 Kanal',
        propertyType: 'House',
        description: 'Luxurious 4 bedroom house with all modern facilities',
        amenities: ['Parking', 'Garden', 'Gym', 'Security', 'Swimming Pool']
    },
    {
        location: 'Gulberg III, Lahore',
        price: 12000000,
        currency: 'PKR',
        bedrooms: 3,
        size: '7 Marla',
        propertyType: 'House',
        description: 'Elegant house in the heart of Gulberg',
        amenities: ['Parking', 'Security', 'Nearby Hospitals', 'Shopping Centers']
    },
    {
        location: 'Clifton Block 2, Karachi',
        price: 18000000,
        currency: 'PKR',
        bedrooms: 3,
        size: '2500 SQFT',
        propertyType: 'Apartment',
        description: 'Sea view apartment in prestigious Clifton area',
        amenities: ['Parking', 'Security', 'Gym', 'Swimming Pool', 'Sea View']
    }
];

// Helper function for API calls
async function apiCall(method, endpoint, data = null, useAuth = false) {
    try {
        const config = {
            method,
            url: `${API_URL}${endpoint}`,
            headers: {}
        };

        if (useAuth && authToken) {
            config.headers['Authorization'] = `Bearer ${authToken}`;
        }

        if (data) {
            config.data = data;
            config.headers['Content-Type'] = 'application/json';
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
}

// Step 1: Register user
async function registerUser() {
    console.log('📝 Registering test user...');
    try {
        await apiCall('POST', '/api/auth/register', TEST_USER);
        console.log('✅ User registered successfully');
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('ℹ️  User already exists, skipping registration');
        } else {
            throw error;
        }
    }
}

// Step 2: Login
async function loginUser() {
    console.log('🔐 Logging in...');
    const data = await apiCall('POST', '/api/auth/login', {
        email: TEST_USER.email,
        password: TEST_USER.password
    });
    authToken = data.token;
    console.log('✅ Logged in successfully');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
}

// Step 3: Create chatbot
async function createChatbot() {
    console.log('🤖 Creating chatbot...');
    const data = await apiCall('POST', '/api/chatbot/create', {
        name: 'Real Estate AI Agent',
        welcomeMessage: 'Assalam o Alaikum! Main aapki property search mein madad karunga. Aap mujhe apni requirements batayein - budget, location, aur bedrooms ki taadad.',
        aiSettings: {
            model: 'gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 500,
            responseLanguage: 'mixed' // English + Roman Urdu
        },
        leadCapture: {
            enabled: true,
            fields: ['name', 'email', 'phone', 'budget'],
            whatsappEnabled: false, // Set to true if Twilio is configured
            emailEnabled: false // Set to true if email is configured
        }
    }, true);
    
    botId = data.chatbot.botId;
    console.log('✅ Chatbot created successfully');
    console.log(`   Bot ID: ${botId}`);
    console.log(`   Name: ${data.chatbot.name}`);
}

// Step 4: Add properties
async function addProperties() {
    console.log('🏠 Adding sample properties...');
    let successCount = 0;
    
    for (const property of sampleProperties) {
        try {
            await apiCall('POST', `/api/chatbot/${botId}/add-property`, property, true);
            successCount++;
            console.log(`   ✅ Added: ${property.location} (${property.bedrooms} BR, ${property.price.toLocaleString()} ${property.currency})`);
        } catch (error) {
            console.log(`   ❌ Failed to add: ${property.location}`);
            console.error(error.message);
        }
    }
    
    console.log(`✅ Added ${successCount}/${sampleProperties.length} properties`);
}

// Step 5: Add knowledge base
async function addKnowledgeBase() {
    console.log('📚 Adding knowledge base...');
    
    const knowledgeBase = [
        {
            text: `
            Property Units Conversion:
            - 1 Marla = 272.25 Square Feet (SQFT)
            - 1 Kanal = 20 Marla = 5445 SQFT
            - 1 Acre = 8 Kanal
            
            Common property sizes in Pakistan:
            - 3 Marla: Small residential plot
            - 5 Marla: Standard house size
            - 7-10 Marla: Medium-sized houses
            - 1 Kanal: Large luxury houses
            
            Popular locations in Lahore:
            - DHA (Defence Housing Authority): Premium area with excellent facilities
            - Bahria Town: Gated community with modern amenities
            - Gulberg: Commercial and residential hub
            - Johar Town: Affordable residential area
            - Model Town: Established residential area
            
            Popular locations in Karachi:
            - DHA: Multiple phases with excellent security
            - Bahria Town: Modern planned community
            - Clifton: Upscale beachfront area
            - Gulshan-e-Iqbal: Middle-class residential
            
            Popular locations in Islamabad:
            - F Sectors: Government developed sectors (F-6, F-7, F-10, F-11)
            - G Sectors: Commercial areas
            - DHA: Premium residential
            - Bahria Town: Gated community
            `
        },
        {
            text: `
            Property Investment Tips:
            
            1. Location is Key
            - Choose areas with good infrastructure
            - Check proximity to schools, hospitals, markets
            - Verify legal status and NOC
            
            2. Budget Planning
            - Consider 10-15% extra for registration and taxes
            - Factor in renovation costs if buying old property
            - Check bank loan eligibility
            
            3. Documentation
            - Verify original property papers
            - Check for pending dues (water, electricity, gas)
            - Ensure clear title deed
            
            4. Market Trends
            - Real estate appreciates 10-15% annually in Pakistan
            - Prime locations have higher appreciation
            - Off-plan properties offer better prices
            `
        }
    ];
    
    for (const kb of knowledgeBase) {
        try {
            await apiCall('POST', `/api/chatbot/${botId}/upload-knowledge`, {
                text: kb.text
            }, true);
            console.log('   ✅ Added knowledge base entry');
        } catch (error) {
            console.log('   ❌ Failed to add knowledge base');
            console.error(error.message);
        }
    }
    
    console.log('✅ Knowledge base added');
}

// Step 6: Publish chatbot
async function publishChatbot() {
    console.log('🚀 Publishing chatbot...');
    await apiCall('PATCH', `/api/chatbot/${botId}/publish`, {
        isPublished: true
    }, true);
    console.log('✅ Chatbot published successfully');
}

// Step 7: Test chat
async function testChat() {
    console.log('💬 Testing chat functionality...');
    
    const testMessages = [
        'Hello',
        'I need a 3 bedroom house in DHA Lahore under 2 crore',
        'What about Bahria Town properties?'
    ];
    
    for (const message of testMessages) {
        console.log(`\n   User: ${message}`);
        try {
            const response = await apiCall('POST', `/api/chatbot/${botId}/chat`, {
                message,
                sessionId: 'test_session_' + Date.now()
            });
            console.log(`   Bot: ${response.response.substring(0, 100)}${response.response.length > 100 ? '...' : ''}`);
            
            if (response.propertyMatches && response.propertyMatches.length > 0) {
                console.log(`   📍 Properties matched: ${response.propertyMatches.length}`);
            }
        } catch (error) {
            console.log('   ❌ Chat failed:', error.message);
        }
    }
}

// Main execution
async function main() {
    console.log('\n🎯 Starting Test Data Setup\n');
    console.log('=' .repeat(50));
    console.log('');

    try {
        await registerUser();
        await loginUser();
        await createChatbot();
        await addProperties();
        await addKnowledgeBase();
        await publishChatbot();
        await testChat();
        
        console.log('\n');
        console.log('=' .repeat(50));
        console.log('✅ Test Data Setup Complete!\n');
        console.log('📋 Next Steps:');
        console.log(`   1. Test widget: http://localhost:5000/widget/demo.html`);
        console.log(`   2. Update botId in demo.html to: ${botId}`);
        console.log(`   3. Open demo.html and chat with the bot`);
        console.log(`   4. Check leads: GET /api/chatbot/${botId}/leads`);
        console.log('\n');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

// Check if axios is available
try {
    require.resolve('axios');
} catch (e) {
    console.error('❌ axios is not installed');
    console.log('Please run: npm install axios');
    process.exit(1);
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { main };
