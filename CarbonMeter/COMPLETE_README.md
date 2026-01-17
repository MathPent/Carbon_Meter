# CarbonMeter - Carbon Footprint Tracking Application

A real-world startup MVP for tracking personal and organizational carbon footprints with email OTP verification.

## 🎯 Project Overview

CarbonMeter is a full-stack MERN application that helps users:

- ✅ Register with email OTP verification
- ✅ Login with Google OAuth or email/password
- ✅ Track carbon emissions (travel, electricity, food, waste)
- ✅ Get personalized reduction tips
- ✅ Join community leaderboard
- ✅ Earn badges for green actions

## 📁 Project Structure

```
CarbonMeter/
├── backend/                    # Node.js + Express + MongoDB
│   ├── src/
│   │   ├── server.js          # Express setup
│   │   ├── config/
│   │   │   └── database.js     # MongoDB connection
│   │   ├── models/
│   │   │   ├── User.js         # User schema (with isVerified)
│   │   │   ├── Otp.js          # OTP schema (5-min expiry)
│   │   │   ├── Activity.js     # Activity logs
│   │   │   ├── Badge.js        # User badges
│   │   │   └── CarbonSaving.js # Savings tracker
│   │   ├── routes/
│   │   │   └── auth.js         # Auth endpoints (OTP, login, OAuth)
│   │   ├── controllers/
│   │   │   └── authController.js
│   │   └── utils/
│   │       └── sendOtp.js      # Nodemailer + email templates
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   └── OTP_SETUP_GUIDE.md      # Complete OTP documentation
├── frontend/                   # React.js + Tailwind CSS
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   └── DashboardPage.js
│   │   ├── components/
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── api.js
│   │   └── App.js
│   ├── public/
│   ├── package.json
│   └── .env.example
└── README.md
```

## 🛠️ Tech Stack

**Frontend:**

- React.js (Functional Components + Hooks)
- Tailwind CSS (Custom colors)
- React Router (Navigation)
- Axios (API calls)
- Google OAuth integration

**Backend:**

- Node.js + Express.js
- MongoDB (Mongoose ODM)
- Nodemailer (Email OTP)
- bcryptjs (Password hashing)
- JWT (Session management)

**Database:**

- MongoDB (Local or Atlas)

## ⚡ Quick Start

### Prerequisites

- Node.js v14+ installed
- MongoDB running on `localhost:27017`
- Gmail account with 2FA enabled

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# UPDATE .env with:
# - Gmail credentials (see OTP_SETUP_GUIDE.md)
# - MongoDB URI
# - JWT secret

# Start backend
npm run dev
```

**Expected output:**

```
Server running on port 5000
MongoDB connected: localhost
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start frontend
npm start
```

**Frontend opens at:** `http://localhost:3000`

---

## 📧 Email OTP Setup (CRITICAL)

### Step 1: Enable 2-Factor Authentication

1. Go to: https://myaccount.google.com/security
2. Click "2-Step Verification"
3. Follow prompts to enable

### Step 2: Generate Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Device: "Windows Computer"
3. App: "Mail"
4. Google will generate 16-character password
5. Copy password (remove spaces)

### Step 3: Update .env

```env
EMAIL=your_gmail@gmail.com
EMAIL_PASS=abcdefghijklmnop    # 16-char password from Step 2
```

**⚠️ IMPORTANT:**

- Use **App Password**, NOT regular Gmail password
- Never commit .env to GitHub
- Keep EMAIL_PASS secret

See `backend/OTP_SETUP_GUIDE.md` for complete guide with troubleshooting.

---

## 📡 API Endpoints

### Authentication Routes

#### 1. Send OTP Email

```
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "user@gmail.com"
}

Response: { message: "OTP sent to email", email: "user@gmail.com" }
```

#### 2. Verify OTP & Create Account

```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@gmail.com",
  "otp": "123456",
  "firstName": "John",
  "lastName": "Doe",
  "password": "password123",
  "role": "Individual"
}

Response: {
  token: "eyJhbGciOiJIUzI1NiIs...",
  user: { id, firstName, email, role, isVerified }
}
```

#### 3. Login with Email & Password

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@gmail.com",
  "password": "password123"
}

Response: {
  token: "eyJhbGciOiJIUzI1NiIs...",
  user: { id, firstName, email, role }
}
```

#### 4. Google OAuth Login

```
POST /api/auth/google-login
Content-Type: application/json

{
  "token": "google_id_token_here"
}

