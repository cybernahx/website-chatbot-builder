# MongoDB Setup Instructions

Your backend server requires MongoDB to run. You have two options:

## Option 1: MongoDB Atlas (Cloud - Recommended for Quick Start)

1. **Create Free Account**
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Sign up for a free account (no credit card required)

2. **Create Cluster**
   - Click "Build a Database"
   - Select "Free" tier (M0)
   - Choose a cloud provider and region closest to you
   - Click "Create"

3. **Configure Access**
   - **Database Access**: Create a database user
     - Click "Database Access" in left sidebar
     - Add new user with username/password
     - Select "Read and write to any database"
   
   - **Network Access**: Allow your IP
     - Click "Network Access" in left sidebar
     - Add IP Address
     - For development, click "Allow Access from Anywhere" (0.0.0.0/0)
     - ⚠️ In production, restrict to specific IPs

4. **Get Connection String**
   - Go to "Database" → "Connect"
   - Select "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

5. **Update .env File**
   ```env
   ```
   - Replace `<password>` with your database user password
   - Add `/chatbot-builder` before the `?` to specify database name

## Option 2: Local MongoDB Installation

### Windows

1. **Download MongoDB**
   - Go to https://www.mongodb.com/try/download/community
   - Download MongoDB Community Server (Windows version)

2. **Install**
   - Run the installer
   - Choose "Complete" installation
   - Install as Windows Service (recommended)
   - Install MongoDB Compass (optional GUI tool)

3. **Verify Installation**
   ```powershell
   mongod --version
   ```

4. **Start MongoDB Service** (if not running)
   ```powershell
   net start MongoDB
   ```

5. **Your .env is already configured for local MongoDB:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/chatbot-builder
   ```

### macOS (using Homebrew)

```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify
mongod --version
```

### Linux (Ubuntu/Debian)

```bash
# Import MongoDB public GPG Key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Test Your Connection

After setting up MongoDB, test your backend:

```powershell
# Start backend
cd backend
npm start

# You should see:
# ✅ MongoDB connected successfully
# 🗄️  Database: chatbot-builder
# 🚀 Server running on port 5000
```

## Troubleshooting

### Error: "MongoDB connection error"
- **Atlas**: Check connection string, username, password, and IP whitelist
- **Local**: Ensure MongoDB service is running (`net start MongoDB` on Windows)

### Error: "MongoNetworkError"
- Check internet connection (for Atlas)
- Verify firewall isn't blocking MongoDB ports (27017 for local)

### Error: "Authentication failed"
- Double-check username and password in connection string
- Ensure user has proper permissions in Atlas

## Quick Commands

```powershell
# Check if MongoDB service is running (Windows)
Get-Service -Name MongoDB

# Start MongoDB service (Windows)
net start MongoDB

# Stop MongoDB service (Windows)
net stop MongoDB

# Check MongoDB process
Get-Process -Name mongod
```

## Next Steps

Once MongoDB is connected:
1. Run the automated test: `.\test-real-estate-bot.ps1`
2. Access the dashboard: http://localhost:5000 (after starting frontend)
3. View widget demo: http://localhost:5000/widget/demo.html

---

💡 **Recommendation**: Use MongoDB Atlas for the quickest setup. It's free, requires no installation, and works immediately.
