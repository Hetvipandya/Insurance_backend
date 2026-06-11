const TeamLeader = require("../models/TeamLeader");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// =======================
// CREATE TEAM LEADER
// =======================
exports.createTeamLeader = async (req, res) => {
  try {
    const { Name, Email, password, mobileNo, address } = req.body;

    if (!Name || !Email || !password || !mobileNo || !address) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // check duplicate user
    const existingUser = await User.findOne({
      $or: [
        { emailId: Email },
        { mobileNumber: mobileNo },
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "A user with this email or mobile number already exists",
      });
    }

    // check duplicate TeamLeader
    const existingTL = await TeamLeader.findOne({
      $or: [{ Email }, { mobileNo }],
    });

    if (existingTL) {
      return res.status(400).json({
        message: "Team Leader already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // create USER first
    const user = await User.create({
      fullName: Name,
      emailId: Email,
      mobileNumber: mobileNo,
      address,
      password: hashedPassword,
      role: "teamleader",
    });

    // create TeamLeader
    const leader = await TeamLeader.create({
      Name,
      Email,
      password: hashedPassword,
      mobileNo,
      address,
      user: user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Team Leader created successfully",
      leader,
    });

  } catch (error) {
    console.log("CREATE TL ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};


// =======================
// LOGIN TEAM LEADER
// =======================
exports.loginTeamLeader = async (req, res) => {
  try {
    const { Email, password } = req.body;

    if (!Email || !password) {
      return res.status(400).json({
        message: "Email and Password are required",
      });
    }

    const leader = await TeamLeader.findOne({ Email });

    if (!leader) {
      return res.status(404).json({ message: "TeamLeader not found" });
    }

    const isMatch = await bcrypt.compare(password, leader.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Password" });
    }

    const token = jwt.sign(
      {
        id: leader._id,
        Email: leader.Email,
        role: "teamleader",
      },
      process.env.JWT_SECRET || "mySecretKey",
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      leader,
      role: "teamleader",
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Login error",
      error: error.message,
    });
  }
};


// =======================
// GET LOGGED IN TEAM LEADER
// =======================
exports.getLoggedInTeamLeader = async (req, res) => {
  try {
    const userId = req.user.id;

    const teamLeader = await TeamLeader.findOne({ user: userId });

    if (!teamLeader) {
      return res.status(404).json({
        success: false,
        message: "Team Leader not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: teamLeader,
    });

  } catch (err) {
    console.log("Get TL Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// =======================
// GET ALL TEAM LEADERS
// =======================
exports.getTeamLeaders = async (req, res) => {
  try {
    const leaders = await TeamLeader.find();
    return res.status(200).json(leaders);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching TeamLeaders",
      error: error.message,
    });
  }
};


// =======================
// GET BY ID
// =======================
exports.getTeamLeaderById = async (req, res) => {
  try {
    const leader = await TeamLeader.findById(req.params.id);

    if (!leader) {
      return res.status(404).json({
        message: "TeamLeader not found",
      });
    }

    return res.status(200).json(leader);

  } catch (error) {
    return res.status(500).json({
      message: "Error fetching TeamLeader",
      error: error.message,
    });
  }
};


// =======================
// UPDATE TEAM LEADER (FIXED)
// =======================
exports.updateTeamLeader = async (req, res) => {
  try {
    const { Name, Email, password, mobileNo, address } = req.body;

    const leader = await TeamLeader.findById(req.params.id);

    if (!leader) {
      return res.status(404).json({
        message: "TeamLeader not found",
      });
    }

    // 🔥 FIX: DO NOT BLOCK OLD DATA (safe fallback)
    if (!leader.user) {
      console.warn("⚠ Missing user reference for TL:", leader._id);
      // auto-fix option (optional but recommended)
      const user = await User.findOne({ emailId: leader.Email });

      if (user) {
        leader.user = user._id;
      } else {
        return res.status(400).json({
          message: "Cannot update: user reference missing and cannot be repaired",
        });
      }
    }

    if (Name) leader.Name = Name;
    if (Email) leader.Email = Email;
    if (mobileNo) leader.mobileNo = mobileNo;
    if (address) leader.address = address;

    if (password && password.trim() !== "") {
      leader.password = await bcrypt.hash(password, 10);
    }

    const updatedLeader = await leader.save();

    return res.status(200).json({
      message: "TeamLeader updated successfully",
      leader: updatedLeader,
    });

  } catch (error) {
    console.log("UPDATE ERROR:", error);

    return res.status(500).json({
      message: "Error updating TeamLeader",
      error: error.message,
    });
  }
};


// =======================
// DELETE TEAM LEADER
// =======================
exports.deleteTeamLeader = async (req, res) => {
  try {
    const teamLeader = await TeamLeader.findById(req.params.id);

    if (!teamLeader) {
      return res.status(404).json({
        message: "Team Leader not found",
      });
    }

    await TeamLeader.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Team Leader deleted successfully",
    });

  } catch (error) {
    console.log("Delete Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};