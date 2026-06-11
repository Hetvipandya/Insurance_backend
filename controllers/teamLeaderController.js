const TeamLeader = require("../models/TeamLeader");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.createTeamLeader = async (
  req,
  res
) => {
  try {
    const {
      Name,
      Email,
      password,
      mobileNo,
      address,
    } = req.body;

    console.log(
      "REQ BODY:",
      req.body
    );

    if (
      !Name ||
      !Email ||
      !password ||
      !mobileNo ||
      !address
    ) {
      return res.status(400).json({
        message:
          "All fields are required",
      });
    }

    // check duplicate user
    const existingUser =
      await User.findOne({
        $or: [
          {
            emailId:
              Email,
          },
          {
            mobileNumber:
              mobileNo,
          },
        ],
      });

    if (existingUser) {
      return res.status(400).json({
        message:
          "A user with this email or mobile number already exists",
      });
    }

    // check duplicate TL
    const existingTL =
      await TeamLeader.findOne({
        $or: [
          { Email },
          {
            mobileNo,
          },
        ],
      });

    if (existingTL) {
      return res.status(400).json({
        message:
          "Team Leader already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    // Create USER FIRST
    const user =
      await User.create({
        fullName:
          Name,
        emailId:
          Email,
        mobileNumber:
          mobileNo,
        address:
          address,
        password:
          hashedPassword,
        role:
          "teamleader",
      });

    // Create TeamLeader
    const leader =
      await TeamLeader.create({
        Name,
        Email,
        password:
          hashedPassword,
        mobileNo,
        address,
        user:
          user._id,
      });

    return res
      .status(201)
      .json({
        success: true,
        message:
          "Team Leader created successfully",
        leader,
      });
  } catch (error) {
    console.log(
      "CREATE TL ERROR:",
      error
    );

    return res.status(500).json({
      message:
        error.message,
    });
  }
};




exports.getLoggedInTeamLeader =
  async (req, res) => {
    try {
      const userId =
        req.user.id;

      const teamLeader =
        await TeamLeader.findOne({
          user: userId,
        });

      if (!teamLeader) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Team Leader not found",
          });
      }

      return res
        .status(200)
        .json({
          success: true,
          data: teamLeader,
        });
    } catch (err) {
      console.log(
        "Get TL Error:",
        err
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            err.message,
        });
    }
  };
  
exports.loginTeamLeader = async (req, res) => {
  try {
    const { Email, password } = req.body;

    if (!Email || !password) {
      return res.status(400).json({ message: "Email and Password are required" });
    }

    const leader = await TeamLeader.findOne({ Email });

    if (!leader) return res.status(404).json({ message: "TeamLeader not found" });

    const isMatch = await bcrypt.compare(password, leader.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid Password" });

    const token = jwt.sign(
      { id: leader._id, Email: leader.Email, role: "teamleader" },
      process.env.JWT_SECRET || "mySecretKey",
      { expiresIn: "7d" }
    );

    return res.status(200).json({ message: "Login successful", token, leader, role: "teamleader" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Login error", error });
  }
};

exports.getTeamLeaders = async (req, res) => {
  try {
    const leaders = await TeamLeader.find();
    res.status(200).json(leaders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching TeamLeaders", error });
  }
};

exports.getTeamLeaderById = async (req, res) => {
  try {
    const leader = await TeamLeader.findById(req.params.id);
    if (!leader) return res.status(404).json({ message: "TeamLeader not found" });
    res.status(200).json(leader);
  } catch (error) {
    res.status(500).json({ message: "Error fetching TeamLeader", error });
  }
};

exports.updateTeamLeader = async (req, res) => {
  try {
    const { Name, Email, password, mobileNo } = req.body;

    const leader = await TeamLeader.findById(req.params.id);

    if (!leader) {
      return res.status(404).json({ message: "TeamLeader not found" });
    }

    // 🔥 CRITICAL FIX
    if (!leader.user) {
      return res.status(400).json({
        message: "Invalid TeamLeader: missing user reference",
      });
    }

    if (Name !== undefined) leader.Name = Name;
    if (Email !== undefined) leader.Email = Email;
    if (mobileNo !== undefined) leader.mobileNo = mobileNo;

    if (password && password.trim() !== "") {
      leader.password = await bcrypt.hash(password, 10);
    }

    await leader.save();

    return res.status(200).json({
      message: "TeamLeader updated successfully",
      leader,
    });

  } catch (error) {
    console.log("UPDATE ERROR:", error);

    return res.status(500).json({
      message: "Error updating TeamLeader",
      error: error.message,
    });
  }
};

exports.deleteTeamLeader =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const teamLeader =
        await TeamLeader.findById(
          id
        );

      if (
        !teamLeader
      ) {
        return res
          .status(404)
          .json({
            message:
              "Team Leader not found",
          });
      }

      await TeamLeader.findByIdAndDelete(
        id
      );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Team Leader deleted successfully",
        });
    } catch (error) {
      console.log(
        "Delete Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Server Error",
        });
    }
  };