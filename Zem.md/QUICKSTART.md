# Quick Start Guide - Chatbot Builder

## 5 Minutes Setup 🚀

### Step 1: Install MongoDB (if not installed)

**Windows:**
1. Download from https://www.mongodb.com/try/download/community
2. Install and start MongoDB service

**Mac:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### Step 2: Setup Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file
copy .env.example .env    # Windows
# or
cp .env.example .env      # Mac/Linux

# Start the server
npm start
```

Backend will run on: http://localhost:5000

### Step 3: Open Frontend

1. Open `frontend/index.html` in your browser
2. Or use a simple HTTP server:

```bash
# Using Python
cd frontend
python -m http.server 3000

# Using Node.js
cd frontend
npx http-server -p 3000
```

Frontend will run on: http://localhost:3000

### Step 4: Test the Widget

Open `widget/demo.html` in your browser to see the widget in action!

## First Chatbot in 3 Minutes ⚡

1. **Open Builder** (frontend/index.html)
2. **Set Bot Name**: "Support Bot"
3. **Drag Components**: 
   - Drag "Text Message" to canvas
   - Drag "Button" below it
4. **Click Preview**: Test your bot
5. **Click Publish**: Get embed code

## Common Issues & Fixes 🔧

### MongoDB Connection Error
```bash
# Start MongoDB service
# Windows: Services > MongoDB > Start
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongodb
```

### Port Already in Use
Change PORT in `.env` file:
```env
PORT=5001  # or any other available port
```

### CORS Error
Make sure backend is running and FRONTEND_URL in `.env` matches your frontend URL

## Testing the API 📡

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Create a test chatbot
curl -X POST http://localhost:5000/api/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "name": "Test Bot",
    "welcomeMessage": "Hello!"
  }'
```

## Next Steps 📚

1. **Customize Design**: Change colors, avatar, and welcome message
2. **Build Flows**: Add more complex conversation flows
3. **Test Widget**: Try the widget on a test HTML page
4. **Deploy**: Follow deployment guide in README.md

## Need Help? 💬

- Check README.md for detailed documentation
- View demo.html for widget examples
- See server.js for API endpoints

Happy Building! 🎉
