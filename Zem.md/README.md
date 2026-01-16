# 🏡 AI Real Estate Chatbot Builder

**Status:** ✅ **90% MVP Ready** | **Ready for Beta Testing**

A specialized AI-powered chatbot platform for Real Estate businesses. Upload property data, train your AI agent, and capture high-quality leads 24/7.

---

## 🎯 **What This Does**

Your clients (Real Estate agents) can:
1. **Upload** property listings (PDF, Excel, or manual entry)
2. **Train** an AI chatbot that understands Roman Urdu/English
3. **Embed** the chatbot on their website (3 lines of code)
4. **Get** instant WhatsApp notifications when leads are captured

### **The Magic:**
- User asks: "Mujhe DHA mein 3 bedroom house chahiye, budget 1.5 crore"
- Bot matches properties, shows options with images
- Bot captures contact info (phone/email)
- Agent gets WhatsApp notification: "🎯 New Lead! Ahmed Khan, +92300..."

---

## ✨ **Key Features**

### ✅ **Already Working:**
- 🤖 **AI Chat** - OpenAI GPT-4o-mini integration
- 📄 **PDF Upload** - Extract property details from brochures
- 🏠 **Smart Property Matching** - Budget, location, bedroom filters
- 📱 **WhatsApp Alerts** - Instant lead notifications (Twilio)
- 📧 **Email Notifications** - Lead capture alerts
- 🌐 **Embeddable Widget** - Modern, mobile-responsive chat UI
- 🇵🇰 **Multi-language** - English, Roman Urdu, Hindi support
- 🔐 **Secure** - JWT auth, rate limiting, helmet.js

### 🔴 **Not Done Yet (10%):**
- ❌ Admin Dashboard UI (frontend mockup exists)
- ❌ Payment System (Stripe skeleton ready)
- ❌ Analytics Charts

---

## 🚀 **Quick Start (5 Minutes)**

