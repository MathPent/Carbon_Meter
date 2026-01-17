# 📧 Email OTP Verification Backend Setup

Complete, production-ready Email OTP verification system for CarbonMeter using **Nodemailer + Gmail**.

---

## 🎯 What's Implemented

✅ **OTP Generation & Storage**

- 6-digit random OTP generated per registration
- Auto-expires in 5 minutes (MongoDB TTL)
- One OTP per email at a time

✅ **Email Sending (Nodemailer)**

- Beautiful HTML email templates
- Uses Gmail (FREE - requires App Password)
- Styled with CarbonMeter branding
- Includes expiry timer and security warnings

✅ **User Registration Flow**

1. User provides email → `/send-otp` → OTP sent
2. User enters OTP + password → `/verify-otp` → User created & verified
3. User can login → `/login` → JWT token issued

✅ **Security**

- Passwords hashed with bcrypt (10-round salt)
- JWT tokens for session management
- OTP expires automatically
- Input validation on all routes
- Email verification before login

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── models/
│   │   ├── User.js          # User schema with isVerified field
│   │   └── Otp.js           # OTP schema with 5-min TTL
│   ├── routes/
│   │   └── auth.js          # POST /send-otp, /verify-otp, /login
│   ├── utils/
│   │   └── sendOtp.js       # Nodemailer setup + OTP email template
│   ├── controllers/
│   │   └── authController.js # Original auth methods (backward compat)
│   ├── config/
│   │   └── database.js      # MongoDB connection
│   └── server.js            # Express setup
├── package.json
└── .env
```

---

## 🚀 Setup Instructions

### Step 1: Get Gmail App Password (FREE)

This is the MOST IMPORTANT step. Regular Gmail password won't work!

1. **Enable 2-Factor Authentication:**

   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password:**

   - Go to: https://myaccount.google.com/apppasswords
   - Device: Windows Computer
   - App: Mail
   - Copy the 16-character password (remove spaces)

3. **Example:**
   ```
   Original: ab cd ef gh ij kl mn op
   Use this: abcdefghijklmnop
   ```

### Step 2: Update .env File

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/carbometer
JWT_SECRET=your_super_secret_jwt_key_12345
NODE_ENV=development
GOOGLE_CLIENT_ID=581625905028-c2833ro3e72e5g8aq7m7l8t3anhrhlln.apps.googleusercontent.com

# CRITICAL: Gmail credentials
EMAIL=your_gmail@gmail.com              # Your Gmail address
EMAIL_PASS=abcdefghijklmnop             # 16-char App Password (NOT regular password!)
```

### Step 3: Restart Backend

```bash
cd CarbonMeter/backend
npm run dev
```

You should see: `Server running on port 5000` ✅

---

## 📡 API Endpoints

### 1️⃣ Send OTP to Email

**Endpoint:** `POST /api/auth/send-otp`

**Request:**

```json
{
  "email": "user@gmail.com"
}
```

**Response:**

```json
{
  "message": "OTP sent successfully to your email",
  "email": "user@gmail.com"
}
```

**What happens:**

- ✅ Checks if user already exists
- ✅ Generates 6-digit OTP
- ✅ Saves OTP to DB (expires in 5 mins)
- ✅ Sends styled email with OTP

---

### 2️⃣ Verify OTP & Create Account

**Endpoint:** `POST /api/auth/verify-otp`

**Request:**

```json
{
  "email": "user@gmail.com",
  "otp": "123456",
  "firstName": "John",
  "lastName": "Doe",
  "password": "password123",
  "role": "Individual"
}
```

**Response:**

```json
{
  "message": "Email verified successfully! Account created.",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "email": "user@gmail.com",
    "role": "Individual",
    "isVerified": true
  }
}
```

**What happens:**

- ✅ Validates OTP matches database
- ✅ Checks OTP hasn't expired
- ✅ Hashes password with bcrypt
- ✅ Creates user in MongoDB
- ✅ Deletes used OTP
- ✅ Returns JWT token

---

### 3️⃣ Login with Email & Password

**Endpoint:** `POST /api/auth/login`

**Request:**

```json
{
  "email": "user@gmail.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "email": "user@gmail.com",
    "role": "Individual",
    "isVerified": true
  }
}
```

**What happens:**

- ✅ Finds user by email
- ✅ Checks if email is verified
- ✅ Compares password with bcrypt
- ✅ Returns JWT token

---

## 🧪 Testing with Postman

### Test Flow (Do this in order):

#### 1. Send OTP

