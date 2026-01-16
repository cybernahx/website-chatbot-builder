# AI Real Estate Chatbot Builder - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ and npm
- MongoDB 4.4+
- OpenAI API key
- Twilio account (for WhatsApp notifications)

### Installation

1. **Clone and Install Dependencies**
```bash
cd backend
npm install
```

2. **Configure Environment Variables**
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
- `OPENAI_API_KEY` - Get from https://platform.openai.com/api-keys
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Generate a random 32+ character string
- `TWILIO_ACCOUNT_SID` & `TWILIO_AUTH_TOKEN` - From https://console.twilio.com
- `EMAIL_USER` & `EMAIL_PASSWORD` - Gmail app password

3. **Start MongoDB**
```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongodb
```

4. **Run the Server**
```bash
cd backend
npm start
```

Server will start on http://localhost:5000

### 🏠 Real Estate Chatbot Features

✅ **AI-Powered Chat** - GPT-4o-mini for natural conversations
✅ **PDF Knowledge Base** - Upload property brochures, FAQs
✅ **Smart Property Matching** - Budget, location, bedroom filters
✅ **Lead Capture** - Automatic WhatsApp + Email notifications
✅ **Multi-Language** - English, Roman Urdu, Hindi support
✅ **Embeddable Widget** - Add to any website with 3 lines of code

### 📝 API Endpoints

#### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login user

#### Chatbot Management
- `POST /api/chatbot/create` - Create new chatbot
- `POST /api/chatbot/:botId/upload-knowledge` - Upload PDF
- `POST /api/chatbot/:botId/add-property` - Add property listing
- `POST /api/chatbot/:botId/chat` - Chat endpoint (PUBLIC)
- `GET /api/chatbot/:botId/leads` - Get captured leads
- `PATCH /api/chatbot/:botId/publish` - Publish/unpublish

### 🔧 Testing the Chatbot

1. **Register a User**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

2. **Create a Chatbot**
```bash
curl -X POST http://localhost:5000/api/chatbot/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Real Estate Bot","welcomeMessage":"Hello! Looking for a property?"}'
```

3. **Upload Knowledge Base**
```bash
curl -X POST http://localhost:5000/api/chatbot/BOT_ID/upload-knowledge \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@property-brochure.pdf"
```

4. **Add a Property**
```bash
curl -X POST http://localhost:5000/api/chatbot/BOT_ID/add-property \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "DHA Phase 5, Lahore",
    "price": 15000000,
    "currency": "PKR",
    "bedrooms": 3,
    "size": "10 Marla",
    "propertyType": "House"
  }'
```

5. **Test Chat (PUBLIC - no auth required)**
```bash
curl -X POST http://localhost:5000/api/chatbot/BOT_ID/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"I need a 3 bedroom house in DHA under 2 crore","sessionId":"test_session_123"}'
```

### 🌐 Embed Widget on Website

Add this code to your website's HTML:

```html
<!-- Add before </body> -->
<script src="http://localhost:5000/widget/chatbot.js"></script>
<script>
  ChatbotWidget.init({
    botId: 'YOUR_BOT_ID_HERE',
    apiUrl: 'http://localhost:5000',
    primaryColor: '#4A90E2',
    position: 'bottom-right'
  });
</script>
```

### 📊 Real Estate Data Structure

**Property Object:**
```javascript
{
  "location": "DHA Phase 5, Lahore",
  "price": 15000000,
  "currency": "PKR",
  "bedrooms": 3,
  "size": "10 Marla",
  "propertyType": "House",
  "description": "Beautiful 3 bedroom house with modern amenities",
  "images": ["url1", "url2"],
  "amenities": ["Parking", "Garden", "Security"]
}
```

**Supported Units:** Marla, Kanal, SQFT, Square Yards
**Currencies:** PKR, USD, INR, AED

### 🔔 WhatsApp Lead Notifications

When a user shows interest (provides contact info), the system:
1. Captures lead in database
2. Sends WhatsApp notification via Twilio
3. Sends email notification
4. Quality scores the lead (1-5)

**Example WhatsApp Message:**
```
🎯 *New Lead from Real Estate Bot!*

👤 Name: Ahmed Khan
📧 Email: ahmed@example.com
📱 Phone: +923001234567

💰 Budget: 1.5 Cr - 2 Cr PKR
📍 Location: DHA Lahore
🏠 Type: House
🛏️ Bedrooms: 3

⭐ Quality: 4/5
🕐 Time: 2024-01-15 14:30
```

### 🧪 Testing Checklist

- [ ] User registration works
- [ ] Chatbot creation returns botId
- [ ] PDF upload extracts text correctly
- [ ] Properties can be added
- [ ] Chat endpoint returns AI response
- [ ] Property matching works with filters
- [ ] Lead capture triggers on contact info
- [ ] WhatsApp notification sent
- [ ] Email notification sent
- [ ] Widget loads on demo.html

### 🐛 Troubleshooting

**"OpenAI API error"**
- Check `OPENAI_API_KEY` in .env
- Verify API key has credits

**"Twilio authentication failed"**
- Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
- Check WhatsApp sandbox approval

**"MongoDB connection failed"**
- Ensure MongoDB is running: `mongod`
- Check connection string in .env

**"Widget not loading"**
- Verify botId is correct
- Check CORS settings in server.js
- Open browser console for errors

### 📦 Deployment

**Backend (Heroku/Railway/Render):**
1. Set all environment variables
2. Ensure MongoDB Atlas is configured
3. Update `FRONTEND_URL` for CORS

**Widget:**
- Update `apiUrl` in widget init to production URL
- Serve widget.js from CDN for faster loading

### 🔐 Security Best Practices

- Change `JWT_SECRET` to random 32+ char string
- Use strong passwords for MongoDB
- Enable MongoDB authentication
- Add rate limiting (already configured)
- Use HTTPS in production
- Restrict CORS to specific domains

### 💰 Cost Estimation

**OpenAI API (GPT-4o-mini):**
- ~$0.00015 per chat message
- 1000 messages = ~$0.15

**Twilio WhatsApp:**
- $0.005 per message (US)
- 1000 notifications = ~$5

**Recommended Pricing:**
- Free: 30 messages/month
- Starter: $9/month (1K messages)
- Pro: $29/month (10K messages)
- Business: $49/month (50K messages)

### 📞 Support

For issues or questions:
- Check logs: `backend/server.log`
- MongoDB logs: `mongod.log`
- OpenAI dashboard for API errors
- Twilio console for SMS logs

---

**Version:** 2.0.0  
**Last Updated:** 2024-01-15  
**License:** MIT