### **Prerequisites:**
- Node.js 14+
- OpenAI API Key ([Get it here](https://platform.openai.com/api-keys))
- MongoDB (Atlas Cloud FREE tier recommended)

### **Setup:**

```powershell
# 1. Setup Database (Choose ONE):
#    See: DATABASE_SETUP.md

# 2. Configure Environment
cd backend
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 3. Install Dependencies
npm install

# 4. Start Server
npm start

# 5. Run Automated Test
cd ..
.\test-real-estate-bot.ps1
```

✅ **That's it!** Your chatbot is live on http://localhost:5000

---

## 📚 **Documentation**

| File | Purpose |
|------|---------||
| **[DATABASE_SETUP.md](../DATABASE_SETUP.md)** | MongoDB Atlas vs Local setup |
| **[QUICKSTART_REAL_ESTATE.md](../QUICKSTART_REAL_ESTATE.md)** | Complete testing guide |
| **[SETUP.md](SETUP.md)** | API documentation |
| **[PROJECT_STATUS.md](../PROJECT_STATUS.md)** | Feature completion status |

---

## 📂 **Project Structure**

```
📁 backend/
  ├── models/          # MongoDB schemas
  │   ├── User.js      # Auth system
  │   ├── Chatbot.js   # Bot config + properties
  │   └── Lead.js      # Captured leads
  ├── routes/          # API endpoints
  ├── services/        # AI, WhatsApp, Email
  ├── server.js        # Express app
  └── package.json

📁 frontend/           # Admin UI (30% done)
📁 widget/             # Embeddable chatbot (100%)
📁 Zem.md/             # Documentation
```

---

## 🎯 **Business Model**

### **Your Target Market:**
Real Estate agents who:
- Miss calls/messages (24/7 availability issue)
- Answer same questions repeatedly
- Need lead capture automation
- Have websites but no chat support

### **Pricing Strategy:**

**Pakistani Market:**
- 🆓 Free: 30 messages/month
- 💵 Starter: Rs 1,500/month
- 💎 Pro: Rs 5,000/month
- 🏆 Business: Rs 10,000/month

**Global Market:**
- 🆓 Free: 30 messages/month
- 💵 Starter: $9/month
- 💎 Pro: $29/month
- 🏆 Business: $49/month

### **Revenue Math:**
- 40 users × $29 = **$1,160/month**
- 10 users × $49 = **$490/month**
- **Total: $1,650/month**

### **Your Costs:**
- OpenAI: ~$5/month
- Twilio: ~$5/month
- Hosting: $5-7/month
- **Total: ~$15/month**

## 📖 Usage

### Creating a Chatbot

1. **Open the Builder**: Navigate to `frontend/index.html`
2. **Configure Settings**: 
   - Set bot name
   - Customize welcome message
   - Choose primary color
   - Upload avatar (optional)
3. **Build Flow**:
   - Drag components from the sidebar
   - Drop them on the canvas
   - Connect nodes to create conversation flow
   - Configure each node's properties
4. **Preview**: Click "Preview" to test your chatbot
5. **Publish**: Click "Publish" to get embed code

### Embedding the Widget

Add this code to your website before the closing `</body>` tag:

```html
<script src="https://your-domain.com/widget/chatbot.js"></script>
<script>
  ChatbotWidget.init({
    botId: 'your-bot-id',
    primaryColor: '#4A90E2',
    position: 'bottom-right'
  });
</script>
```

## 🔧 API Endpoints

### Chatbot Management

- `GET /api/chatbots/:userId` - Get all chatbots for a user
- `GET /api/chatbot/:botId` - Get specific chatbot
- `POST /api/chatbot` - Create new chatbot
- `PUT /api/chatbot/:botId` - Update chatbot
- `DELETE /api/chatbot/:botId` - Delete chatbot
- `PATCH /api/chatbot/:botId/publish` - Publish/unpublish chatbot

### Chat

- `POST /api/chat/:botId` - Send message to chatbot
- `GET /api/conversations/:botId` - Get chat history

### Health Check

- `GET /api/health` - Server health status

## 🎨 Widget Configuration

```javascript
ChatbotWidget.init({
  botId: 'your-bot-id',           // Required
  apiUrl: 'https://api.example.com', 
  primaryColor: '#4A90E2',        
  position: 'bottom-right',       // bottom-right, bottom-left, etc.
  theme: 'light'                  // light or dark
});
```

## 📱 Supported Node Types

1. **Text Message**: Send text messages to users
2. **Button**: Display clickable buttons with actions
3. **User Input**: Collect information from users
4. **Image**: Show images in the conversation
5. **Video**: Embed videos
6. **Carousel**: Display multiple cards/options
7. **Condition**: Branch conversation based on conditions
8. **API Call**: Integrate external APIs

## 🔐 Security Features

- Input validation and sanitization
- CORS protection
- Rate limiting (recommended for production)
- MongoDB injection prevention
- XSS protection

## 🚀 Deployment

### Backend Deployment (Heroku example)

```bash
# Install Heroku CLI
heroku login

# Create app
heroku create your-chatbot-api

# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_secret

# Deploy
git push heroku main
```

### Frontend Deployment

Deploy to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3

### Widget CDN

Host the widget script on a CDN for better performance:
- Cloudflare
- AWS CloudFront
- Fastly

## 📊 Database Schema

### Chatbot Collection
```javascript
{
  botId: String,
  userId: String,
  name: String,
  welcomeMessage: String,
  primaryColor: String,
  avatar: String,
  flow: {
    nodes: Array,
    connections: Array
  },
  isPublished: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Conversation Collection
```javascript
{
  botId: String,
  sessionId: String,
  messages: [{
    type: String,
    content: String,
    timestamp: Date
  }],
  userInfo: Object,
  createdAt: Date
}
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📝 License

This project is licensed under the MIT License.

## 🐛 Known Issues

- Flow connections visualization needs improvement
- Mobile builder interface needs optimization
- Advanced condition logic not fully implemented

## 🔮 Roadmap

- [ ] AI-powered response suggestions
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] A/B testing for chatbot flows
- [ ] Integration with popular CRM systems
- [ ] WhatsApp/Telegram integration
- [ ] Voice chat support
- [ ] Custom webhooks

## 💡 Tips for Production

1. Use environment variables for all sensitive data
2. Enable HTTPS for both frontend and backend
3. Implement rate limiting on API endpoints
4. Set up proper error logging (e.g., Sentry)
5. Use a CDN for the widget script
6. Implement caching strategies
7. Set up monitoring and alerts
8. Regular database backups
9. Implement user authentication and authorization
10. Add CAPTCHA to prevent spam

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@example.com

## 🙏 Acknowledgments

- Icons from Font Awesome
- UI inspiration from modern SaaS platforms
- Community feedback and contributions

---

Made with ❤️ for businesses to connect better with their customers
