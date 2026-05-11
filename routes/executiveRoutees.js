const express = require("express");
const router = express.Router();

const {
  createExecutive,
  loginExecutive,
  getExecutives,
  getExecutiveById,
  updateExecutive,
  deleteExecutive,
} = require("../controllers/executiveController");

router.post("/create", createExecutive);
router.post("/login", loginExecutive);

router.get("/", getExecutives);
router.get("/:id", getExecutiveById);
router.put("/update/:id", updateExecutive);
router.delete("/delete/:id", deleteExecutive);

module.exports = router;