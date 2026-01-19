const mongoose = require('mongoose');

/**
 * MongoDB Connection Module with Atlas + Local Fallback
 * Tries Atlas first, falls back to local MongoDB if Atlas fails
 * Provides detailed connection diagnostics
 */

const connectDB = async () => {
  const atlasUri = process.env.MONGODB_URI;
  const localUri = process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/carbonmeter';

  // Connection options
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  // Try Atlas first
  if (atlasUri) {
    console.log('🔄 Attempting MongoDB Atlas connection...');
    try {
      const conn = await mongoose.connect(atlasUri, options);
      console.log('✅ MongoDB Atlas connected successfully');
      console.log(`   Host: ${conn.connection.host}`);
      console.log(`   Database: ${conn.connection.name}`);
      return conn;
    } catch (error) {
      console.log('⚠️ Atlas connection failed, trying local MongoDB...');
      console.log(`   Atlas Error: ${error.message}`);
    }
  }

  // Fallback to local MongoDB
  try {
    console.log('🔄 Connecting to local MongoDB...');
    const conn = await mongoose.connect(localUri, options);
    console.log('✅ Local MongoDB connected successfully');
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log('💡 Consider fixing Atlas connection for production use');
    return conn;
  } catch (error) {
    console.error('❌ Both Atlas and local MongoDB connections failed');
    console.error(`   Local Error: ${error.message}`);
    console.error('🔧 Solutions:');
    console.error('   - Start local MongoDB: mongod --dbpath /path/to/data');
    console.error('   - Fix Atlas network/credentials');
    console.error('   - Check .env file configuration');
    
    // Return null to allow server to start without DB (for debugging)
    return null;
  }
};

// Handle disconnection and reconnection
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB connection lost');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('📡 MongoDB connection error:', error.message);
});

module.exports = connectDB;

module.exports = connectDB;
