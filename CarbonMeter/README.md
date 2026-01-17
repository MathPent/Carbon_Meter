# CarbonMeter - Carbon Footprint Tracking Application

A real-world startup MVP for tracking personal and organizational carbon footprints.

## Project Structure

```
CarbonMeter/
├── backend/          # Node.js + Express + MongoDB
│   ├── src/
│   │   ├── server.js
│   │   ├── config/   # Database config
│   │   ├── models/   # Mongoose schemas
│   │   ├── routes/   # API endpoints
│   │   └── controllers/
│   ├── package.json
│   └── .env.example
├── frontend/         # React.js + Tailwind CSS
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
└── README.md
```

## Tech Stack

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT

## Setup Instructions

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Update .env with MongoDB URI
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

Backend runs on port 5000, frontend on port 3000.

## Color Scheme

- Primary Dark Green: #193827
- Brown Accent: #947534
- Gold Accent: #efc250
- Light Green: #c6d335
- Off White: #f4fff3
- Soft Beige: #f1f0e3
- Neutral Background: #f7f7eb
- Light Blue Accent: #e5edfe
