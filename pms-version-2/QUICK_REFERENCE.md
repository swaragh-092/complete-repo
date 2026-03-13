# PMS Local Development - Quick Reference

## ✅ What Was Fixed

### 1. **Backend Middleware** - Now Gets Real User Data

- ✅ Extracts `access_token` from cookies/headers
- ✅ Calls `auth-service /auth/me` to validate and get user info
- ✅ Populates `req.user` with complete profile (id, email, name, roles, organizations)
- ✅ Proper error handling for expired/invalid tokens

**File:** `middleware/dataValidation.middleware.js`

### 2. **Local Development Setup** - Run Outside Docker

- ✅ Created `.env.local` with localhost configuration
- ✅ Auto-detects local mode (no `DOCKER_ENV` variable)
- ✅ Connects to Docker services via exposed ports
- ✅ Hot reload with nodemon for fast iteration

**Files:** `.env.local`, `start-local.sh`, `LOCAL_DEVELOPMENT.md`

### 3. **User Details Display** - Already Working!

- ✅ Backend fetches user details via `/auth/internal/users/lookup`
- ✅ Populates `user_details` for assigned/creator/approver
- ✅ Frontend displays names with fallback to IDs
- ✅ Just needed middleware fix to work properly

**Files:** `services/task/task.service.js`, `services/project/projectMember.service.js`

---

## 🚀 Quick Start Commands

### Option 1: Using the startup script

```bash
cd /home/admin/Desktop/full-arch/complete-repo/pms
./start-local.sh
```

### Option 2: Manual start

```bash
cd /home/admin/Desktop/full-arch/complete-repo/pms
cp .env.local .env
npm install
npm start
```

### Stop the server

```
Press Ctrl+C
```

---

## 📋 How to Use

### 1. Start Docker Services (if not already running)

```bash
cd /home/admin/Desktop/full-arch/complete-repo
docker compose up -d
```

### 2. Start PMS Locally

```bash
cd pms
npm start
```

### 3. Verify It's Working

**Server logs should show:**

```
✅ isLocalDevelopment: true
✅ server started at http://localhost:3015
✅ Redis connected
```

**Test health endpoint:**

```bash
curl http://localhost:3015/health
```

**Test authenticated endpoint (from browser with login):**

```
https://final-fn-pms.local.test:7000
```

---

## 🔍 What Changed in Your Code

### Before (Hardcoded):

```javascript
const authData = {
  organization_id: "b029c32f-6f40-4e87-a5fb-19b6ba435501",
  user: {
    id: "7b6709f5-57a5-48df-af22-7714598651d0",
    name: "John Doe", // Always the same!
  },
};
req.user = authData.user;
```

### After (Real User):

```javascript
// Extract token from request
const accessToken =
  req.cookies?.access_token ||
  req.headers.authorization?.replace("Bearer ", "");

// Validate with auth-service
const authenticate = await fetch(`${DOMAIN.auth}/auth/me`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});

const authData = await authenticate.json();

// Complete user profile
req.user = {
  id: authData.organizations[0].user_id,
  email: authData.email,
  name: authData.name,
  roles: authData.roles,
  organizations: authData.organizations,
  // ... and more!
};
```

---

## 🎯 Benefits You Get Now

### ✨ Faster Development

- ⚡ No Docker rebuild needed for code changes
- ⚡ Hot reload with nodemon (auto-restart)
- ⚡ Direct log access in terminal
- ⚡ IDE debugger support

### 🔒 Better Security

- 🔐 Real user authentication (not hardcoded)
- 🔐 Token validation on every request
- 🔐 Proper user context in all operations
- 🔐 Organization-based data isolation

### 🐛 Easier Debugging

- 📝 Complete user info in logs
- 📝 Clear error messages for auth failures
- 📝 Step-through debugging with IDE
- 📝 Console.log wherever you need

### 👤 User Details Display

- 👥 Names shown instead of UUIDs
- 👥 Email addresses available
- 👥 User roles and permissions accessible
- 👥 Fallback to IDs if name not available

---

## 📁 Files You Can Edit Now

### Services (with hot reload):

- `services/task/task.service.js` - Task operations
- `services/project/project.service.js` - Project operations
- `services/dailylog/dailylog.service.js` - Daily logs
- `services/notification/notification.service.js` - Notifications

### Routes (with hot reload):

- `routes/task.routes.js` - Task endpoints
- `routes/project.routes.js` - Project endpoints
- `routes/log.routes.js` - Logging endpoints

### Middleware (with hot reload):

- `middleware/dataValidation.middleware.js` - Auth & validation
- `middleware/dbConnection.middleware.js` - Database connection

**Just save the file and nodemon will auto-restart!**

---

## 🔧 Common Tasks

### View Real-Time Logs

```bash
cd pms
npm start
# Logs show in terminal
```

### Test API Endpoint

```bash
# With browser cookies (after login)
curl http://localhost:3015/pms/projects \
  -H "Cookie: access_token=YOUR_TOKEN" \
  --include
```

### Check User Authentication

```bash
# Look for this in logs:
✅ User authenticated: user@example.com ID: abc-123-def
```

### Restart Server Manually

```bash
# In the nodemon terminal, type:
rs
# Then press Enter
```

### Stop and Switch to Docker

```bash
# Press Ctrl+C to stop local server
cd ..
docker compose up -d pms
```

---

## ⚙️ Environment Variables

### Key Settings (from `.env.local`):

| Variable           | Value                   | Purpose                       |
| ------------------ | ----------------------- | ----------------------------- |
| `DB_HOST`          | `localhost`             | PostgreSQL (Docker exposed)   |
| `DB_PORT`          | `5411`                  | PostgreSQL port               |
| `KEYCLOAK_URL`     | `http://localhost:8081` | Keycloak (Docker exposed)     |
| `AUTH_SERVICE_URL` | `http://localhost:4000` | Auth service (Docker exposed) |
| `PORT`             | `3015`                  | PMS server port               |
| `DOCKER_ENV`       | _(not set)_             | Signals local development     |

---

## ❗ Troubleshooting

### "No access token provided"

**Fix:** Login at https://final-fn-pms.local.test:7000

### "Invalid or expired token"

**Fix:** Re-login to get fresh token

### "User details not showing"

**Check:**

1. Is auth-service running? `docker ps | grep auth-service`
2. Are service credentials correct in `.env`?
3. Check logs for "User lookup failed"

### Port 3015 already in use

**Fix:**

```bash
# Find what's using the port
lsof -i :3015
# Kill it or change PORT in .env
```

---

## 📚 Documentation Files

- **`LOCAL_DEVELOPMENT.md`** - Complete development guide
- **`FIXES_SUMMARY.md`** - Detailed explanation of all fixes
- **`start-local.sh`** - Automated startup script
- **`.env.local`** - Local environment template

---

## ✅ Summary

You can now:

1. ✅ Run PMS locally with hot reload
2. ✅ Get real user data from auth-service
3. ✅ See user names/emails in the UI
4. ✅ Debug easily with console logs
5. ✅ Iterate faster without Docker rebuilds

**Happy coding! 🎉**
