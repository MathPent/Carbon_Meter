const mongoose = require('mongoose');

/**
 * MongoDB Atlas Connection Module
 * Centralized database connection using environment variables
 * Validates required credentials at startup
 * Uses async/await for proper error handling
 */

const connectDB = async () => {
  // Validate MongoDB URI is configured
  if (!process.env.MONGODB_URI) {
    const errorMsg = [
      '❌ MONGODB_URI is not defined',
      'Please add to your .env file:',
      'MONGODB_URI=mongodb+srv://<username>:<password>@carbonmeter-cluster.cjgdnje.mongodb.net/carbonmeter',
      '',
      'Do NOT hardcode credentials. Use MongoDB Atlas credentials only.'
    ].join('\n');
    console.error(errorMsg);
    process.exit(1);
  }

  try {
    // Connect to MongoDB Atlas
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Connection pooling for production
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB Atlas connected successfully');
    console.log(`   Cluster: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed');
    console.error(`   Error: ${error.message}`);
    console.error('   Possible causes:');
    console.error('   - Invalid connection string in MONGODB_URI');
    console.error('   - Network access not configured in MongoDB Atlas');
    console.error('   - Database user credentials incorrect');
    console.error('   - Atlas cluster not running');
    
    // Don't exit immediately - allow graceful startup for debugging
    // Production deployments should handle this via monitoring
    console.error('   Retrying connection in 5 seconds...');
    
    setTimeout(() => connectDB(), 5000);
  }
};

// Handle disconnection and reconnection
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB connection lost');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

module.exports = connectDB;
