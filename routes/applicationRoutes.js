// const express = require("express");
// const router = express.Router();

// const upload = require("../middleware/multer");
// const { authMiddleware } = require("../middleware/auth");

// const {
//   createApplication,
//   getMyApplications,
//   getAllApplicationsForAdmin, 
//   getApplicationById,
//   getApplicationByExecutive,
//   assignExecutive,
//   updateApplication,
//   deleteApplication,
// } = require("../controllers/applicationController");

// const uploadFields = upload.fields([
//   { name: "rcBookImages", maxCount: 5 },
//   { name: "aadharCardImages", maxCount: 5 },
//   { name: "panCardImages", maxCount: 5 },
//   { name: "oldPolicyImages", maxCount: 5 },
//   { name: "otherImages", maxCount: 5 },
//   { name: "adminPolicyDocument", maxCount: 1 },
// ]);

// router.post("/create", authMiddleware, uploadFields, createApplication);
// router.get("/my", authMiddleware, getMyApplications);
// router.get("/admin", authMiddleware, getAllApplicationsForAdmin);
// router.get("/:id", authMiddleware, getApplicationById);
// router.get("/executive/:id", authMiddleware, getApplicationByExecutive);
// router.put(
//   "/assign-executive/:id",
//   authMiddleware,
//   assignExecutive
// );
// router.put(
//   "/update/:id",
//   authMiddleware,
//     uploadFields,
//   updateApplication
// );
// router.delete("/delete/:id", authMiddleware, deleteApplication);

// module.exports = router;

const mongoose =
  require("mongoose");

// ================= DOCUMENT HISTORY SCHEMA =================
const documentSchema =
  new mongoose.Schema(
    {
      urls: {
        type: [String],
        default: [],
      },

      uploadedAt: {
        type: Date,
        default: Date.now,
      },

      uploadedAfterReject: {
        type: Boolean,
        default: false,
      },
    },
    { _id: false }
  );

const applicationSchema =
  new mongoose.Schema(
    {
      applicationId: {
        type: String,
        unique: true,
      },

      user: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "User",
        required: true,
      },

      executive: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "Executive",
        default: null,
      },

      carNo: {
        type: String,
        required: true,
        trim: true,
      },

      mobileNo: {
        type: String,
        required: true,
        trim: true,
      },

      // ================= DOCUMENTS =================
      rcBookImages: {
        type: [documentSchema],
        required: true,
      },

      aadharCardImages: {
        type: [documentSchema],
        required: true,
      },

      panCardImages: {
        type: [documentSchema],
        default: [],
      },

      oldPolicyImages: {
        type: [documentSchema],
        default: [],
      },

      otherImages: {
        type: [documentSchema],
        default: [],
      },

      adminPolicyDocument:
        {
          type: String,
          default: null,
        },

      status: {
        type: String,
        enum: [
          "pending",
          "approved",
          "rejected",
        ],
        default: "pending",
      },

      tp: {
        type: String,
        required: true,
        default: "none",
      },

      rejectionReason: {
        type: String,
        default: "",
        trim: true,
      },

      otherDetails: {
        type: String,
        trim: true,
      },
    },
    { timestamps: true }
  );

// ================= APPLICATION ID =================
applicationSchema.pre(
  "save",
  function () {
    if (
      !this.applicationId
    ) {
      const now =
        new Date();

      const day = String(
        now.getDate()
      ).padStart(2, "0");

      const month =
        String(
          now.getMonth() +
            1
        ).padStart(
          2,
          "0"
        );

      const year =
        now.getFullYear();

      const hours =
        String(
          now.getHours()
        ).padStart(
          2,
          "0"
        );

      const minutes =
        String(
          now.getMinutes()
        ).padStart(
          2,
          "0"
        );

      const seconds =
        String(
          now.getSeconds()
        ).padStart(
          2,
          "0"
        );

      this.applicationId = `${day}${month}${year}${hours}${minutes}${seconds}`;
    }
  }
);

module.exports =
  mongoose.model(
    "Application",
    applicationSchema
  );