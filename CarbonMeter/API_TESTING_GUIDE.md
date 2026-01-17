# 🧪 API Testing Guide - Password Bug Fix & Forgot Password

## Overview

This guide shows how to test the complete authentication system using **Postman**, **cURL**, or **Thunder Client**.

---

## 🛠️ Setup

### Base URL

```
http://localhost:5000/api
```

### Headers Required

```json
{
  "Content-Type": "application/json"
}
```

### Gmail Configuration

Email is already configured in `.env`:

- Email: `mathpent05@gmail.com`
- Password: `vgsejpalgqnufaak` (Gmail App Password)

---

## 📋 Test Scenarios

### SCENARIO 1: Test Password Bug Fix (Login)

#### Step 1: Create Account with 3-Step Registration

**1.1 - Send OTP**

```http
POST http://localhost:5000/api/auth/register/send-otp
Content-Type: application/json

{
  "firstName": "Raj",
  "lastName": "Kumar",
  "email": "raj.test@gmail.com"
}
```

Expected Response (200):

```json
{
  "message": "OTP sent successfully! Check your email.",
  "email": "raj.test@gmail.com",
  "firstName": "Raj",
  "lastName": "Kumar",
  "expiresIn": "5 minutes",
  "nextStep": "verify-otp"
}
```

**1.2 - Verify OTP**
(Copy OTP from email)

```http
POST http://localhost:5000/api/auth/register/verify-otp
Content-Type: application/json

{
  "email": "raj.test@gmail.com",
  "otp": "123456"
}
```

Expected Response (200):

```json
{
  "message": "OTP verified successfully!",
  "email": "raj.test@gmail.com",
  "verified": true,
  "nextStep": "create-password",
  "expiresIn": "280 seconds"
}
```

**1.3 - Create Password (Complete Registration)**

```http
POST http://localhost:5000/api/auth/register/create-password
Content-Type: application/json

{
  "email": "raj.test@gmail.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "firstName": "Raj",
  "lastName": "Kumar",
  "role": "Individual"
}
```

Expected Response (201):

```json
{
  "message": "Registration successful! Welcome to CarbonMeter 🌍",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "Raj",
    "lastName": "Kumar",
    "email": "raj.test@gmail.com",
    "role": "Individual",
    "isVerified": true
  }
}
```

#### Step 2: Test Login with Correct Password ✅

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "raj.test@gmail.com",
  "password": "SecurePass123"
}
```

Expected Response (200) - **Should Work Now!**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "Raj",
    "lastName": "Kumar",
    "email": "raj.test@gmail.com",
    "role": "Individual"
  }
}
```

#### Step 3: Test Login with Wrong Password ❌

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "raj.test@gmail.com",
  "password": "WrongPassword123"
}
```

Expected Response (401):

```json
{
  "message": "Invalid credentials"
}
```

---

### SCENARIO 2: Forgot Password (Complete 3-Step Flow)

#### Step 1: Request Password Reset

```http
POST http://localhost:5000/api/auth/forgot-password
Content-Type: application/json

{
  "email": "raj.test@gmail.com"
}
```

Expected Response (200):

```json
{
  "message": "Password reset OTP sent successfully! Check your email.",
  "email": "raj.test@gmail.com",
  "expiresIn": "5 minutes",
  "nextStep": "verify-reset-otp"
}
```

**Check email for OTP code** 📧

#### Step 2: Verify Reset OTP

(Copy OTP from email)

```http
POST http://localhost:5000/api/auth/verify-reset-otp
Content-Type: application/json

{
  "email": "raj.test@gmail.com",
  "otp": "654321"
}
```

Expected Response (200):

```json
{
  "message": "OTP verified successfully!",
  "email": "raj.test@gmail.com",
  "verified": true,
  "nextStep": "reset-password",
  "expiresIn": "290 seconds"
}
```

#### Step 3: Reset Password

```http
POST http://localhost:5000/api/auth/reset-password
Content-Type: application/json

{
  "email": "raj.test@gmail.com",
  "newPassword": "NewSecurePass456",
  "confirmNewPassword": "NewSecurePass456"
}
```

Expected Response (200):

```json
{
  "message": "✅ Password reset successful! You can now login with your new password.",
  "email": "raj.test@gmail.com",
  "nextStep": "login"
}
```

#### Step 4: Login with New Password

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "raj.test@gmail.com",
  "password": "NewSecurePass456"
}
```

Expected Response (200):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "Raj",
    "lastName": "Kumar",
    "email": "raj.test@gmail.com",
    "role": "Individual"
  }
}
```

---

## ❌ Error Test Cases

### Test Case 1: Invalid Email Format

**Request:**

```http
POST http://localhost:5000/api/auth/forgot-password
Content-Type: application/json

{
  "email": "invalid-email"
}
```

**Expected Response (400):**

```json
{
  "message": "Please enter a valid email address"
}
```

---

### Test Case 2: Invalid OTP

**Request:**

```http
POST http://localhost:5000/api/auth/verify-reset-otp
Content-Type: application/json

{
  "email": "raj.test@gmail.com",
  "otp": "999999"
}
```

**Expected Response (401):**

```json
{
  "message": "Invalid OTP. Please check and try again.",
  "code": "INVALID_OTP"
}
```

---

### Test Case 3: OTP Expired

**Request (After 5 minutes):**

```http
POST http://localhost:5000/api/auth/verify-reset-otp
Content-Type: application/json

