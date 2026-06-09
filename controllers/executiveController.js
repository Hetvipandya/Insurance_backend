const Executive = require("../models/Executive");
const TeamLeader = require("../models/TeamLeader");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.createExecutive = async (req, res) => {
    try {
          const { Name, Email, password, mobileNo, teamLeaderId } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
          if (teamLeaderId) {
            const tl = await TeamLeader.findById(teamLeaderId);
            if (!tl) {
              return res.status(400).json({ message: "Invalid teamLeaderId" });
            }
          }

          const executive = new Executive({
            Name,
            Email,
            password: hashedPassword,
            mobileNo,
            teamLeader: teamLeaderId || undefined,
          });
        await executive.save();
        res.status(201).json({ message: "Executive created successfully", executive });
    } catch (error) {
        res.status(500).json({ message: "Error creating executive", error });
    }
};

exports.loginExecutive = async (req, res) => {
  try {
    const { Email, password } = req.body;

    if (!Email || !password) {
      return res.status(400).json({
        message: "Email and Password are required",
      });
    }

    const executive = await Executive.findOne({ Email });

    if (!executive) {
      return res.status(404).json({
        message: "Executive not found",
      });
    }

    const isMatch = await bcrypt.compare(password, executive.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid Password",
      });
    }

    const token = jwt.sign(
      {
        id: executive._id,
        Email: executive.Email,
        role: "executive",
      },
      process.env.JWT_SECRET || "mySecretKey",
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      executive,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Login error",
      error,
    });
  }
};

exports.getExecutives = async (req, res) => {
    try {
        const executives = await Executive.find();
        res.status(200).json(executives);
    } catch (error) {
        res.status(500).json({ message: "Error fetching executives", error });
    }       
};

exports.getExecutiveById = async (req, res) => {
    try {
        const executive = await Executive.findById(req.params.id);
        if (!executive) {
            return res.status(404).json({ message: "Executive not found" });
        }
        res.status(200).json(executive);
    } catch (error) {
        res.status(500).json({ message: "Error fetching executive", error });
    }
};

exports.updateExecutive = async (req, res) => {
  try {
    const { Name, Email, password, mobileNo, teamLeaderId } = req.body
    const executive = await Executive.findById(req.params.id);
        if (!executive) {
            return res.status(404).json({ message: "Executive not found" });
        }
        if (Name) executive.Name = Name;
        if (Email) executive.Email = Email;
        if (password) executive.password = await bcrypt.hash(password, 10);
        if (mobileNo) executive.mobileNo = mobileNo;
    if (teamLeaderId) {
      const tl = await TeamLeader.findById(teamLeaderId);
      if (!tl) return res.status(400).json({ message: "Invalid teamLeaderId" });
      executive.teamLeader = teamLeaderId;
    }
        await executive.save();
        res.status(200).json({ message: "Executive updated successfully", executive });
    } catch (error) {
        res.status(500).json({ message: "Error updating executive", error });
    }   
};

exports.deleteExecutive = async (req, res) => {
    try {        
        const executive = await Executive.findByIdAndDelete(req.params.id);
        if (!executive) {
            return res.status(404).json({ message: "Executive not found" });
        }   
        res.status(200).json({ message: "Executive deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting executive", error });
    }
};