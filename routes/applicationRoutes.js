const express = require("express");
const router = express.Router();

const upload = require("../middleware/multer");
const { authMiddleware } = require("../middleware/auth");

const {
  createApplication,
  getMyApplications,
   getApplicationStats,
  getAllApplicationsForAdmin, 
  getApplicationById,
  getApplicationByExecutive,
   getApplicationByTeamLeader,
  assignExecutive,
  updateApplication,
  deleteApplication,
  getApplicationPDF,
  regenerateApplicationPDF,
} = require("../controllers/applicationController");

const uploadFields = upload.fields([
  { name: "rcBookImages", maxCount: 5 },
  { name: "aadharCardImages", maxCount: 5 },
  { name: "panCardImages", maxCount: 5 },
  { name: "oldPolicyImages", maxCount: 5 },
  { name: "otherImages", maxCount: 5 },
  { name: "adminPolicyDocument", maxCount: 1 },
]);

router.post("/create", authMiddleware, uploadFields, createApplication);
router.get("/my", authMiddleware, getMyApplications);
router.get(
  "/stats",
  authMiddleware,
  getApplicationStats
);
router.get("/admin", authMiddleware, getAllApplicationsForAdmin);
router.get("/:id", authMiddleware, getApplicationById);
router.get("/executive/:id", authMiddleware, getApplicationByExecutive);
router.put(
  "/assign-executive/:id",
  authMiddleware,
  assignExecutive
);
router.get(
  "/teamleader/:id",
  authMiddleware,
  getApplicationByTeamLeader
);
router.put(
  "/update/:id",
  authMiddleware,
    uploadFields,
  updateApplication
);
router.delete("/delete/:id", authMiddleware, deleteApplication);

// ================= PDF ROUTES =================
router.get("/pdf/:id", authMiddleware, getApplicationPDF);
router.post("/pdf/regenerate/:id", authMiddleware, regenerateApplicationPDF);

module.exports = router;