Response: { token, user }
```

---

## 🧪 Test Registration Flow (Postman)

### Step 1: Request OTP

```
POST http://localhost:5000/api/auth/send-otp
Body: { "email": "test@gmail.com" }
```

✅ Check your email for OTP!

### Step 2: Verify OTP

```
POST http://localhost:5000/api/auth/verify-otp
Body: {
  "email": "test@gmail.com",
  "otp": "123456",
  "firstName": "John",
  "lastName": "Doe",
  "password": "password123",
  "role": "Individual"
}
```

✅ You get JWT token!

### Step 3: Login

```
POST http://localhost:5000/api/auth/login
Body: {
  "email": "test@gmail.com",
  "password": "password123"
}
```

✅ Login successful!

---

## 🎨 UI/Styling

### Color Scheme

| Color        | Hex     | Usage                     |
| ------------ | ------- | ------------------------- |
| Dark Green   | #193827 | Primary (navbar, buttons) |
| Brown Accent | #947534 | Secondary buttons         |
| Gold Accent  | #efc250 | Highlights                |
| Light Green  | #c6d335 | Interactive elements      |
| Off White    | #f4fff3 | Text on dark              |
| Soft Beige   | #f1f0e3 | Card backgrounds          |
| Neutral BG   | #f7f7eb | Page background           |
| Light Blue   | #e5edfe | Accents                   |

### Pages Implemented

✅ **Login Page** - Email/password + Google OAuth  
✅ **Register Page** - Role selection (Individual/Industry/Government)  
✅ **Dashboard** - Stats widgets, badges, hero section  
⏳ **Carbon Calculation** - Input forms, pie charts  
⏳ **Tips Page** - Personalized recommendations  
⏳ **Community Page** - Leaderboard, badges  
⏳ **Carbon Map** - Global emissions visualization

---

## 🗄️ Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed with bcrypt),
  role: String (Individual | Industry | Government),
  isVerified: Boolean,      // NEW - Email verified?
  phone: String,
  country: String,
  createdAt: Date,
  updatedAt: Date
}
```

### OTPs Collection

```javascript
{
  _id: ObjectId,
  email: String,
  otp: String (6-digit),
  createdAt: Date           // AUTO-DELETES after 5 minutes
}
```

### Activities Collection (Future)

```javascript
{
  userId: ObjectId (ref: User),
  category: String (Travel | Electricity | Food | Waste),
  carbonEmission: Number (kg CO2),
  date: Date,
  createdAt: Date
}
```

---

## 🔒 Security Features

✅ **Password Security**

- Hashed with bcrypt (10-round salt)
- Never stored in plain text
- Safely compared during login

✅ **OTP Security**

- 6-digit random generation
- Expires automatically after 5 minutes
- One OTP per email
- Deleted after successful verification

✅ **JWT Tokens**

- Expires in 7 days
- Signed with JWT_SECRET
- Cannot be forged

✅ **Email Verification**

- Users must verify email before login
- Unverified users cannot access dashboard

✅ **Input Validation**

- Email format validation
- Password minimum length
- Role enum validation

✅ **Environment Variables**

- Sensitive data in .env (not in code)
- .env.example for reference
- Gitignore prevents accidental commits

---

## ⚠️ Troubleshooting

### ❌ "Failed to send OTP email"

**Solutions:**

- Verify EMAIL and EMAIL_PASS in .env
- Use Gmail App Password (NOT regular password)
- Check 2-Factor Authentication is enabled
- Check internet connection

### ❌ "Invalid or expired OTP"

- OTP expires after 5 minutes
- Only 1 OTP valid per email
- Request new OTP if expired

### ❌ "User already registered"

- Email already has verified account
- Try login instead
- Or use different email

### ❌ "Please verify email first"

- Complete OTP verification before login
- Call `/verify-otp` endpoint
- Or request new OTP

### ❌ MongoDB connection error

- Check MongoDB is running
- Verify MongoDB URI in .env
- Default: `mongodb://localhost:27017/carbometer`

---

## 📊 File Descriptions

### Backend Files

**server.js**

- Express app setup
- MongoDB connection
- Middleware configuration
- Route mounting

**models/User.js**

- User schema
- Password hashing pre-save hook
- Password comparison method
- `isVerified` field (NEW)

**models/Otp.js**

- OTP schema
- TTL index (5-minute expiry)
- Auto-deletion via MongoDB

**utils/sendOtp.js**

- `generateOtp()` - Creates 6-digit OTP
- `sendOtpEmail()` - Sends via Nodemailer
- Beautiful HTML email template
- CarbonMeter branding

**routes/auth.js**

