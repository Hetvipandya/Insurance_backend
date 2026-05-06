const multer = require("multer");

// ================= STORAGE =================
const storage = multer.memoryStorage();

// ================= FILE FILTER =================
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpg|jpeg|png/;

  const extname = allowedTypes.test(
    file.originalname?.toLowerCase()
  );

  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG files are allowed"));
  }
};

// ================= MULTER CONFIG =================
const upload = multer({
  storage,
  fileFilter,
});

module.exports = upload;