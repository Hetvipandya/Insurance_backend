const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// ================= CLOUDINARY CONFIG =================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ================= STORAGE =================
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => { 
    return {
      folder: "insurance",
      resource_type: "auto",
      public_id:
        Date.now() + "-" + file.originalname.split(".")[0],
    };
  },
});

// ================= FILE FILTER =================
const fileFilter = (req, file, cb) => {
  cb(null, true);
};

// ================= MULTER CONFIG =================
const upload = multer({
  storage,
  fileFilter,
});

module.exports = upload;