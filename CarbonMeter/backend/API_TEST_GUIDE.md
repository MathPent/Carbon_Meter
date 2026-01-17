/\*\*

- CarbonMeter - Email OTP Authentication Test Guide
-
- This file shows how to test the complete OTP flow
- Use Postman, cURL, or Insomnia to test these endpoints
  \*/

// =============================================================================
// 1. SEND OTP TO EMAIL
// =============================================================================
// Purpose: Request an OTP to be sent to user's email
// No authentication required

POST http://localhost:5000/api/auth/send-otp
Content-Type: application/json

{
"email": "yourtest@gmail.com"
}

// Expected Response (200):
{
"message": "OTP sent successfully to your email",
"email": "yourtest@gmail.com"
}

// ✅ Check your email inbox for the OTP!
// The OTP is valid for 5 minutes only

// =============================================================================
// 2. VERIFY OTP & CREATE ACCOUNT
// =============================================================================
// Purpose: Verify OTP and create user account
// Copy the OTP from the email received in Step 1

POST http://localhost:5000/api/auth/verify-otp
Content-Type: application/json

{
"email": "yourtest@gmail.com",
"otp": "123456", // ← Replace with OTP from email
"firstName": "John",
"lastName": "Doe",
"password": "password123",
"role": "Individual" // Options: Individual | Industry | Government
}

// Expected Response (201):
{
"message": "Email verified successfully! Account created.",
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
"user": {
"id": "507f1f77bcf86cd799439011",
"firstName": "John",
"lastName": "Doe",
"email": "yourtest@gmail.com",
"role": "Individual",
"isVerified": true
}
}

// ✅ Account created and verified! User can now login

// =============================================================================
// 3. LOGIN WITH EMAIL & PASSWORD
// =============================================================================
// Purpose: Login with verified email and password
// Returns JWT token for future requests

POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
"email": "yourtest@gmail.com",
"password": "password123"
}

// Expected Response (200):
{
"message": "Login successful",
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
"user": {
"id": "507f1f77bcf86cd799439011",
"firstName": "John",
"lastName": "Doe",
"email": "yourtest@gmail.com",
"role": "Individual",
"isVerified": true
}
}

// ✅ Login successful! Store the token for authenticated requests

// =============================================================================
// 4. GOOGLE OAUTH LOGIN (Alternative)
// =============================================================================
// Purpose: Quick login via Google (auto-creates account if new)

POST http://localhost:5000/api/auth/google-login
Content-Type: application/json

{
"token": "google_id_token_from_frontend"
}

// Expected Response (200):
{
"message": "Login successful",
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
"user": {
"id": "507f1f77bcf86cd799439011",
"firstName": "John",
"email": "yourtest@gmail.com",
"role": "Individual"
}
}

// ✅ Google login successful!

// =============================================================================
// ERROR SCENARIOS & RESPONSES
// =============================================================================

// ❌ User already registered (Step 1)
POST http://localhost:5000/api/auth/send-otp
Body: { "email": "existing@gmail.com" }

Response (400):
{
"message": "User already registered with this email. Please login instead."
}

// ❌ Invalid OTP (Step 2)
POST http://localhost:5000/api/auth/verify-otp
Body: { "otp": "wrong_code", ... }

Response (401):
{
"message": "Invalid or expired OTP. Please request a new OTP."
}

// ❌ OTP Expired (Step 2)
// If more than 5 minutes have passed

Response (401):
{
"message": "OTP has expired. Please request a new OTP."
}

// ❌ Invalid credentials (Step 3)
POST http://localhost:5000/api/auth/login
Body: { "email": "test@gmail.com", "password": "wrong_password" }

Response (401):
{
"message": "Invalid email or password"
}

// ❌ Email not verified (Step 3)
// If user registered but didn't complete OTP verification

Response (403):
{
"message": "Please verify your email first. Request a new OTP."
}

// =============================================================================
// USEFUL POSTMAN TIPS
// =============================================================================

