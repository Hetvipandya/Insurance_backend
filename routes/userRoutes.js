const express = require("express");
const router = express.Router();
const authController = require("../controllers/userController");
const upload = require("../middleware/multer");

// ================= AUTH =================

// Register with profile image
router.post(
  "/register",
  upload.single("profileImage"), // 👈 add this
  authController.registerUser
);

// Login
router.post("/login", authController.loginUser);

// ================= ADMIN =================
router.get("/dealers", authController.getAllDealers);
router.put("/approve/:id", authController.approveDealer);
router.put("/reject/:id", authController.rejectDealer);
router.delete("/delete/:id", authController.deleteUser);

module.exports = router;