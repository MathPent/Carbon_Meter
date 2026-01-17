# MongoDB Atlas Setup Guide for CarbonMeter

## Overview

CarbonMeter backend has been migrated from **local MongoDB** to **MongoDB Atlas (Cloud)** for team collaboration and production readiness.

---

## Prerequisites

✅ MongoDB Atlas cluster already created: `carbonmeter-cluster`  
✅ Database user created with appropriate permissions  
✅ Network access configured (IP whitelist/VPC)

---

## Configuration Steps

### Step 1: Get Your Connection String

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Go to **Deployments** → **Clusters** → `carbonmeter-cluster`
3. Click **Connect** button
4. Select **Drivers** → **Node.js**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@carbonmeter-cluster.cjgdnje.mongodb.net/carbonmeter
   ```

### Step 2: Create Local `.env` File

1. Copy `.env.example`:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and replace placeholders:

   ```env
   MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@carbonmeter-cluster.cjgdnje.mongodb.net/carbonmeter
   PORT=5000
   JWT_SECRET=your_super_secret_jwt_key_change_in_production_12345
   NODE_ENV=development
   GOOGLE_CLIENT_ID=your_google_client_id_here
   EMAIL=your_gmail@gmail.com
   EMAIL_PASS=your_16_char_app_password_here
   ```

3. **Verify `.env` is in `.gitignore`** (CRITICAL - never commit credentials):
   ```bash
   cat .gitignore | grep .env
   ```

### Step 3: Start the Backend

```bash
npm run dev
```

Expected output:

```
✅ MongoDB Atlas connected successfully
   Cluster: carbonmeter-cluster.cjgdnje.mongodb.net
   Database: carbonmeter
Server running on port 5000
```

---

## Connection Details

### Environment Variable

- **Name**: `MONGODB_URI`
- **Format**: `mongodb+srv://<username>:<password>@carbonmeter-cluster.cjgdnje.mongodb.net/carbonmeter`
- **Source**: Read from `.env` file only (never hardcoded)

### Database Info

- **Cluster**: `carbonmeter-cluster`
- **Database**: `carbonmeter`
- **Driver**: Mongoose with async/await
- **Connection Pooling**: Enabled (max 10 connections)

---

## Architecture Changes

### Before (Local MongoDB)

```
server.js → database.js → mongodb://localhost:27017
```

### After (MongoDB Atlas)

```
server.js → database.js (centralized) → MONGODB_URI env var → MongoDB Atlas cluster
```

### Key Improvements

✅ **Single Source of Truth**: All DB logic in `src/config/database.js`  
✅ **Team-Safe**: No local MongoDB installation required  
✅ **Production-Ready**: Connection pooling, error handling, reconnection logic  
✅ **Secure**: Credentials only in environment variables, never hardcoded  
✅ **Observable**: Clear logs for debugging connections

---

## Code Changes Summary

### Updated Files

1. **`src/config/database.js`** - Complete refactor with:

   - Validation of `MONGODB_URI` environment variable at startup
   - Async/await for proper error handling
   - Connection pooling and timeout settings
   - Automatic retry logic on failure
   - Connection state event listeners

2. **`.env`** and **`.env.example`** - Updated to MongoDB Atlas format:
   - Removed `mongodb://localhost:27017`
   - Added placeholder for `mongodb+srv://` connection string
   - Added clear instructions and warnings

---

## Troubleshooting

### Error: "MONGODB_URI is not defined"

**Solution**: Create `.env` file with valid `MONGODB_URI`

### Error: "Invalid connection string"

**Check**:

- Username and password are correctly URL-encoded
- Cluster name matches: `carbonmeter-cluster`
- Connection string includes `/carbonmeter` database name

### Error: "Network access not configured"

**Fix in MongoDB Atlas**:

1. Go to **Security** → **Network Access**
2. Add your IP address or allow all IPs (0.0.0.0/0) for development

### Error: "Authentication failed"

**Check**:

- Database user username and password are correct
- User has access to `carbonmeter` database
- Credentials are properly URL-encoded in connection string

### Connection Lost During Development

**Normal behavior**: Server will attempt reconnection every 5 seconds  
**Logs**: Watch terminal for `⚠️ MongoDB connection lost` / `✅ MongoDB reconnected`

---

## Security Notes

🔒 **NEVER commit `.env` file to Git**  
🔒 **NEVER hardcode usernames, passwords, or connection strings**  
🔒 **NEVER use default/weak passwords for MongoDB Atlas user**  
🔒 **Always enable Network Access restrictions in MongoDB Atlas**

---

## For New Team Members

1. Clone the repository
2. Run `cp .env.example .env`
3. Ask team lead for `MONGODB_URI` value (from secure password manager)
4. Paste into `.env`
5. Run `npm install && npm run dev`
6. No local MongoDB installation needed! ✅

---

## API Health Check

Verify backend is connected:

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{ "status": "Backend is running" }
```

---

**Last Updated**: January 16, 2026  
**Database**: MongoDB Atlas  
**Status**: ✅ Production Ready
