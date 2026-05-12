// const dotenv = require('dotenv');
// dotenv.config();
 
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');

// const userRoutes = require("./routes/userRoutes");
// const applicationRoutes = require("./routes/applicationRoutes");

// const app = express();

// // ✅ MIDDLEWARE FIRST
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ✅ STATIC
// app.use('/uploads', express.static('uploads'));

// // ✅ ROUTES
// app.use("/api/user", userRoutes);
// app.use("/api/application", applicationRoutes);

// // Test route
// app.get('/', (req, res) => {
//   res.send("API running");
// });

// const PORT = process.env.PORT || 5000;
// const MONGODB_URI = process.env.MONGODB_URI;

// if (!MONGODB_URI) {
//   console.error("❌ MONGODB_URI is missing in environment variables");
//   process.exit(1);
// }

// mongoose.connect(MONGODB_URI)
// .then(() => {
//     console.log("✅ MongoDB connected");
//     app.listen(PORT, () => {
//         console.log(`🚀 Server running on port ${PORT}`);
//     });
// })
// .catch(err => {
//     console.error("❌ MongoDB connection error:", err);
// });

const dotenv = require('dotenv');
dotenv.config();
 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2; // ✅ ADD
const User = require('./models/User');
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const executiveRoutes = require("./routes/executiveRoutees"); 

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function ensureAdminUser() {
  const emailId = process.env.ADMIN_EMAIL || 'admin10@gmail.com';
  const mobileNumber = process.env.ADMIN_MOBILE || '9876543210';
  const plainPassword = process.env.ADMIN_PASSWORD || 'Admin789';

  try {
    let admin = await User.findOne({ $or: [{ emailId }, { mobileNumber }] });

    if (admin) {
      admin.role = 'admin';
      admin.isApproved = true;
      admin.isRejected = false;
      await admin.save();
      console.log(`✅ Admin user ready: ${emailId}`);
      return;
    }

    const hashed = await bcrypt.hash(plainPassword, 10);

    await User.create({
      fullName: 'Admin',
      emailId,
      mobileNumber,
      address: 'Ahmedabad',
      password: hashed,
      role: 'admin',
      photo: null,
      isApproved: true,
      isRejected: false,
    });

    console.log(`✅ Default admin created: ${emailId}`);
  } catch (err) {
    console.error('❌ Admin seed error:', err.message);
  }
}

// ✅ MIDDLEWARE FIRST
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ✅ ROUTES
app.use("/api/user", userRoutes);
app.use("/api/application", applicationRoutes);
app.use('/api/executive', executiveRoutes); 


// Test route
app.get('/', (req, res) => {
  res.send("API running");
});


const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing in environment variables");
  process.exit(1);
}


mongoose.connect(MONGODB_URI)
.then(async () => {
    console.log("✅ MongoDB connected");
    await ensureAdminUser();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}) 
.catch(err => {
    console.error("❌ MongoDB connection error:", err);
});