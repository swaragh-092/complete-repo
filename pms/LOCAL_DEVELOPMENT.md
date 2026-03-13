# Running PMS Locally (Outside Docker)

This guide explains how to run the PMS server locally on your machine for faster development, while still connecting to Dockerized services (PostgreSQL, Redis, auth-service, etc.).

## Prerequisites

1. **Docker services must be running:**

   ```bash
   cd /home/admin/Desktop/full-arch/complete-repo
   docker compose up -d
   ```

2. **Node.js and npm installed** on your local machine

## Setup Steps

### 1. Install Dependencies

```bash
cd pms
npm install
```

### 2. Configure Environment Variables

Copy the local development environment file:

```bash
cp .env.local .env
```

The `.env.local` file is pre-configured with:

- Database pointing to Docker PostgreSQL on `localhost:5411`
- Keycloak on `localhost:8081`
- Auth-service on `localhost:4000`
- Redis on `localhost:6379`
- No `DOCKER_ENV` variable (signals local development mode)

### 3. Start the PMS Server

```bash
npm start
```

The server will start on **http://localhost:3015**

## Verify It's Working

1. **Check server startup logs:**

   ```
   [ServiceClients] Configuration: {
     isLocalDevelopment: true,
     KEYCLOAK_URL: 'http://localhost:8081',
     AUTH_SERVICE_URL: 'http://localhost:4000',
     ...
   }
   ```

2. **Test health endpoint:**

   ```bash
   curl http://localhost:3015/health
   ```

3. **Test authenticated endpoint** (with browser cookies from final-fn-pms):
   ```bash
   curl http://localhost:3015/pms/projects \
     -H "Cookie: access_token=YOUR_TOKEN_HERE" \
     --include
   ```

## How It Works

### Service Detection

The `serviceClients.js` automatically detects if you're running locally:

```javascript
const isLocalDevelopment = !process.env.DOCKER_ENV;

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL ||
  (isLocalDevelopment ? "http://localhost:4000" : "http://auth-service:4000");
```

- **Local mode**: Uses `localhost` URLs to connect to Docker-exposed ports
- **Docker mode**: Uses Docker service names (e.g., `auth-service:4000`)

### Authentication Flow

1. **Frontend** (https://final-fn-pms.local.test:7000) sends requests with cookies
2. **PMS middleware** extracts `access_token` from cookie/header
3. **Auth-service validation**: Calls `http://localhost:4000/auth/me` to validate token and get user details
4. **User context populated**: `req.user` contains full user data (id, email, name, organizations, roles, etc.)

## Development Workflow

### Hot Reload

The server uses `nodemon` for automatic restarts on file changes:

```bash
npm start  # Watches for changes and auto-restarts
```

### Debugging

Add breakpoints or `console.log()` statements directly in your code:

```javascript
// pms/services/task/task.service.js
console.log("User ID:", req.user.id);
console.log("User details:", req.user);
```

### API Documentation

Access Swagger docs at: **http://localhost:3015/api-docs**

## Connecting Frontend to Local PMS

If you want the frontend to use your local PMS instead of the Docker container:

1. **Update frontend .env:**

   ```bash
   cd ../final-fn-pms
   ```

2. **Edit `.env` or `.env.local`:**

   ```env
   VITE_PMS_API_URL=http://localhost:3015/pms
   ```

3. **Restart frontend:**
   ```bash
   npm run dev
   ```

## Common Issues

### Issue: "No access token provided"

**Cause**: Cookies not being sent from frontend

**Solution**:

- Ensure frontend is sending `credentials: "include"`
- Check CORS configuration in `pms/app.js`
- Verify `access_token` cookie exists in browser DevTools

### Issue: "Invalid or expired token"

**Cause**: Token validation failing

**Solutions**:

- Check auth-service is running: `docker ps | grep auth-service`
- Verify Keycloak is accessible: `curl http://localhost:8081/health`
- Re-login to get fresh tokens

### Issue: "User details not showing in frontend"

**Cause**: Backend not fetching user details from auth-service

**Solutions**:

- Check service client credentials in `.env`:
  ```env
  SERVICE_CLIENT_ID=pms-service
  SERVICE_CLIENT_SECRET=dV2ljSAo1fiYtobOoOjrSEJiMXtcshyg
  ```
- Verify auth-service `/auth/internal/users/lookup` endpoint is accessible
- Check PMS logs for user lookup errors

### Issue: Database connection failed

**Cause**: PostgreSQL not accessible

**Solutions**:

- Ensure db-pms container is running: `docker ps | grep db-pms`
- Verify port 5411 is accessible: `nc -zv localhost 5411`
- Check database credentials in `.env`

## Switching Back to Docker

To run PMS in Docker again:

1. **Stop local server**: `Ctrl+C` in terminal

2. **Comment out or remove the PORT mapping** in `docker-compose.yml` if you want to prevent conflicts

3. **Start Docker services**:
   ```bash
   cd /home/admin/Desktop/full-arch/complete-repo
   docker compose up -d pms
   ```

## Benefits of Local Development

✅ **Faster iteration**: No Docker rebuild/restart needed  
✅ **Better debugging**: Direct access to logs and debugger  
✅ **Hot reload**: Automatic server restart on code changes  
✅ **IDE integration**: Breakpoints, step-through debugging  
✅ **Faster startup**: No container overhead

## Limitations

⚠️ **Network differences**: Local `localhost` vs Docker internal networking  
⚠️ **Environment parity**: Ensure `.env.local` matches Docker `.env` settings  
⚠️ **Port conflicts**: Ensure port 3015 is not already in use

---

## Next Steps

- Run tests: `npm test`
- Check code style: `npm run lint` (if configured)
- View API docs: http://localhost:3015/api-docs
- Monitor logs: Watch console output for debugging info
