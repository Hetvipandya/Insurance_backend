const express = require("express");
const router = express.Router();

const {
  createTeamLeader,
  loginTeamLeader,
  getTeamLeaders,
  getTeamLeaderById,
  updateTeamLeader,
  deleteTeamLeader,
} = require("../controllers/teamLeaderController");

router.post("/create", createTeamLeader);
router.post("/login", loginTeamLeader);

router.get("/", getTeamLeaders);
router.get("/:id", getTeamLeaderById);
router.put("/update/:id", updateTeamLeader);
router.delete("/delete/:id", deleteTeamLeader);

module.exports = router;
