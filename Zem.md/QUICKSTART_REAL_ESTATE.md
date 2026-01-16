# 🏡 Real Estate AI Chatbot - Quick Start Guide

## ✅ System Status: **90% MVP READY**

Your AI-powered Real Estate Chatbot Builder is ready to use! Here's how to start in **5 minutes**.

---

## 🚀 Step 1: Setup Environment (2 minutes)

### 1.1 Install Dependencies
```powershell
cd backend
npm install
```

### 1.2 Configure Environment
```powershell
# Copy the example file
cp .env.example .env
```

### 1.3 Edit `.env` file with your keys:

**REQUIRED (Must Have):**
```env
OPENAI_API_KEY=sk-your-openai-key-here
```
👉 Get it from: https://platform.openai.com/api-keys

**OPTIONAL (For WhatsApp notifications):**
```env
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```
👉 Get it from: https://console.twilio.com

---

## 🏃 Step 2: Start the System (30 seconds)

### Option A: Using PowerShell Script (Recommended)
```powershell
.\start.ps1
```

### Option B: Manual Start
```powershell
# Terminal 1 - Start MongoDB (if installed locally)
mongod

# Terminal 2 - Start Backend
cd backend
npm start
```

✅ Server will run on: http://localhost:5000

---

## 🧪 Step 3: Test the API (Using PowerShell)

