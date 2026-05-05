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
const cloudinary = require('cloudinary').v2; // ✅ ADD

const userRoutes = require("./routes/userRoutes");
const applicationRoutes = require("./routes/applicationRoutes");

const app = express();


// ✅ CLOUDINARY CONFIG (ONLY ADD THIS BLOCK)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("☁️ Cloudinary Config Loaded");


// ✅ MIDDLEWARE FIRST
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ✅ STATIC
app.use('/uploads', express.static('uploads'));


// ✅ ROUTES
app.use("/api/user", userRoutes);
app.use("/api/application", applicationRoutes);


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
.then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
})
.catch(err => {
    console.error("❌ MongoDB connection error:", err);
});