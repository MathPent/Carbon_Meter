# MongoDB Atlas - Quick Start (For Developers)

## 3-Step Setup

### 1️⃣ Create `.env` file

```bash
cp .env.example .env
```

### 2️⃣ Add MongoDB Atlas credentials

Edit `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@carbonmeter-cluster.cjgdnje.mongodb.net/carbonmeter
```

### 3️⃣ Start backend

```bash
npm install
npm run dev
```

**Expected output**:

```
✅ MongoDB Atlas connected successfully
   Cluster: carbonmeter-cluster.cjgdnje.mongodb.net
   Database: carbonmeter
Server running on port 5000
```

---

## Where to Get Credentials

1. Ask your team lead (from secure password manager)
2. Or get them from MongoDB Atlas:
   - Log in → **Deployments** → **carbonmeter-cluster**
   - Click **Connect** → **Drivers** → **Node.js**
   - Copy connection string, replace `<username>` and `<password>`

---

## Troubleshooting

| Problem                         | Solution                                      |
| ------------------------------- | --------------------------------------------- |
| `MONGODB_URI is not defined`    | Create `.env` file with `MONGODB_URI`         |
| `Network access not configured` | Ask team lead to add your IP in MongoDB Atlas |
| `Authentication failed`         | Check username/password in `.env`             |
| `Connection lost`               | Server auto-retries every 5 seconds           |

---

## Files You Need to Know

- **Connection logic**: `src/config/database.js`
- **Environment config**: `.env` (local), `.env.example` (template)
- **Full setup guide**: `MONGODB_ATLAS_SETUP.md`

---

## Important

🔒 **Never commit `.env` to Git**  
🔒 **Never share credentials in Slack/email**  
🔒 **Use password manager for team credentials**

---

**That's it! You're ready to go.** ✅

For detailed guide, see: `MONGODB_ATLAS_SETUP.md`
