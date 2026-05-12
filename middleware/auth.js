const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Executive = require("../models/Executive");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ================= CHECK TOKEN =================
    if (!authHeader) {
      return res.status(401).json({
        message: "Access denied. No token provided",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Invalid token format",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token missing",
      });
    }

    // ================= VERIFY TOKEN =================
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "mySecretKey"
    );

    let role = decoded.role;
    let userData = null;

    // ================= FIND USER =================
    if (!role) {

      // Check in User model
      userData = await User.findById(decoded.id).select("role");

      // If not found in User then check Executive
      if (!userData) {
        userData = await Executive.findById(decoded.id).select("_id");
      }

      if (!userData) {
        return res.status(401).json({
          message: "User not found",
        });
      }

      role = userData.role || "executive";
    }

    // ================= SAVE USER DATA =================
    req.user = {
      id: decoded.id,
      role,
      registrationType: decoded.registrationType || null,
    };

    next();

  } catch (err) {
    console.log(err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired",
      });
    }

    return res.status(401).json({
      message: "Invalid token",
      error: err.message,
    });
  }
};

module.exports = { authMiddleware };