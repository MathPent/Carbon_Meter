# CarbonMeter Authentication System - Bug Fix & Forgot Password Feature

## 📋 Summary

This document details the **critical password bug fix** and the implementation of a **complete 3-step forgot password feature** using Email OTP.

---

## 🐛 PART 1: INVALID PASSWORD BUG FIX

### Problem

Users were getting "Invalid password" error even after entering the correct password during login. This was happening only for accounts created through the **3-step registration flow** (`/register/create-password`).

### Root Cause

**Double-hashing of passwords** in the User model:

1. **During Registration (3-step flow)**:

   - Password was manually hashed using bcrypt (line 283 in auth.js)
   - `user.password = await bcrypt.hash(password, salt)`
   - Then saved to database

2. **Pre-save Hook Issue**:

   - User.js has a pre-save hook that automatically hashes passwords
   - When the already-hashed password was saved, it got hashed **again**
   - Result: **Double-hashed password in database**

3. **During Login**:
   - User enters plain-text password
   - `comparePassword()` tries: `bcrypt.compare(plainPassword, doubleHashedPassword)`
   - **Fails** because plainPassword (hashed once) doesn't match doubleHashedPassword (hashed twice)

### Solution Implemented

Modified the pre-save hook in [User.js](models/User.js) to **detect already-hashed passwords**:

```javascript
// Hash password before saving ONLY if password is new/modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    // ⚠️ CRITICAL FIX: Check if password is already hashed
    // Hashed passwords start with $2a$, $2b$, or $2y$ (bcrypt format)
    // If it's already hashed, DON'T hash again
    if (this.password.startsWith("$2")) {
      console.log("✅ Password already hashed, skipping bcrypt");
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log("🔐 Password hashed with bcrypt");
    next();
  } catch (error) {
    next(error);
  }
});
```

### Key Points

- ✅ Detects bcrypt hash format (`$2a$`, `$2b$`, `$2y$`)
- ✅ Skips hashing if password is already hashed
- ✅ Works for both legacy and 3-step registration
- ✅ Works for forgot password feature
- ✅ No changes needed to login logic

### Testing the Fix

1. **Register** using 3-step registration flow
2. **Enter password** during Step 3
3. **Login** with the same password → Should work now ✅

---

## 🔐 PART 2: FORGOT PASSWORD FEATURE (3-STEP EMAIL OTP)

### Overview

Complete forgot password flow using Email OTP with 3 distinct steps.

### Architecture

```
Frontend (React)              Backend (Node.js)              Email (Gmail/Nodemailer)
─────────────────────────────────────────────────────────────────────────────────

Step 1: Request Reset
   User enters email
        ↓
   registerSendOtp()  ──→  POST /auth/forgot-password
        ↓                      • Check user exists
   Generate OTP      ←──      • Generate 6-digit OTP
   Show OTP screen           • Save OTP (5-min TTL)
                             • Send email
                                  ↓
                            nodemailer → Gmail
                                  ↓
                            User receives OTP

Step 2: Verify OTP
   User enters 6-digit OTP
        ↓
   verifyResetOtp()  ──→  POST /auth/verify-reset-otp
        ↓                      • Check OTP validity
   Show password            • Check expiry (300s)
   creation screen          • Mark as verified (no password change yet)

Step 3: Reset Password
   User enters new password + confirmation
        ↓
   resetPassword()    ──→  POST /auth/reset-password
        ↓                      • Validate password strength
   Validate strength        • Hash new password (bcrypt)
        ↓                      • Update user in DB
   Redirect to login        • Delete OTP
        ↓                      • Return success
   LOGIN with new password
```

### API Endpoints

#### 1️⃣ STEP 1: Request Password Reset

```
POST /api/auth/forgot-password

REQUEST:
{
  "email": "user@example.com"
}

RESPONSE (Success):
{
  "message": "If this email exists, a password reset OTP has been sent",
  "email": "user@example.com",
  "expiresIn": "5 minutes",
  "nextStep": "verify-reset-otp"
}

STATUS CODES:
- 200: OTP sent (or user doesn't exist - security measure)
- 400: Invalid email format
- 500: Email sending failed
```

