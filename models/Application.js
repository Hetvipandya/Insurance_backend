// const mongoose = require("mongoose");

// const applicationSchema = new mongoose.Schema(
//   { 
//     applicationId: {
//       type: String,
//       unique: true,
//     },

//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     executive: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Executive",
//       default: null,
//     },

//     carNo: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     mobileNo: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     rcBookImages: {
//       type: [String],
//       required: true,
//       validate: [(val) => val.length > 0, "RC Book images required"],
//     },

//     aadharCardImages: {
//       type: [String],
//       required: true,
//       validate: [(val) => val.length > 0, "Aadhar images required"],
//     },

//     panCardImages: {
//       type: [String],
//       default: [],
//     },

//     oldPolicyImages: {
//       type: [String],
//       default: [],
//     },

//     adminPolicyDocument: {
//       type: String,
//       default: null,
//     },

//     status: {
//       type: String,
//       enum: ["pending", "approved", "rejected"],
//       default: "pending",
//     },

//     tp: {
//       type: String,
//       required: true,
//       default: "none",
//     },

//       rejectionReason: {
//       type: String,
//       default: "",
//       trim: true,
//     },

//     otherImages: {
//       type: [String],
//       default: [],
//     },

//     otherDetails: {
//       type: String,
//       trim: true,
//     },
//   },
//   { timestamps: true }
// );

// // Generate applicationId before saving (format: DDMMYYYYHHMMSS)
// applicationSchema.pre("save", function () {
//   if (!this.applicationId) {
//     const now = new Date();
//     const day = String(now.getDate()).padStart(2, "0");
//     const month = String(now.getMonth() + 1).padStart(2, "0");
//     const year = now.getFullYear();
//     const hours = String(now.getHours()).padStart(2, "0");
//     const minutes = String(now.getMinutes()).padStart(2, "0");
//     const seconds = String(now.getSeconds()).padStart(2, "0");

//     this.applicationId = `${day}${month}${year}${hours}${minutes}${seconds}`;
//   }

// });

// module.exports = mongoose.model("Application", applicationSchema);

const mongoose = require("mongoose");

// ================= DOCUMENT SCHEMA =================
const documentHistorySchema =
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
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      executive: {
        type: mongoose.Schema.Types.ObjectId,
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

      rcBookImages: {
        type: [String],
        required: true,
      },

      aadharCardImages: {
        type: [String],
        required: true,
      },

      panCardImages: {
        type: [String],
        default: [],
      },

      oldPolicyImages: {
        type: [String],
        default: [],
      },

      otherImages: {
        type: [String],
        default: [],
      },

      newDocuments: {
        rcBookImages: {
          type: [documentHistorySchema],
          default: [],
        },

        aadharCardImages: {
          type: [documentHistorySchema],
          default: [],
        },

        panCardImages: {
          type: [documentHistorySchema],
          default: [],
        },

        oldPolicyImages: {
          type: [documentHistorySchema],
          default: [],
        },

        otherImages: {
          type: [documentHistorySchema],
          default: [],
        },
      },

      adminPolicyDocument: {
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

// ================= APPLICATION ID GENERATE =================
applicationSchema.pre(
  "save",
  function (next) {
    if (!this.applicationId) {
      const now = new Date();

      // Convert UTC to IST (+5:30)
      const indiaTime = new Date(
        now.getTime() +
          5.5 * 60 * 60 * 1000
      );

      const year =
        indiaTime.getUTCFullYear();

      const month = String(
        indiaTime.getUTCMonth() +
          1
      ).padStart(2, "0");

      const day = String(
        indiaTime.getUTCDate()
      ).padStart(2, "0");

      const hours = String(
        indiaTime.getUTCHours()
      ).padStart(2, "0");

      const minutes = String(
        indiaTime.getUTCMinutes()
      ).padStart(2, "0");

      const seconds = String(
        indiaTime.getUTCSeconds()
      ).padStart(2, "0");

      // YYYYMMDDHHMMSS
      this.applicationId = `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    next();
  }
);

module.exports =
  mongoose.model(
    "Application",
    applicationSchema
  );