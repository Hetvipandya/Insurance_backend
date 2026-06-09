const mongoose = require("mongoose");

const teamLeaderSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: true,
    },

    Email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    mobileNo: {
      type: String,
      required: true,
      unique: true,
    },

    assignedApplications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TeamLeader", teamLeaderSchema);
