const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const TeamLeader = require("../models/TeamLeader");

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

    // ✅ safe image handling (Cloudinary URL)
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
    const {
      identifier, // new: accepts either email or mobile
      emailId,
      mobileNumber,
      password,
      fcmToken,
    } = req.body;

    // DEBUG
    console.log("REQ BODY:", req.body);
    console.log("FCM TOKEN RECEIVED:", fcmToken);

    // identifier preferred, fallback to emailId/mobileNumber for compatibility
    const id = identifier || emailId || mobileNumber;

    if (!id || !password) {
      return res.status(400).json({
        message:
          "Email or mobile number and password are required",
      });
    }

    // Determine whether identifier is email or phone
    const isEmail = (identifier && identifier.includes("@")) || (emailId && emailId.includes("@"));

    const query = [];
    if (isEmail) query.push({ emailId: (id || "").toLowerCase() });
    else query.push({ mobileNumber: id });

    const user = await User.findOne({ $or: query });

    if (!user) {
      // Try TeamLeader collection for legacy/alternate TL logins
      const tlQuery = {};
      if (isEmail) tlQuery.Email = id;
      else tlQuery.mobileNo = id;

      const teamLeader = await TeamLeader.findOne(tlQuery);

      if (!teamLeader) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const isTLMatch = await bcrypt.compare(password, teamLeader.password);
      if (!isTLMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Ensure a corresponding User exists (create if missing)
      let tlUser = await User.findOne({ emailId: teamLeader.Email });
      if (!tlUser) {
        // address is required in User schema; use placeholder if not available
        const placeholderAddress = "Not provided";
        tlUser = await User.create({
          fullName: teamLeader.Name,
          emailId: teamLeader.Email,
          mobileNumber: teamLeader.mobileNo,
          address: placeholderAddress,
          password: teamLeader.password, // already hashed
          role: "teamleader",
        });
      }

      // create token for teamleader
      const tlToken = jwt.sign({ id: tlUser._id, role: "teamleader" }, process.env.JWT_SECRET, { expiresIn: "7d" });

      // update FCM token if provided
      if (fcmToken && fcmToken.trim() !== "") {
        tlUser.fcmToken = fcmToken.trim();
        await tlUser.save();
      }

      const sentUser = await User.findById(tlUser._id).select("-password");

      return res.json({ message: "Login successful", token: tlToken, user: sentUser, role: "teamleader" });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.status(400).json({
        message:
          "Invalid credentials",
      });
    }

    // ================= SAVE FCM TOKEN =================
    if (
      fcmToken &&
      fcmToken.trim() !== ""
    ) {
      user.fcmToken =
        fcmToken.trim();

      await user.save();

      console.log(
        "FCM TOKEN SAVED:",
        user.fcmToken
      );
    } else {
      console.log(
        "FCM TOKEN NOT RECEIVED"
      );
    }

    // ================= DEALER APPROVAL =================
    if (
      user.role === "dealer" &&
      !user.isApproved
    ) {
      if (user.isRejected) {
        return res.status(403).json({
          message: `Rejected by admin: ${
            user.rejectReason ||
            "No reason"
          }`,
        });
      }

      return res.status(403).json({
        message:
          "Wait for admin approval",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // fresh user data
    const updatedUser =
      await User.findById(
        user._id
      ).select("-password");

    res.json({
      message:
        "Login successful",
      token,
      user: updatedUser,
    });
  } catch (error) {
    console.log(
      "LOGIN ERROR:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
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

// ===================== GET USER PROFILE BY ID =====================
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
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