const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ===================== REGISTER =====================
exports.registerUser = async (req, res) => {
  try {
    const {
      fullName,
      emailId,
      mobileNumber,
      address,
      password,
      confirmPassword,
    } = req.body;

    // validation
    if (!fullName || !emailId || !mobileNumber || !address || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // check existing user
    const existingUser = await User.findOne({
      $or: [{ emailId }, { mobileNumber }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ safe image handling
    const photo = req.file ? req.file.path : null;

    const user = await User.create({
      fullName,
      emailId,
      mobileNumber,
      address,
      password: hashedPassword,
      photo,
    });

    res.status(201).json({
      message: "Registered successfully. Wait for admin approval.",
      user,
    });

  } catch (error) {
    // ✅ multer error handling
    if (error.message.includes("Only JPG")) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: error.message });
  }
};


// ===================== LOGIN =====================
exports.loginUser = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const user = await User.findOne({ emailId });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 🚫 dealer not approved
    if (user.role === "dealer" && !user.isApproved) {
      if (user.isRejected) {
        return res.status(403).json({
          message: `Rejected by admin: ${user.rejectReason || "No reason"}`
        });
      }

      return res.status(403).json({
        message: "Wait for admin approval"
      });
    }

    // token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ===================== GET ALL DEALERS (ADMIN) =====================
exports.getAllDealers = async (req, res) => {
  try {
    const dealers = await User.find({ role: "dealer" });
    res.json(dealers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ===================== APPROVE DEALER =====================
exports.approveDealer = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      {
        isApproved: true,
        isRejected: false,
        rejectReason: null,
      },
      { new: true }
    );

    res.json({ message: "Dealer approved", user });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ===================== REJECT DEALER =====================
exports.rejectDealer = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      {
        isApproved: false,
        isRejected: true,
        rejectReason: reason || "No reason provided",
      },
      { new: true }
    );

    res.json({ message: "Dealer rejected", user });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================== DELETE USER (ADMIN) =====================
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(id);

    res.json({ message: "User deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};