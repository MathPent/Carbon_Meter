const mongoose = require('mongoose');

/**
 * MongoDB Atlas Connection Module
 * Connects ONLY to MongoDB Atlas - no local fallback
 * If Atlas connection fails, the server will not start
 */

const connectDB = async () => {
  const atlasUri = process.env.MONGODB_URI;

  // Validate MongoDB URI exists
  if (!atlasUri) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
    console.error('🔧 Solution: Add MONGODB_URI to your .env file');
    console.error('   Example: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/carbonmeter');
    process.exit(1);
  }

  // Validate it's an Atlas URI (not localhost)
  if (atlasUri.includes('localhost') || atlasUri.includes('127.0.0.1')) {
    console.error('❌ Local MongoDB URIs are not allowed');
    console.error('🔧 Solution: Use MongoDB Atlas connection string only');
    console.error('   Expected format: mongodb+srv://...');
    process.exit(1);
  }

  // Connection options
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  };

  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(atlasUri, options);
    
    console.log('✅ MongoDB Atlas connected successfully');
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Cluster: ${conn.connection.host}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed');
    console.error(`   Error: ${error.message}`);
    console.error('🔧 Possible solutions:');
    console.error('   - Check your internet connection');
    console.error('   - Verify MongoDB Atlas credentials');
    console.error('   - Check IP whitelist in Atlas dashboard');
    console.error('   - Ensure .env file has correct MONGODB_URI');
    process.exit(1);
  }
};

// Handle disconnection
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB Atlas connection lost');
});

// Handle reconnection
mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB Atlas reconnected');
});

// Handle connection errors
mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB Atlas connection error:', error.message);
});

module.exports = connectDB;