- `POST /send-otp` - Generate & send OTP
- `POST /verify-otp` - Verify OTP & create account
- `POST /login` - Email/password login
- `POST /google-login` - Google OAuth
- `POST /register` - Legacy method (backward compat)

### Frontend Files

**pages/LoginPage.js**

- Email/password form
- Google OAuth button
- Language selector
- Error handling

**pages/RegisterPage.js**

- Role selection (Individual/Industry/Government)
- User details form
- Dark green navbar

**pages/DashboardPage.js**

- Hero section with quote
- Stats widgets
- Badge display
- Navigation navbar

**context/AuthContext.js**

- Global auth state
- Login/logout methods
- Token management

**api.js**

- Axios instance
- Auth endpoints
- Token setting/getting

---

## 🚀 Production Deployment

### Before Going Live

- [ ] Change JWT_SECRET to strong random string
- [ ] Update MongoDB to Atlas cluster
- [ ] Use SendGrid/AWS SES instead of Gmail
- [ ] Enable HTTPS only
- [ ] Add rate limiting for OTP requests
- [ ] Setup error logging (Sentry)
- [ ] Configure CORS properly
- [ ] Add password reset flow
- [ ] Setup password strength validation
- [ ] Add email bounce handling

### Deploy Commands

```bash
# Build frontend
cd frontend
npm run build

# Deploy to Vercel/Netlify
vercel deploy

# Deploy backend to Heroku/Railway
git push heroku main
```

---

## 📚 Documentation Files

- `OTP_SETUP_GUIDE.md` - Complete email OTP setup guide
- `.env.example` - Environment variables reference
- `package.json` - Project dependencies

---

## 🔄 User Flow

```
┌─────────────────────────────────────────────┐
│         CarbonMeter Application             │
└─────────────────────────────────────────────┘

REGISTRATION:
  1. User enters email → Send OTP
  2. Receive OTP in email (5-min expiry)
  3. Enter OTP + password + name → Verify & Create Account
  4. Auto-login to dashboard

LOGIN:
  1. Email + password → Verify credentials
  2. Generate JWT token
  3. Access protected routes

GOOGLE OAUTH:
  1. Click "Continue with Google"
  2. Auto-create account if new
  3. Auto-login if existing
  4. Access dashboard
```

---

## 📈 Roadmap

### Phase 1: ✅ Authentication (Complete)

- [x] Email OTP registration
- [x] Email/password login
- [x] Google OAuth integration
- [x] JWT token management
- [x] User verification

### Phase 2: 🚧 Carbon Logging (In Progress)

- [ ] Carbon calculation form
- [ ] Activity history
- [ ] Pie chart visualization
- [ ] Carbon savings tracking

### Phase 3: ⏳ Community Features

- [ ] Leaderboard
- [ ] Badges & achievements
- [ ] Community news
- [ ] Social sharing

### Phase 4: ⏳ AI Features

- [ ] Personalized tips
- [ ] Carbon estimation
- [ ] Trend analysis

### Phase 5: ⏳ Map & Analytics

- [ ] Global carbon map
- [ ] Regional statistics
- [ ] Impact tracking

---

## 💻 Commands Reference

```bash
# Backend
npm install              # Install dependencies
npm run dev             # Start with nodemon
npm start               # Start server
npm test                # Run tests

# Frontend
npm install             # Install dependencies
npm start               # Start dev server (port 3000)
npm run build           # Build for production
npm test                # Run tests

# MongoDB
mongod                  # Start MongoDB locally
mongo                   # Open MongoDB shell
```

---

## 🤝 Contributing

Guidelines for contributions:

- Follow existing code style
- Add comments for complex logic
- Test before committing
- Update documentation
- Use meaningful commit messages

---

## 📞 Support & Contact

### API Response Format

All endpoints return structured JSON:

```json
{
  "message": "Status message",
  "token": "JWT token (if auth)",
  "user": { "id", "email", "role", ... },
  "error": "Error details (if failed)"
}
```

### Debug Tips

- Check browser console for frontend errors
- Check backend terminal for server logs
- Use MongoDB Compass to view database
- Use Postman to test endpoints

---

## 📄 License

Open source for hackathon purposes.

---

## 🌟 Features Highlight

- ✨ Beautiful UI with CarbonMeter branding
- 🔐 Production-grade security
- 📧 Email OTP via Gmail (FREE)
- 🔑 Google OAuth integration
- 🗄️ MongoDB data persistence
- 🚀 Scalable backend architecture
- 📱 Responsive design
- ♿ Beginner-friendly code

---

**Made with ❤️ for a sustainable future** 🌍

Built for the **Hackathon Finals** - January 2026
