require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('./src/models/Vehicle');
const connectDB = require('./src/config/database');

async function checkVehicles() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    const count = await Vehicle.countDocuments();
    console.log(`📊 Total vehicles in database: ${count}\n`);

    if (count === 0) {
      console.log('⚠️  No vehicles found! Run: node seed-vehicles.js\n');
    } else {
      const categories = await Vehicle.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);

      console.log('Vehicles by category:');
      categories.forEach(cat => {
        console.log(`  - ${cat._id}: ${cat.count} vehicles`);
      });

      console.log('\n📝 Sample vehicles:');
      const samples = await Vehicle.find().limit(3);
      samples.forEach(v => {
        console.log(`  - ${v.model} (${v.category}, ${v.fuel})`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkVehicles();
