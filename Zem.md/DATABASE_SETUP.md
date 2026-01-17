# 🗄️ Database Setup Guide

## Choose ONE Option:

---

## ✅ **Option 1: MongoDB Atlas (Cloud - Recommended for Quick Start)**

### Free tier: 512MB storage (enough for 1000+ chatbots)

### Steps:

1. **Create Account**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up with Google/GitHub (fastest)

2. **Create Free Cluster**
   - Click "Build a Database"
   - Select **FREE** tier (M0 Sandbox)
   - Choose region closest to you
   - Cluster name: `chatbot-builder`
   - Click "Create"

3. **Setup Database Access**
   - Go to "Database Access" (left menu)
   - Click "Add New Database User"
   - Username: `admin`
   - Password: `YourSecurePassword123`
   - Select "Built-in Role" → "Read and write to any database"
   - Click "Add User"

4. **Setup Network Access**
   - Go to "Network Access" (left menu)
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Confirm

5. **Get Connection String**
   - Go to "Database" → Click "Connect"
   - Select "Connect your application"
   - Copy the connection string:
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your actual password

6. **Update .env File**
   ```env


✅ **Done! No installation needed.**

---

## 🖥️ **Option 2: Local MongoDB (Windows)**

### For developers who want local control

### Step 1: Download MongoDB
```powershell
# Download MongoDB Community Edition
# Visit: https://www.mongodb.com/try/download/community
# Select: Windows, Version 7.0, MSI
```

### Step 2: Install MongoDB
```powershell
# Run installer
# Choose "Complete" installation
# Install MongoDB as a Service (check this option)
# Install MongoDB Compass (optional GUI tool)
```

### Step 3: Start MongoDB Service
```powershell
# Check if MongoDB service is running
Get-Service MongoDB

# If not running, start it
Start-Service MongoDB

# Check status
Get-Service MongoDB | Select-Object Status, Name, DisplayName
```

### Step 4: Verify Installation
```powershell
# Test MongoDB connection
mongosh --eval "db.version()"
```

### Step 5: Update .env File
```env
MONGODB_URI=mongodb://localhost:27017/chatbot-builder
```

✅ **Done! MongoDB running locally.**

---

## 🚨 Quick Check

After setting up, test your connection:

```powershell
cd backend
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test').then(() => console.log('✅ MongoDB Connected!')).catch(err => console.log('❌ Error:', err));"
```

---

## 💡 Which Option Should You Choose?

| Feature | Atlas (Cloud) | Local |
|---------|--------------|-------|
| **Setup Time** | 5 minutes | 15 minutes |
| **Internet Required** | Yes | No |
| **Free Tier** | 512MB | Unlimited |
| **Backups** | Automatic | Manual |
| **Best For** | Production, Quick Start | Development |

**Recommendation:** Use **MongoDB Atlas** for now. You can always switch later.

---

## ⚡ After Database Setup

Run these commands:

```powershell
# 1. Create .env file (if not exists)
cd backend
cp .env.example .env

# 2. Edit .env and add your MongoDB URI

# 3. Install dependencies
npm install

# 4. Start server
npm start

# 5. Run test script
cd ..
.\test-real-estate-bot.ps1
```

---

## 🐛 Troubleshooting

### MongoDB Atlas:

**"MongoServerError: bad auth"**
- Check password in connection string
- Ensure user has correct permissions

**"Connection timeout"**
- Check Network Access allows your IP
- Try "Allow Access from Anywhere"

### Local MongoDB:

**"mongod command not found"**
- Add to PATH: `C:\Program Files\MongoDB\Server\7.0\bin`

**"Service not starting"**
```powershell
# Check logs
Get-EventLog -LogName Application -Source MongoDB -Newest 10
```

---

## 🎯 Next Step

Once database is connected:
```powershell
.\test-real-estate-bot.ps1
```

This will create a fully functional Real Estate chatbot with sample properties!
