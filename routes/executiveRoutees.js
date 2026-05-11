const express = require("express");
const router = express.Router();

const { createExecutive, getExecutives, getExecutiveById, updateExecutive, deleteExecutive } = require("../controllers/executiveController");

router.post("/create", createExecutive);    
router.get("/", getExecutives);
router.get("/:id", getExecutiveById); 
router.put("/update/:id", updateExecutive);
router.delete("/delete/:id", deleteExecutive);

module.exports = router; 