/\*

1. Create a Collection named "CarbonMeter OTP"

2. Add these 4 requests:

   - Send OTP
   - Verify OTP
   - Login
   - Google Login

3. Use Variables for common values:
   {{base_url}} = http://localhost:5000
   {{api_path}} = /api/auth

4. Order of execution:
   Step 1 → Step 2 → Step 3 (or Step 4)

5. Save OTP from email and paste in Step 2

6. Save JWT token from Step 3 for authenticated requests:

   - Copy token from response
   - Use in Authorization header: Bearer {{token}}

7. Test error cases:
   - Expired OTP (wait 5+ minutes)
   - Invalid OTP
   - Wrong password
     \*/

// =============================================================================
// MONGODB COMPASS VERIFICATION
// =============================================================================

/\*
Check these collections in MongoDB Compass:

1. users collection:

   - firstName, lastName, email
   - password (hashed, starts with $2a$)
   - role, isVerified, createdAt

2. otps collection:

   - email
   - otp (6-digit)
   - createdAt (will auto-delete after 5 mins)

3. Check user document:
   {
   "\_id": ObjectId,
   "firstName": "John",
   "lastName": "Doe",
   "email": "yourtest@gmail.com",
   "password": "$2a$10$...",
   "role": "Individual",
   "isVerified": true,
   "createdAt": ISODate,
   "updatedAt": ISODate
   }
   \*/

// =============================================================================
// SECURITY NOTES
// =============================================================================

/\*
✅ Passwords are hashed with bcrypt:
Plain: "password123"
Stored: "$2a$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5YmMxSUiqkN1K"

✅ OTP expires automatically:

- Created: 2026-01-15 10:00:00
- Expires: 2026-01-15 10:05:00 (5 minutes)

✅ JWT tokens expire in 7 days:

- Issued: 2026-01-15
- Expires: 2026-01-22

✅ Email is verified before login:

- isVerified: false (before verification)
- isVerified: true (after OTP verification)

✅ One OTP per email:

- Old OTP deleted when new one requested
- Prevents multiple OTPs cluttering database
  \*/

// =============================================================================
// EXPECTED WORKFLOW
// =============================================================================

/\*
SUCCESSFUL REGISTRATION & LOGIN:

Day 1 - Registration:

1. User visits app → /register
2. Enters email → API: /send-otp
3. Receives OTP in email (e.g., 123456)
4. Enters OTP + password → API: /verify-otp
5. Account created, isVerified = true
6. Auto-login → Redirect to /dashboard

Day 2 - Login:

1. User visits app → /login
2. Enters email + password → API: /login
3. JWT token returned
4. Redirect to /dashboard
5. Use token for protected routes

Alternative - Google OAuth:

1. User clicks "Continue with Google"
2. Google login modal appears
3. Frontend sends token → API: /google-login
4. Account auto-created (if new)
5. Auto-login → Redirect to /dashboard
   \*/

// =============================================================================
// TROUBLESHOOTING CHECKLIST
// =============================================================================

/\*
❌ "Failed to send OTP email"
✓ Check EMAIL in .env
✓ Check EMAIL_PASS in .env (should be 16-char App Password, not regular password)
✓ Verify Gmail 2FA is enabled
✓ Check Gmail's "Less secure app access" is OFF
✓ MongoDB is running
✓ Backend is running

❌ "Invalid or expired OTP"
✓ Copy OTP correctly from email
✓ OTP hasn't expired (valid for 5 minutes)
✓ Email matches
✓ Check for typos

❌ "User already registered"
✓ Use different email for testing
✓ Or test login flow instead

❌ "MongoDB connection failed"
✓ Start MongoDB: mongod
✓ Check MongoDB URI in .env
✓ Default: mongodb://localhost:27017/carbometer

❌ Backend not responding
✓ Check backend is running: npm run dev
✓ Check port 5000 is available
✓ Restart backend
\*/
