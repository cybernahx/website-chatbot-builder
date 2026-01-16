# 🔐 SaaS Admin Login Credentials

## Default Admin Account

This is the **SaaS Owner / Super Admin** account created during setup.

### Login Details

| Field | Value |
|-------|-------|
| **Email** | `admin@chatbotbuilder.com` |
| **Password** | `adminpassword123` |
| **Role** | Super Admin |
| **Plan** | Enterprise (Unlimited) |

---

## How to Login

1. Go to: `http://localhost:3000/admin_login.html`
2. Enter Email: `admin@chatbotbuilder.com`
3. Enter Password: `adminpassword123`
4. Click "Login to Dashboard"

---

## What Admin Can Access

### 👥 User Management
- View all registered users
- View user details and activity
- Upgrade/downgrade user plans
- Suspend or delete user accounts
- Export user data

### 🤖 Chatbot Management
- View all chatbots created by all users
- Monitor chatbot usage
- Analytics for all chatbots
- Performance metrics
- Delete problematic chatbots

### 👨‍💼 Lead Management
- View all leads from all chatbots
- Export lead data
- Lead quality metrics
- Lead source analytics
- Track lead conversions

### 📊 Analytics & Reports
- System-wide analytics
- User growth charts
- Revenue metrics
- API usage statistics
- Performance monitoring

### 💳 Billing & Payments
- View all subscriptions
- Manage Stripe integration
- Process manual payments
- View billing history
- Refund management

### ⚙️ System Settings
- Configure app settings
- Manage API keys
- Email template configuration
- WhatsApp integration settings
- Payment gateway settings

### 📈 Dashboard Overview
- Total users count
- Total chatbots count
- Total leads count
- Monthly revenue
- System health status
- Recent activity feed

---

## Admin Features

### User Statistics
- Active users
- Total revenue
- Conversion rates
- Most popular features
- Geographic distribution

### Performance Monitoring
- API response times
- Database performance
- Error tracking
- User activity logs
- System alerts

### Reporting
- Monthly reports
- User engagement metrics
- Revenue analytics
- Feature usage stats
- Custom date range reports

---

## Security Notes

⚠️ **IMPORTANT for Production:**

1. **Change Default Password** 
   - After first login, change the admin password to something strong
   - Min 12 characters with mixed case, numbers, and symbols

2. **Enable 2FA (Two-Factor Authentication)**
   - Use authenticator app (Google Authenticator, Authy)
   - Backup codes should be saved securely

3. **Regular Backups**
   - Database backups every 24 hours
   - Backup stored in secure location
   - Test restore process monthly

4. **Audit Logs**
   - All admin actions logged
   - Login attempts tracked
   - Changes to user data recorded
   - Export logs regularly

5. **IP Whitelisting**
   - Add admin IP to whitelist in production
   - Restrict access from known IPs only

---

## Creating Additional Admins

To create another admin user, use this script:

```bash
cd backend
node scripts/make_user_admin.js
```

You'll be prompted for:
- User email
- User password (if new user)
- Confirmation

---

## Troubleshooting

### Can't Login?

1. **Check Backend is Running**
   ```bash
   # Make sure server is running on port 5000
   npm start
   ```

2. **Check Database Connection**
   - Verify MongoDB is running
   - Check MONGODB_URI in .env

3. **Clear Browser Cache**
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   // Reload page
   ```

4. **Check Auth Middleware**
   - Verify JWT_SECRET in .env
   - Check token expiration (7 days default)

### Forgot Password?

1. Stop the server
2. Run: `node scripts/make_user_admin.js`
3. Choose "Reset admin password"
4. Set new password
5. Restart server

---

## API Access

### Admin Authentication
```bash
# Login API
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@chatbotbuilder.com",
    "password": "adminpassword123"
  }'

# Response includes token
# Use token: Authorization: Bearer <token>
```

### Admin Endpoints
```
GET  /api/admin/users         - List all users
GET  /api/admin/users/:id     - Get user details
GET  /api/admin/chatbots      - List all chatbots
GET  /api/admin/leads         - List all leads
GET  /api/admin/stats         - System statistics
GET  /api/admin/analytics     - Analytics data
POST /api/admin/settings      - Update settings
```

---

## Next Steps

1. ✅ Login to admin dashboard
2. ✅ Change default password
3. ✅ Configure payment settings
4. ✅ Set up email notifications
5. ✅ Create user plans and pricing
6. ✅ Enable WhatsApp integration
7. ✅ Setup analytics monitoring

---

**Created:** December 5, 2025
**Status:** ✅ ACTIVE
