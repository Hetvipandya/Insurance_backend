const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ================= CREATE UPLOAD FOLDER =================
const uploadPath = "uploads/";

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// ================= STORAGE =================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(
      null,
      uniqueName + path.extname(file.originalname)
    );
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