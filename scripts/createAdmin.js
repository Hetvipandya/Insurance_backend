const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
 
const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const emailId = 'admin10@gmail.com';
    const mobileNumber = '9876543210';
    const plainPassword = 'Admin789';

    let admin = await User.findOne({ 
      $or: [{ emailId }, { mobileNumber }] 
    });

    if (admin) {
      console.log('Admin already exists:', admin._id.toString());

      admin.role = 'admin';            // ✅ FIX
      admin.isApproved = true;
      admin.isRejected = false;

      await admin.save();
      console.log('Admin updated');
    } else {
      const hashed = await bcrypt.hash(plainPassword, 10);

      admin = new User({
        fullName: 'Admin',
        emailId,                       // ✅ FIX
        mobileNumber,
        address: 'Ahmedabad',
        password: hashed,
        role: 'admin',                // ✅ FIX
        photo: null,
        isApproved: true,
        isRejected: false
      });

      await admin.save();
      console.log('Admin created:', admin._id.toString());
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();