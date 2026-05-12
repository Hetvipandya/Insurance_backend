const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only access" });
  }
  next();
};

const executiveOnly = (req, res, next) => {
  if (req.user.role !== "executive") {
    return res.status(403).json({ message: "Executive only access" });
  }
  next();
};

module.exports = { adminOnly, executiveOnly };