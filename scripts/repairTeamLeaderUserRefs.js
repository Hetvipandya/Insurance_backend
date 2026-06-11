require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const TeamLeader = require('../models/TeamLeader');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in environment');
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const leaders = await TeamLeader.find({ $or: [{ user: { $exists: false } }, { user: null }] });
  console.log(`Found ${leaders.length} TeamLeader(s) with missing user reference`);

  let repaired = 0;

  for (const leader of leaders) {
    try {
      const email = (leader.Email || '').toLowerCase();
      let user = null;

      if (email) {
        user = await User.findOne({ emailId: email });
      }

      if (!user) {
        const passwordHash = leader.password || (await bcrypt.hash(Math.random().toString(36).slice(-8), 10));

        user = await User.create({
          fullName: leader.Name || 'Team Leader',
          emailId: email || `tl_${leader._id}@example.com`,
          mobileNumber: leader.mobileNo || '',
          address: leader.address || '',
          password: passwordHash,
          role: 'teamleader',
        });

        console.log(`Created User ${user._id} for TeamLeader ${leader._id}`);
      } else {
        console.log(`Found existing User ${user._id} for TeamLeader ${leader._id}`);
      }

      leader.user = user._id;
      await leader.save();
      repaired++;
    } catch (err) {
      console.error(`Failed to repair TeamLeader ${leader._id}:`, err.message);
    }
  }

  console.log(`Repair complete. Repaired: ${repaired}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Script error:', err);
  process.exit(1);
});
