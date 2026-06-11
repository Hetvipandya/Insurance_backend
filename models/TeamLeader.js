const mongoose = require("mongoose");

const teamLeaderSchema =
  new mongoose.Schema(
    {
      // link with User collection
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
      },

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

      address: {
  type: String,
  required: true,
},

      assignedApplications: [
        {
           type:
            mongoose.Schema.Types
              .ObjectId,
          ref: "Application",
        },
      ],
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "TeamLeader",
    teamLeaderSchema
  );