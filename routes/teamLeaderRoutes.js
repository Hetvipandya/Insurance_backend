const express = require("express");
const router = express.Router();

const {
  createTeamLeader,
  loginTeamLeader,
  getTeamLeaders,
  getTeamLeaderById,
  updateTeamLeader,
  deleteTeamLeader,
   getLoggedInTeamLeader,
} = require("../controllers/teamLeaderController");

const { authMiddleware } = require("../middleware/auth");

router.post("/create", createTeamLeader);
router.post("/login", loginTeamLeader);

router.get(
  "/me",
  authMiddleware,
  getLoggedInTeamLeader
);

router.get("/all", getTeamLeaders);
router.get("/:id", getTeamLeaderById);
router.put("/update/:id", updateTeamLeader);
router.delete("/delete/:id", deleteTeamLeader);

module.exports = router;
