const express = require("express");
const router = express.Router();
const authController = require("../controllers/userController");
const upload = require("../middleware/multer");
const { authMiddleware } = require("../middleware/auth");

// ================= AUTH =================

// Register with profile image
router.post(
  "/register", 
  upload.single("profileImage"),  
  authController.registerUser 
);

// Login
router.post("/login", authController.loginUser);

// ================= ADMIN =================
router.get("/dealers", authController.getAllDealers);
router.put("/approve/:id", authController.approveDealer);
router.put("/reject/:id", authController.rejectDealer);
router.delete("/delete/:id", authController.deleteUser);

// ================= USER PROFILE =================
router.get("/profile/:id", authMiddleware, authController.getUserById);

module.exports = router; 