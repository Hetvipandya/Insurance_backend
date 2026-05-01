const express = require("express");
const router = express.Router();

const upload = require("../middleware/multer");
const { authMiddleware } = require("../middleware/auth");

const {
  createApplication,
  getMyApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
} = require("../controllers/applicationController");

const uploadFields = upload.fields([
  { name: "rcBookImages", maxCount: 5 },
  { name: "aadharCardImages", maxCount: 5 },
  { name: "panCardImages", maxCount: 5 },
  { name: "oldPolicyImages", maxCount: 5 },
  { name: "otherImages", maxCount: 5 },
]);

router.post("/create", authMiddleware, uploadFields, createApplication);
router.get("/my", authMiddleware, getMyApplications);
router.get("/:id", authMiddleware, getApplicationById);
router.put("/update/:id", authMiddleware, uploadFields, updateApplication);
router.delete("/delete/:id", authMiddleware, deleteApplication);

module.exports = router;