#### 2️⃣ STEP 2: Verify Reset OTP

```
POST /api/auth/verify-reset-otp

REQUEST:
{
  "email": "user@example.com",
  "otp": "123456"
}

RESPONSE (Success):
{
  "message": "OTP verified successfully!",
  "email": "user@example.com",
  "verified": true,
  "expiresIn": "248 seconds",
  "nextStep": "reset-password"
}

STATUS CODES:
- 200: OTP verified
- 401: Invalid OTP or expired
- 400: Missing fields
```

#### 3️⃣ STEP 3: Reset Password

```
POST /api/auth/reset-password

REQUEST:
{
  "email": "user@example.com",
  "newPassword": "SecurePass123",
  "confirmNewPassword": "SecurePass123"
}

RESPONSE (Success):
{
  "message": "✅ Password reset successful! You can now login with your new password.",
  "email": "user@example.com",
  "nextStep": "login"
}

STATUS CODES:
- 200: Password reset successful
- 400: Invalid password format or mismatch
- 401: User not found or OTP expired
- 500: Server error
```

---

## 📝 Password Validation Rules

All password validations follow these rules:

### Registration & Reset Password

```
✓ Minimum 8 characters
✓ At least one uppercase letter (A-Z)
✓ At least one lowercase letter (a-z)
✓ At least one number (0-9)
✗ Special characters (not required but allowed)
```

### Password Strength Indicator (Frontend)

- 🔴 **Weak**: Less than 8 characters
- 🟡 **Medium**: 8+ characters but missing requirements
- 🟢 **Strong**: All requirements met

---

## 📱 Frontend Implementation

### Updated Files

#### 1. [frontend/src/pages/LoginPage.js](frontend/src/pages/LoginPage.js)

- Added "Forgot Password?" button below password field
- Navigates to `/forgot-password` page

#### 2. [frontend/src/pages/ForgotPasswordPage.js](frontend/src/pages/ForgotPasswordPage.js) - **NEW**

Three-step UI component:

**Step 1 - Email Input**

- Email validation
- "Send Password Reset OTP" button
- Back to login link

**Step 2 - OTP Verification**

- 6-digit OTP input field
- 5-minute countdown timer
- "Resend OTP" button (appears after 3 minutes)
- Back button to email step

**Step 3 - New Password**

- New password input with show/hide toggle
- Confirm password input with show/hide toggle
- Password strength indicator (Weak/Medium/Strong)
- Validation for minimum length and character types
- "Reset Password" button
- Back button to OTP step
- Auto-redirect to login on success

#### 3. [frontend/src/api.js](frontend/src/api.js)

Added three new API methods:

```javascript
// Forgot Password Flow
forgotPassword: (data) => axios.post(`${API_URL}/auth/forgot-password`, data),
verifyResetOtp: (data) => axios.post(`${API_URL}/auth/verify-reset-otp`, data),
resetPassword: (data) => axios.post(`${API_URL}/auth/reset-password`, data),
```

#### 4. [frontend/src/App.js](frontend/src/App.js)

Added new route:

```javascript
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
```

---

## 🔧 Backend Implementation

### Updated Files

#### 1. [backend/src/models/User.js](backend/src/models/User.js) - **CRITICAL FIX**

Modified pre-save hook to prevent double-hashing:

```javascript
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    // Check if password is already hashed (bcrypt format: $2a$, $2b$, $2y$)
    if (this.password.startsWith("$2")) {
      console.log("✅ Password already hashed, skipping bcrypt");
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log("🔐 Password hashed with bcrypt");
    next();
  } catch (error) {
    next(error);
  }
});
```

#### 2. [backend/src/routes/auth.js](backend/src/routes/auth.js) - **FORGOT PASSWORD ADDED**

Three new routes:

**POST /auth/forgot-password** (Step 1)