```
POST http://localhost:5000/api/auth/send-otp
Content-Type: application/json

{
  "email": "test@gmail.com"
}
```

✅ Check your email for OTP!

#### 2. Verify OTP

```
POST http://localhost:5000/api/auth/verify-otp
Content-Type: application/json

{
  "email": "test@gmail.com",
  "otp": "123456",        ← Copy from email
  "firstName": "John",
  "lastName": "Doe",
  "password": "password123",
  "role": "Individual"
}
```

✅ You'll get a JWT token!

#### 3. Login

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@gmail.com",
  "password": "password123"
}
```

✅ Login successful!

---

## 🗄️ Database Collections

### users

```javascript
{
  _id: ObjectId,
  firstName: "John",
  lastName: "Doe",
  email: "john@gmail.com",
  password: "$2a$10$...", // Hashed with bcrypt
  role: "Individual",
  isVerified: true,       // NEW field
  phone: "+1234567890",
  country: "USA",
  createdAt: Date,
  updatedAt: Date
}
```

### otps

```javascript
{
  _id: ObjectId,
  email: "john@gmail.com",
  otp: "123456",
  createdAt: Date       // AUTO-DELETES after 5 minutes (TTL index)
}
```

---

## 🔒 Security Features

✅ **Password Security**

```
Plain password: "password123"
Stored as: "$2a$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5YmMxSUiqkN1K"
```

- bcrypt with 10-round salt
- Passwords never stored plain text
- Compared safely during login

✅ **OTP Security**

- 6-digit (1 million combinations)
- Expires in 5 minutes
- One OTP per email
- Deleted after use

✅ **Email Verification**

- Users MUST verify email before login
- Unverified users cannot access features

✅ **JWT Tokens**

- Expires in 7 days
- Signed with JWT_SECRET
- Cannot be forged without secret

---

## ⚠️ Common Issues & Solutions

### ❌ "Failed to send OTP email"

**Problem:** EMAIL or EMAIL_PASS is incorrect

**Solution:**

1. Double-check Gmail credentials in .env
2. Make sure you used **App Password**, NOT regular password
3. Verify 2-Factor Authentication is enabled

### ❌ "Invalid or expired OTP"

**Problem:** OTP entered wrong or expired (>5 mins)

**Solution:**

- Request a new OTP
- OTP expires after 5 minutes
- Only one OTP per email

### ❌ "User already registered with this email"

**Problem:** Email already has verified account

**Solution:**

- Use a different email
- Or login with existing account

### ❌ "Please verify your email first"

**Problem:** Trying to login before OTP verification

**Solution:**

- Complete the OTP verification step
- Call `/verify-otp` endpoint

---

## 📊 Email Template Preview

The OTP email includes:

- CarbonMeter branding (logo + tagline)
- Clear 6-digit OTP display
- 5-minute expiry timer
- Security warnings
- Call-to-action
- Footer with copyright

---

## 🚀 Production Checklist

Before deploying:

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Use proper Gmail account (create a business account)
- [ ] Update `NODE_ENV=production`
- [ ] Enable HTTPS only
- [ ] Add rate limiting to prevent OTP spam
- [ ] Monitor email sending logs
- [ ] Add email bounce handling
- [ ] Consider upgrade to SendGrid/AWS SES for scale

---

## 📚 File Reference

### User.js

- Schema with `isVerified` field (NEW)
- Password hashing pre-save
- Compare password method

### Otp.js

- Schema with email + otp fields
- TTL index set to 300 seconds (5 minutes)
- Automatically removed by MongoDB

### sendOtp.js

- `generateOtp()` - Creates 6-digit OTP
- `sendOtpEmail()` - Sends via Nodemailer
- HTML template with CarbonMeter branding

### auth.js routes

- `POST /send-otp` - Generate & send OTP
- `POST /verify-otp` - Verify OTP & create account
- `POST /login` - Login with email/password
- `POST /register` - Original method (backward compat)
- `POST /google-login` - Google OAuth (existing)

---

## 💡 Next Steps

1. ✅ Update frontend to use new OTP endpoints
2. ✅ Add OTP input UI component
3. ✅ Add email verification status indicator
4. ✅ Add "Resend OTP" button (with cooldown)
5. ✅ Add password reset via OTP

---

## 📞 Support

All endpoints return structured JSON responses with:

- `message` - Human-readable message
- `token` - JWT token (if authenticated)
- `user` - User object
- `error` - Error details (if failed)

Happy coding! 🚀
