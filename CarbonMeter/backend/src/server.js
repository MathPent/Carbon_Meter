require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();

/* =========================
   CORS CONFIG (PRODUCTION)
========================= */
app.use(
  cors({
    origin: [
      'https://carbonmeter-mathpent.netlify.app/',   // Netlify frontend
      'http://localhost:3000'     // Local dev
    ],
    credentials: true
  })
);


// Middleware
app.use(cors());
app.use(express.json());

// Connect to Database and start server
const startServer = async () => {
  // Connect to MongoDB Atlas (this will exit if connection fails)
  await connectDB();

  // Routes (only loaded after successful DB connection)
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/activities', require('./routes/activities'));
  app.use('/api/badges', require('./routes/badges'));
  app.use('/api/carbox', require('./routes/carbox'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/gov', require('./routes/gov'));
  app.use('/api/org', require('./routes/org'));
  app.use('/api/org', require('./routes/orgPrediction')); // AI Prediction routes
  app.use('/api/organization', require('./routes/organization'));
  app.use('/api/map', require('./routes/map'));
  app.use('/api/vehicles', require('./routes/vehicles'));
  app.use('/api/automatic-transport', require('./routes/automatic-transport'));
  app.use('/api/live-transport', require('./routes/live-transport'));
  app.use('/api/prediction', require('./routes/prediction'));
  app.use('/api/tips', require('./routes/tips'));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'Backend is running',
      database: 'MongoDB Atlas connected'
    });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});