- Validates email format
- Checks if user exists (security: doesn't reveal if email exists)
- Generates 6-digit OTP
- Saves OTP with 5-minute TTL
- Sends OTP via email
- Returns success message

**POST /auth/verify-reset-otp** (Step 2)

- Validates OTP format (6 digits)
- Checks OTP validity
- Checks OTP expiry (300 seconds)
- Does NOT change password (only verifies)
- Returns success message

**POST /auth/reset-password** (Step 3)

- Validates password requirements
- Checks passwords match
- Validates password strength regex
- Hashes new password with bcrypt (10-round salt)
- Updates user password in database
- Deletes OTP record
- Returns success message and login redirect

#### 3. [backend/src/utils/sendOtp.js](backend/src/utils/sendOtp.js) - **ENHANCED**

Updated `sendOtpEmail()` to support multiple email purposes:

```javascript
sendOtpEmail(email, otp, (purpose = "Registration"));
```

- **Purpose: 'Registration'** - Default signup OTP email
- **Purpose: 'Password Reset'** - Password reset OTP email

Both have:

- Professional HTML template with CarbonMeter branding
- Dynamic subject based on purpose
- Security warnings appropriate for use case
- 5-minute expiry timer
- Clear instructions
- Dark green (#193827) color scheme

---

## 🔒 Security Features

### Password Security

- ✅ **Bcrypt Hashing**: 10-round salt (industry standard)
- ✅ **No Double-Hashing**: Fixed with hash detection in pre-save hook
- ✅ **Password Strength**: Enforced minimum 8 chars + uppercase + lowercase + numbers
- ✅ **HTTPS Ready**: All endpoints support HTTPS in production

### OTP Security

- ✅ **6-Digit OTP**: 1 million possible combinations
- ✅ **5-Minute Expiry**: Automatic deletion via MongoDB TTL index
- ✅ **Single Use**: OTP deleted after successful reset
- ✅ **Email Verification**: Only OTP via email (no SMS)
- ✅ **User Enumeration Prevention**: Same response whether email exists or not

### Session Security

- ✅ **JWT Tokens**: 7-day expiry
- ✅ **Secure Headers**: CORS, XSS protection
- ✅ **No Password in Response**: Never sent in API responses
- ✅ **Audit Logging**: All password changes logged

---

## 🧪 Testing Guide

### Test Case 1: Fix the Invalid Password Bug

```
1. Use registration form → Enter password "SecurePass123"
2. Complete 3-step registration
3. Login with email and "SecurePass123" → Should work ✅
4. Try wrong password "WrongPass123" → Should fail ✅
```

### Test Case 2: Forgot Password - Happy Path

```
Step 1:
1. Go to /forgot-password
2. Enter registered email → Click "Send Password Reset OTP"
3. Check email for 6-digit OTP

Step 2:
4. Enter OTP → Click "Verify OTP"
5. Should see password creation screen

Step 3:
6. Enter new password "NewPass@123"
7. Confirm password "NewPass@123"
8. Click "Reset Password"
9. Should redirect to login
10. Login with new password "NewPass@123" → Should work ✅
```

### Test Case 3: OTP Expiry

```
1. Request password reset OTP
2. Wait 5+ minutes
3. Try to verify OTP → Should get "OTP expired" error ✅
4. Click "Resend OTP" → Should get new OTP ✅
```

### Test Case 4: Invalid Password Format

```
1. At password reset step, try:
   - Password "short" → Error: Too short ✅
   - Password "alllowercase123" → Error: Needs uppercase ✅
   - Password "ALLUPPERCASE123" → Error: Needs lowercase ✅
   - Password "NoNumbers" → Error: Needs numbers ✅
   - Password "ValidPass123" → Success ✅
```

### Test Case 5: OTP Resend

```
1. Request OTP
2. Wait 3-5 minutes (before timer expires)
3. Should see "Resend OTP" button
4. Click "Resend OTP" → Should send new OTP ✅
5. Timer should reset to 5 minutes ✅
```

---

## 🚀 Deployment Checklist

- [ ] Verify `.env` has correct `EMAIL` and `EMAIL_PASS`
- [ ] Test registration creates accounts with working passwords
- [ ] Test login with correct password works
- [ ] Test login with incorrect password fails
- [ ] Test forgot password flow end-to-end
- [ ] Check MongoDB for TTL index on Otp collection
- [ ] Verify email sends successfully with new subject lines
- [ ] Test OTP expiry (5-minute TTL)
- [ ] Test password strength validation
- [ ] Monitor logs for error messages

---

## 📊 Database Changes

### Otp Collection

Already exists with TTL index:

```javascript
{
  email: String,
  otp: String,
  createdAt: Date, // TTL index: 300 seconds
  purpose: String  // 'registration' or 'password-reset'
}
```

### User Collection

No schema changes needed - `password` field remains the same:

```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String, // Now properly hashed (no double-hashing)
  role: String,
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎨 UI/UX Features

### ForgotPasswordPage

- **Dark Green (#193827) Branding**: Matches CarbonMeter design
- **Step Indicators**: "Step 1 of 3" etc.
- **Progress Tracking**: Clear which step you're on
- **Error Messages**: Color-coded (red for errors, green for success)
- **Timer Display**: Real-time countdown "5:00" → "0:30" → "Expired"
- **Resend Button**: Appears only when timer expires
- **Show/Hide Password**: Toggle to see password while typing
- **Password Strength Indicator**: Visual bar with color (🔴 Weak, 🟡 Medium, 🟢 Strong)
- **Back Buttons**: Navigate between steps easily
- **Disabled Buttons**: Submit buttons disabled until valid data entered
- **Loading States**: Shows "⏳ Sending..." during API calls

### LoginPage Updates

- **Forgot Password Link**: New button below password field
- **Easy Navigation**: One click to forgot password flow

---

## 📚 Code Comments

All code includes detailed comments explaining:

- ✅ Why each validation exists
- ✅ What each step does
- ✅ Security considerations
- ✅ Error codes and responses
- ✅ Why the bug happened and how it was fixed

---

## 🔍 Debugging Tips

### Password Not Working After Fix

1. **Delete existing accounts** created before the fix
2. **Re-register** to create new accounts with correct password hashing
3. **Login should work** with the new account

### OTP Not Sending

1. Check `.env` has correct `EMAIL` and `EMAIL_PASS`
2. Verify Gmail App Password (not regular password)
3. Check backend logs for nodemailer errors
4. Ensure Gmail account has 2FA enabled

### OTP Expired Immediately

1. Check server time matches database time
2. Verify MongoDB TTL index exists on Otp collection
3. Check OTP expiry logic (should be 300 seconds = 5 minutes)

### Password Reset Not Updating

1. Verify user exists in database
2. Check OTP was verified before password reset
3. Verify bcrypt is hashing correctly (check backend logs)
4. Confirm new password meets strength requirements

---

## 📞 Support & Maintenance

### Common Issues & Solutions

| Issue                          | Cause                  | Solution                                     |
| ------------------------------ | ---------------------- | -------------------------------------------- |
| "Invalid credentials" on login | Password double-hashed | Fix in User.js applied - re-register         |
| OTP not received               | Email not configured   | Update `.env` with correct Gmail credentials |
| "OTP expired" too quickly      | TTL index wrong        | Verify MongoDB TTL index (300s)              |
| Password strength error        | Too weak               | Min 8 chars + upper + lower + number         |
| Double hashing again           | Using old code         | Clear cache, restart server                  |

---

## 🎯 Next Steps

1. **Restart Backend Server** (`npm run dev`)
2. **Test Password Login** with existing account
3. **Test Complete Registration** → Password should work
4. **Test Forgot Password** end-to-end
5. **Deploy to Production** with confidence ✅

---

## 📝 Version History

| Version | Date       | Changes                                                                |
| ------- | ---------- | ---------------------------------------------------------------------- |
| 1.0     | 2026-01-15 | Initial implementation of password bug fix and forgot password feature |

---

**Made with ❤️ for secure authentication in CarbonMeter**
