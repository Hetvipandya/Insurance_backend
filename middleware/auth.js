const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Executive = require("../models/Executive");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

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

    // SAME SECRET KEY
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "mySecretKey"
    );

    let role = decoded.role;

    if (!role) {
      let user = await User.findById(decoded.id);

      if (!user) {
        user = await Executive.findById(decoded.id);
      }

      if (!user) {
        return res.status(401).json({
          message: "User not found",
        });
      }

      role = user.role || "executive";
    }

    req.user = {
      id: decoded.id,
      _id: decoded.id,
      role,
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