# 🚀 Deployment Guide - Chatbot Builder SaaS

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Deployment](#local-deployment)
3. [Production Deployment](#production-deployment)
4. [Database Setup](#database-setup)
5. [Security Checklist](#security-checklist)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 14+ installed
- MongoDB 4.4+ (local or cloud)
- Git installed
- Domain name (for production)

---

## Local Deployment

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (if using build tools)
cd ../frontend
npm install  # Optional - only if you add build tools later
```

### 2. Setup Environment Variables

```bash
cd backend
cp .env.example .env
```

Edit `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatbot-builder
JWT_SECRET=your_very_secure_random_32_character_secret_key_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

### 3. Start MongoDB

**Local MongoDB:**
```bash
mongod --dbpath /path/to/your/data/directory
```

**Or use MongoDB Atlas (Cloud):**
- Create account at https://www.mongodb.com/cloud/atlas
- Create cluster
- Get connection string
- Update MONGODB_URI in .env

### 4. Run Backend Server

```bash
cd backend
npm start

# Or for development with auto-reload:
npm run dev
```

Server will start at: http://localhost:5000

### 5. Run Frontend

**Option A: Simple HTTP Server**
```bash
cd frontend
python -m http.server 3000
# Or
npx http-server -p 3000
```

**Option B: VS Code Live Server**
- Install "Live Server" extension
- Right-click on `index.html`
- Select "Open with Live Server"

Frontend will be at: http://localhost:3000

---

## Production Deployment

### Option 1: Deploy to Heroku

#### Backend Deployment

1. **Create Heroku Account**: https://heroku.com

2. **Install Heroku CLI**:
```bash
npm install -g heroku
```

3. **Login to Heroku**:
```bash
heroku login
```

4. **Create Heroku App**:
```bash
cd backend
heroku create your-chatbot-backend
```

5. **Set Environment Variables**:
```bash
heroku config:set MONGODB_URI="your_mongodb_atlas_uri"
heroku config:set JWT_SECRET="your_secure_jwt_secret"
heroku config:set NODE_ENV=production
```

6. **Deploy**:
```bash
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

#### Frontend Deployment (to Vercel)

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Deploy Frontend**:
```bash
cd frontend
vercel --prod
```

3. **Update API URL in frontend files**:
- Edit `login.html`, `register.html`, `app.js`
- Change `http://localhost:5000` to your Heroku backend URL

---

### Option 2: Deploy to Railway

#### Backend + Database

1. **Create Railway Account**: https://railway.app

2. **Install Railway CLI**:
```bash
npm install -g @railway/cli
```

3. **Login**:
```bash
railway login
```

4. **Initialize Project**:
```bash
cd backend
railway init
```

5. **Add MongoDB**:
- Go to Railway dashboard
- Click "New" → "Database" → "MongoDB"
- Copy connection string

6. **Set Environment Variables**:
```bash
railway variables set MONGODB_URI="your_railway_mongodb_uri"
railway variables set JWT_SECRET="your_secret"
```

7. **Deploy**:
```bash
railway up
```

#### Frontend (to Netlify)

1. **Install Netlify CLI**:
```bash
npm install -g netlify-cli
```

2. **Deploy**:
```bash
cd frontend
netlify deploy --prod
```

---

### Option 3: Deploy to DigitalOcean/AWS

#### Using Docker

1. **Create Dockerfile** (backend):
```dockerfile
FROM node:14
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

2. **Create docker-compose.yml**:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/chatbot-builder
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
  
  mongo:
    image: mongo:4.4
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

3. **Deploy**:
```bash
docker-compose up -d
```

---

## Database Setup

### MongoDB Atlas (Recommended for Production)

1. **Create Account**: https://www.mongodb.com/cloud/atlas

2. **Create Cluster**:
   - Choose free tier (M0)
   - Select region closest to users
   - Create cluster

3. **Create Database User**:
   - Database Access → Add New Database User
   - Choose password authentication
   - Save username & password

4. **Whitelist IP**:
   - Network Access → Add IP Address
   - Choose "Allow access from anywhere" (0.0.0.0/0)
   - Or add specific IPs

5. **Get Connection String**:
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your password
   - Add to `.env` file

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/chatbot-builder?retryWrites=true&w=majority
```

---

## Security Checklist

### Before Production:

- [ ] Change JWT_SECRET to a strong random string (min 32 characters)
- [ ] Use HTTPS (SSL certificate)
- [ ] Enable CORS only for your frontend domain
- [ ] Set secure cookies (httpOnly, secure, sameSite)
- [ ] Implement rate limiting
- [ ] Add input validation & sanitization
- [ ] Enable MongoDB authentication
- [ ] Use environment variables (never commit .env)
- [ ] Implement password reset functionality
- [ ] Add email verification
- [ ] Setup error logging (Sentry, LogRocket)
- [ ] Backup database regularly
- [ ] Implement GDPR compliance (if EU users)

### Update CORS in server.js:

```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'https://yourdomain.com',
  credentials: true
};
app.use(cors(corsOptions));
```

### Add Rate Limiting:

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:**
- Ensure MongoDB is running
- Check connection string in .env
- Whitelist IP in MongoDB Atlas

**JWT Error:**
```
Error: secretOrPrivateKey must have a value
```
**Solution:**
- Set JWT_SECRET in .env file

### Frontend Issues

**CORS Error:**
```
Access to fetch at 'http://localhost:5000' blocked by CORS policy
```
**Solution:**
- Enable CORS in backend
- Check FRONTEND_URL in backend .env

**Authentication Not Working:**
- Clear browser localStorage
- Check token expiration
- Verify API_URL in frontend files

### Database Issues

**Slow Queries:**
- Add indexes to frequently queried fields
- Use MongoDB Atlas monitoring

**Out of Storage:**
- Upgrade MongoDB Atlas tier
- Archive old conversations

---

## Monitoring & Maintenance

### Recommended Tools:

1. **Uptime Monitoring**: UptimeRobot, Pingdom
2. **Error Tracking**: Sentry
3. **Analytics**: Google Analytics, Mixpanel
4. **Logging**: Winston, Morgan
5. **Performance**: New Relic, Datadog

### Regular Maintenance:

- Update dependencies monthly
- Backup database weekly
- Check error logs daily
- Monitor server resources
- Update SSL certificates

---

## Cost Estimation

### Free Tier (Development):
- MongoDB Atlas: FREE (512MB)
- Heroku: FREE (dyno sleeps after 30 mins)
- Vercel: FREE (100GB bandwidth)
- **Total: $0/month**

### Production (Small Business):
- MongoDB Atlas: $9/month (2GB)
- Railway: $5/month (backend)
- Vercel Pro: $20/month
- **Total: ~$34/month**

### Production (Enterprise):
- MongoDB Atlas: $57/month (10GB)
- AWS EC2: $50/month
- CloudFlare: $20/month
- **Total: ~$127/month**

---

## Support

For issues or questions:
- Check documentation: README.md
- Review QUICKSTART.md
- Contact: support@yourchatbot.com

---

**Last Updated**: December 2025
**Version**: 1.0.0