{
  "email": "raj.test@gmail.com",
  "otp": "123456"
}
```

**Expected Response (401):**

```json
{
  "message": "OTP has expired. Please request a new OTP.",
  "code": "OTP_EXPIRED"
}
```

---

### Test Case 4: Password Mismatch

**Request:**

```http
POST http://localhost:5000/api/auth/reset-password
Content-Type: application/json

{
  "email": "raj.test@gmail.com",
  "newPassword": "SecurePass123",
  "confirmNewPassword": "DifferentPass123"
}
```

**Expected Response (400):**

```json
{
  "message": "Passwords do not match. Please try again.",
  "code": "PASSWORD_MISMATCH"
}
```

---

### Test Case 5: Weak Password

**Request (Less than 8 characters):**

```http
POST http://localhost:5000/api/auth/reset-password
Content-Type: application/json

{
  "email": "raj.test@gmail.com",
  "newPassword": "Short1",
  "confirmNewPassword": "Short1"
}
```

**Expected Response (400):**

```json
{
  "message": "Password must be at least 8 characters long",
  "code": "PASSWORD_TOO_SHORT"
}
```

---

### Test Case 6: Weak Password (Missing Uppercase)

**Request:**

```http
POST http://localhost:5000/api/auth/reset-password
Content-Type: application/json

{
  "email": "raj.test@gmail.com",
  "newPassword": "securepass123",
  "confirmNewPassword": "securepass123"
}
```

**Expected Response (400):**

```json
{
  "message": "Password must contain uppercase, lowercase, and numbers",
  "code": "WEAK_PASSWORD"
}
```

---

## 🔑 Password Validation Rules

### Valid Passwords ✅

```
✅ SecurePass123
✅ MyPassword1
✅ Carbometer@2024
✅ Test#Pass789
```

### Invalid Passwords ❌

```
❌ short           (too short)
❌ securepass123   (no uppercase)
❌ SECUREPASS123   (no lowercase)
❌ SecurePass      (no numbers)
```

---

## 📱 Using Postman

### Import as cURL

1. Open Postman
2. Click "Import" → "Paste Raw Text"
3. Copy any cURL command below
4. Paste and click Import
5. Click Send

---

### cURL Examples

#### Forgot Password - Send OTP

```bash
curl --location 'http://localhost:5000/api/auth/forgot-password' \
--header 'Content-Type: application/json' \
--data '{
  "email": "raj.test@gmail.com"
}'
```

#### Forgot Password - Verify OTP

```bash
curl --location 'http://localhost:5000/api/auth/verify-reset-otp' \
--header 'Content-Type: application/json' \
--data '{
  "email": "raj.test@gmail.com",
  "otp": "123456"
}'
```

#### Forgot Password - Reset Password

```bash
curl --location 'http://localhost:5000/api/auth/reset-password' \
--header 'Content-Type: application/json' \
--data '{
  "email": "raj.test@gmail.com",
  "newPassword": "NewSecurePass456",
  "confirmNewPassword": "NewSecurePass456"
}'
```

#### Login

```bash
curl --location 'http://localhost:5000/api/auth/login' \
--header 'Content-Type: application/json' \
--data '{
  "email": "raj.test@gmail.com",
  "password": "SecurePass123"
}'
```

---

## 🔄 Complete Test Flow (Copy-Paste Ready)

### Email Test Account

```
Email: test.user@gmail.com
Initial Password: InitialPass123 (after registration)
New Password: UpdatedPass456 (after forgot password)
```

### Test Sequence

1. Register user with email OTP
2. Verify registration password works
3. Request password reset
4. Verify reset OTP
5. Reset to new password
6. Login with new password
7. Verify old password doesn't work

---

## 📊 Response Status Codes

| Code | Meaning      | Example                                            |
| ---- | ------------ | -------------------------------------------------- |
| 200  | Success      | OTP sent, OTP verified, password reset             |
| 201  | Created      | User account created during registration           |
| 400  | Bad Request  | Invalid email, mismatched passwords, weak password |
| 401  | Unauthorized | Invalid OTP, expired OTP, wrong login credentials  |
| 500  | Server Error | Email service down, database error                 |

---

## 🐛 Debugging

### Enable Logging

Check backend console for:

```
✅ Password hashed with bcrypt
✅ Password already hashed, skipping bcrypt
🔐 Generated password reset OTP for email@example.com
💾 Password reset OTP saved to database
✅ Password reset OTP sent successfully to email@example.com
✏️ Password reset for user: email@example.com
```

### Check Email Received

- Check Gmail inbox
- Check Gmail Promotions/Spam folders
- Verify email was sent from: CarbonMeter <mathpent05@gmail.com>

### Check Database

```javascript
// MongoDB - Check Otp collection
db.otps.find({ email: "raj.test@gmail.com" });

// Check User password is hashed
db.users.findOne({ email: "raj.test@gmail.com" });
// Should show: password: "$2a$10$..." (bcrypt format)
```

---

## ✅ Verification Checklist

- [ ] Password bug fix working (login with correct password)
- [ ] Registration creates accounts with proper password hashing
- [ ] OTP sends to email successfully
- [ ] OTP verification works
- [ ] Password reset updates account
- [ ] Login with new password works
- [ ] Old password no longer works
- [ ] OTP expires after 5 minutes
- [ ] Resend OTP works
- [ ] Password strength validation works
- [ ] Error messages display correctly

---

**Ready to test! Happy debugging! 🚀**
