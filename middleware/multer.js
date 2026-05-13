const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// ================= CLOUDINARY CONFIG =================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ================= CLOUDINARY STORAGE =================
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "insurance-app", // Folder name in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "pdf", "doc", "docx"],
    resource_type: "auto", // Allows images and PDFs
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