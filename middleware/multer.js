const multer = require("multer");

// ================= STORAGE =================
const storage = multer.memoryStorage();

// ================= FILE FILTER =================
const fileFilter = (req, file, cb) => {
  cb(null, true); // allow all file types
};

// ================= MULTER CONFIG =================
const upload = multer({
  storage,
  fileFilter,
});

module.exports = upload;