const TeamLeader = require("../models/TeamLeader");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// exports.createTeamLeader = async (req, res) => {
//   try {
//     const { Name, Email, password, mobileNo, address } = req.body;

//     if (!Name || !Email || !password || !mobileNo || !address) {
//       return res.status(400).json({ message: "Name, Email, password, mobileNo and address are required" });
//     }

//     // prevent duplicates in User collection
//     const existingUser = await User.findOne({ $or: [{ emailId: Email }, { mobileNumber: mobileNo }] });
//     if (existingUser) {
//       return res.status(400).json({ message: "A user with this email or mobile number already exists" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     // create TeamLeader
//     const leader = new TeamLeader({
//       Name,
//       Email,
//       password: hashedPassword,
//       mobileNo,
//     });
//     await leader.save();

//     // create corresponding User record so TL can login via /login
//     const user = await User.create({
//       fullName: Name,
//       emailId: Email,
//       mobileNumber: mobileNo,
//       address,
//       password: hashedPassword,
//       role: "teamleader",
//     });

//     res.status(201).json({ message: "TeamLeader created successfully", leader, user });
//   } catch (error) {
//     // rollback if leader was created but user creation failed
//     if (error && error.code !== undefined) {
//       console.log("CREATE TL ERROR:", error);
//     }
//     res.status(500).json({ message: "Error creating TeamLeader", error });
//   }
// };

exports.createTeamLeader =
  async (req, res) => {
    try {
      const {
        Name,
        Email,
        password,
        mobileNo,
      } = req.body;

      // create user
      const createdUser =
        await User.create({
          fullName: Name,
          emailId: Email,
          password,
          mobileNumber:
            mobileNo,
          role:
            "teamleader",
        });

      // create TL
      const tl =
        await TeamLeader.create({
          user:
            createdUser._id,

          Name,
          Email,
          password,
          mobileNo,
        });

      res.status(201).json({
        success: true,
        data: tl,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
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
    if (!leader) return res.status(404).json({ message: "TeamLeader not found" });
    if (Name) leader.Name = Name;
    if (Email) leader.Email = Email;
    if (password) leader.password = await bcrypt.hash(password, 10);
    if (mobileNo) leader.mobileNo = mobileNo;
    await leader.save();
    res.status(200).json({ message: "TeamLeader updated successfully", leader });
  } catch (error) {
    res.status(500).json({ message: "Error updating TeamLeader", error });
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