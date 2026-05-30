const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Save FCM token for a user
router.post("/save-token", async (req, res) => {
  try {
    const { userId, token } = req.body;

    await User.findByIdAndUpdate(userId, {
      fcmToken: token
    }); 
 
    res.json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      success: false
    });
  }
});

module.exports = router;