### 3.1 Register a User
```powershell
$body = @{
    name = "Ahmed Ali"
    email = "ahmed@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

**Save the JWT token from response!**

### 3.2 Login
```powershell
$body = @{
    email = "ahmed@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

$token = $response.token
Write-Host "Token: $token"
```

### 3.3 Create Real Estate Chatbot
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    name = "Real Estate Bot"
    welcomeMessage = "Assalam o Alaikum! Property dhundh rahe hain?"
    systemPrompt = @"
You are 'PropAgent', an intelligent Real Estate Assistant.

**Core Rules:**
1. Use mix of English and Roman Urdu (e.g., "Ji bilkul", "Great choice")
2. Ask about budget, location, bedrooms
3. Recommend properties from database only
4. Capture contact info (phone/email)
5. No fake properties - if not in list, say "Maaf kijiye, abhi available nahi hai"

**Context:**
Understand: Marla, Kanal, Crore, Lakh, Registry, Inteqal
"@
} | ConvertTo-Json

$chatbot = Invoke-RestMethod -Uri "http://localhost:5000/api/chatbot/create" `
    -Method Post `
    -Headers $headers `
    -Body $body

$botId = $chatbot.botId
Write-Host "Bot ID: $botId" -ForegroundColor Green
```

### 3.4 Add Properties (Real Estate Listings)
```powershell
# Property 1: DHA Lahore House
$property1 = @{
    location = "DHA Phase 5, Lahore, Pakistan"
    price = 15000000
    priceMin = 14000000
    priceMax = 16000000
    currency = "PKR"
    bedrooms = 5
    size = "10 Marla"
    sizeUnit = "Marla"
    sizeSqft = 5445
    propertyType = "House"
    titleStatus = "Registry Available"
    description = "Beautiful 5 bedroom house with modern amenities in DHA Phase 5"
    amenities = @("Parking", "Lawn", "Security", "Servant Quarter")
    images = @("https://example.com/house1.jpg")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/chatbot/$botId/add-property" `
    -Method Post `
    -Headers $headers `
    -Body $property1

# Property 2: Bahria Town Islamabad
$property2 = @{
    location = "Bahria Town Phase 4, Islamabad, Pakistan"
    price = 8000000
    priceMin = 7500000
    priceMax = 8500000
    currency = "PKR"
    bedrooms = 3
    size = "5 Marla"
    sizeUnit = "Marla"
    sizeSqft = 2722
    propertyType = "House"
    titleStatus = "Inteqal Ready"
    description = "Corner 3 bedroom house, park facing, prime location"
    amenities = @("Corner", "Park Facing", "Security", "Main Boulevard")
    images = @("https://example.com/house2.jpg")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/chatbot/$botId/add-property" `
    -Method Post `
    -Headers $headers `
    -Body $property2

# Property 3: Karachi Flat
$property3 = @{
    location = "Clifton Block 2, Karachi, Pakistan"
    price = 12000000
    priceMin = 11000000
    priceMax = 13000000
    currency = "PKR"
    bedrooms = 3
    size = "1800"
    sizeUnit = "SQFT"
    sizeSqft = 1800
    propertyType = "Flat"
    titleStatus = "Registry Available"
    description = "Sea facing 3 bedroom flat with lift and parking"
    amenities = @("Sea View", "Lift", "Parking", "Generator")
    images = @("https://example.com/flat1.jpg")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/chatbot/$botId/add-property" `
    -Method Post `
    -Headers $headers `
    -Body $property3

Write-Host "✅ Added 3 properties!" -ForegroundColor Green
```

### 3.5 Publish the Chatbot
```powershell
$body = @{
    isPublished = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/chatbot/$botId/publish" `
    -Method Patch `
    -Headers $headers `
    -Body $body

Write-Host "🚀 Chatbot Published!" -ForegroundColor Green
```

---

## 💬 Step 4: Test the Chat (NO AUTH REQUIRED)

```powershell
# Test chat
$body = @{
    message = "Mujhe 3 bedroom ka ghar chahiye DHA Lahore mein, budget 1.5 crore hai"
    sessionId = "test_session_$(Get-Random)"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/chatbot/$botId/chat" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

Write-Host "`nBot Response:" -ForegroundColor Cyan
Write-Host $response.response
```

**Example Conversation:**
```
User: "Mujhe 3 bedroom ka ghar chahiye DHA Lahore mein, budget 1.5 crore hai"

Bot: "Ji bilkul! Main aapke liye DHA mein properties dhundta hun.
      Aapka budget 1.5 Crore hai. Kya aap 5 bedroom consider karenge? 
      Hamare paas ek zabardast option hai DHA Phase 5 mein."

User: "Haan, details dikhao"

Bot: "📍 Location: DHA Phase 5, Lahore
      💰 Price: 1.5 Cr (Negotiable)
      🏠 Type: House
      🛏️ Bedrooms: 5
      📐 Size: 10 Marla
      
      Kya main aapke liye site visit arrange karun? 
      Please apna phone number share karein."
```

---

## 🌐 Step 5: Test the Widget

### 5.1 Open Demo Page
```powershell
# Open in browser
Start-Process "http://localhost:5000/widget/demo.html"
```

### 5.2 Update Widget with Your Bot ID

Edit `widget/demo.html` (line 140):
```javascript
ChatbotWidget.init({
    botId: 'YOUR_BOT_ID_HERE',  // 👈 Replace with your $botId
    apiUrl: 'http://localhost:5000',
    primaryColor: '#4A90E2',
    position: 'bottom-right'
});
```

### 5.3 Embed on Any Website
```html
<!-- Add before </body> tag -->
<script src="http://localhost:5000/widget/chatbot.js"></script>
<script>
  ChatbotWidget.init({
    botId: 'YOUR_BOT_ID_HERE',
    apiUrl: 'http://localhost:5000',
    primaryColor: '#4A90E2'
  });
</script>
```

---

## 📊 View Captured Leads

```powershell
# Get all leads for this chatbot
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/chatbot/$botId/leads" `
    -Method Get `
    -Headers $headers

$response | Format-Table -Property name, email, phone, budget, location, quality
```

---

## 📋 Property Data Template (Excel/Google Sheets)

Create a CSV file with this structure:

| Location | Price | Currency | Bedrooms | Size | SizeUnit | PropertyType | TitleStatus | Amenities | Images |
|----------|-------|----------|----------|------|----------|--------------|-------------|-----------|---------|
| DHA Phase 5, Lahore | 15000000 | PKR | 5 | 10 Marla | Marla | House | Registry Available | Parking,Lawn,Security | url1,url2 |
| Bahria Town Phase 4 | 8000000 | PKR | 3 | 5 Marla | Marla | House | Inteqal Ready | Corner,Park Facing | url1 |

---

## 🔔 WhatsApp Notification Setup (Optional)

### Get Twilio Credentials:
1. Go to https://console.twilio.com
2. Sign up for free trial ($15 credit)
3. Get: Account SID, Auth Token
4. Enable WhatsApp Sandbox

### Add to `.env`:
```env
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

**When a lead is captured, you'll get WhatsApp message:**
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

---

## 🎯 What You Have Now:

✅ **Backend API** - Fully functional
✅ **AI Chat** - GPT-4o-mini integration
✅ **Property Matching** - Smart filters
✅ **Lead Capture** - Auto-detect contact info
✅ **WhatsApp Alerts** - Instant notifications
✅ **Embeddable Widget** - Add to any website
✅ **Multi-language** - English/Urdu/Hindi

---

## 🔴 What's NOT Done Yet (10%):

❌ **Admin Dashboard** - The `frontend/index.html` is just UI mockup
❌ **Payment System** - Stripe integration not active
❌ **Analytics Charts** - No graphs/metrics yet

---

## 💰 Pricing Strategy

### For Pakistani Market:
- **Free**: 30 messages/month
- **Starter**: Rs 1,500/month (1K messages)
- **Pro**: Rs 5,000/month (10K messages)
- **Business**: Rs 10,000/month (Unlimited)

### For Global Market:
- **Free**: 30 messages/month
- **Starter**: $9/month
- **Pro**: $29/month
- **Business**: $49/month

---

## 🚀 Next Steps to Launch:

### For Testing (Do Now):
1. ✅ Test all API endpoints (Done above)
2. ✅ Test widget on local website
3. ✅ Add 10-20 real properties
4. ✅ Test on mobile browser
5. ✅ Test WhatsApp notifications

### For Beta Launch (Week 1-2):
1. 🔴 Build admin dashboard (React/Vue)
2. 🔴 Add analytics endpoints
3. 🔴 Deploy to Heroku/Railway
4. 🔴 Get 5 beta customers (Real Estate agents)

### For Full Launch (Week 3-4):
1. 🔴 Integrate Stripe payments
2. 🔴 Create landing page
3. 🔴 Marketing materials
4. 🔴 Launch on Product Hunt

---

## 🏆 First Customer Pitch (Copy-Paste)

```
"Uncle/Sir,

Main AI chatbot bana raha hun Real Estate agents ke liye.

Ye chatbot:
✅ 24/7 customers ke sawal ka jawab dega
✅ Budget aur location ke mutabiq property recommend karega
✅ Jab koi customer interested ho, turant aapko WhatsApp par notification milega
✅ Aapki website par sirf 2 line code se lag jayega

Kya main 1 hafte ke liye FREE trial de sakta hun aapko?
Agar pasand aye toh sirf Rs 2,000/month."
```

---

## 📞 Support

### Common Errors:

**"OpenAI API key invalid"**
```powershell
# Check if key is set
Get-Content backend\.env | Select-String "OPENAI_API_KEY"
```

**"MongoDB connection failed"**
```powershell
# Check if MongoDB is running
Get-Process mongod
```

**"Bot not responding"**
- Check if bot is published: `isPublished: true`
- Check botId is correct
- Check browser console for errors

### Debug Mode:
```env
# Add to .env
DEBUG=true
NODE_ENV=development
```

---

## 📚 Documentation

- **Full Setup**: See `SETUP.md`
- **Project Status**: See `PROJECT_STATUS.md`
- **API Docs**: See `backend/routes/chatbot.js`

---

## 🎉 YOU'RE READY!

Your system is **90% complete**. The backend, AI, widget - everything works!

**What you need NOW:**
1. OpenAI API key
2. 5 minutes to setup
3. First real estate agent to test with

**Kaam shuru karo! Best of luck! 🚀**

---

**Last Updated:** December 2025
**Version:** 2.0.0
**Status:** ✅ MVP READY FOR TESTING
