require('dotenv').config();
const mongoose = require('mongoose');
const Activity = require('./src/models/Activity');
const User = require('./src/models/User');

async function checkActivities() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    console.log('\n==========================================');
    console.log('📊 Activities & Leaderboard Check');
    console.log('==========================================\n');

    // Check total activities
    const totalActivities = await Activity.countDocuments();
    console.log(`📝 Total Activities: ${totalActivities}`);

    if (totalActivities > 0) {
      // Get recent activities
      const recentActivities = await Activity.find()
        .sort({ date: -1 })
        .limit(5)
        .populate('userId', 'username email');
      
      console.log('\n🕐 Recent Activities (Last 5):');
      recentActivities.forEach((activity, idx) => {
        console.log(`   ${idx + 1}. ${activity.userId?.username || 'Unknown'} - ${activity.category} - ${activity.carbonEmission} kg CO2 (${new Date(activity.date).toLocaleDateString()})`);
      });

      // Calculate leaderboard
      console.log('\n🏆 Leaderboard (This Month):');
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const leaderboard = await Activity.aggregate([
        { $match: { date: { $gte: firstDayOfMonth } } },
        {
          $group: {
            _id: '$userId',
            totalEmissions: { $sum: '$carbonEmission' },
            activitiesCount: { $sum: 1 },
          }
        },
        { $sort: { totalEmissions: 1 } },
        { $limit: 10 },
      ]);

      if (leaderboard.length === 0) {
        console.log('   (No activities this month)');
      } else {
        for (let i = 0; i < leaderboard.length; i++) {
          const user = await User.findById(leaderboard[i]._id).select('username');
          console.log(`   ${i + 1}. ${user?.username || 'Unknown'} - ${leaderboard[i].totalEmissions.toFixed(2)} kg CO2e (${leaderboard[i].activitiesCount} activities)`);
        }
      }
    } else {
      console.log('\n⚠️  No activities found in database!');
      console.log('   Users need to log activities for the leaderboard to populate.');
    }

    console.log('\n==========================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkActivities();
