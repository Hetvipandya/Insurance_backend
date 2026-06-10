  const Application = require("../models/Application");
  const Executive = require("../models/Executive");
  const TeamLeader = require("../models/TeamLeader");
  const admin = require("../utils/firebaseAdmin");
  const User = require("../models/User");
  const { generateApplicationPDF } = require("../utils/pdfGenerator");
  const path = require("path");

  // ================= CREATE =================
  exports.createApplication = async (req, res) => {
    try {
      const { carNo, tp, otherDetails, mobileNo } =
        req.body;

      const userId = req.user?.id;

      // ================= AUTH CHECK =================
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // ================= ADMIN CHECK =================
      if (
        req.files?.adminPolicyDocument &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only admin can upload policy document",
        });
      }

      // ================= VALIDATION =================
      if (!carNo || !tp) {
        return res.status(400).json({
          success: false,
          message: "carNo & tp are required",
        });
      }

      // ================= GET CLOUDINARY URLS =================
  const getFileUrl = (file) => {
    return file.path;
  };

  const getFileUrls = (
    fieldName
  ) => {
    return (
      req.files?.[
        fieldName
      ]?.map(
        getFileUrl
      ) || []
    );
  };
      const rcBookImages =
        getFileUrls("rcBookImages");

      const aadharCardImages =
        getFileUrls("aadharCardImages");

      const panCardImages =
        getFileUrls("panCardImages");

      const oldPolicyImages =
        getFileUrls("oldPolicyImages");

      const otherImages =
        getFileUrls("otherImages");

    const adminPolicyDocument =
    req.files
      ?.adminPolicyDocument?.[0]
      ? getFileUrl(
          req.files
            .adminPolicyDocument[0]
        )
      : null;

      if (
        rcBookImages.length === 0 ||
        aadharCardImages.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "RC Book & Aadhar images are required",
        });
      }

      const app = await Application.create({
        user: userId,
        carNo,
        tp,
        mobileNo,
        otherDetails,

        rcBookImages,
        aadharCardImages,
        panCardImages,
        oldPolicyImages,
        otherImages,

        adminPolicyDocument,

        status: "pending",
      });

      try {
        const uploadsDir = path.join(__dirname, "../uploads");
        const pdfData = await generateApplicationPDF(app, uploadsDir);

        // Update application with PDF info
        app.pdfFileName = pdfData.fileName;
        app.pdfFileUrl = pdfData.fileUrl;
        await app.save();

        console.log("✅ PDF generated successfully:", pdfData.fileName);
      } catch (pdfError) {
        console.error("PDF Generation Error:", pdfError);
        // Continue even if PDF generation fails
      }

  try {
    // Find admin user
    const adminUser = await User.findOne({
      role: "admin",
    });

    // Check if admin has FCM token
    if (
      adminUser &&
      adminUser.fcmToken
    ) {
      await admin.messaging().send({
        token: adminUser.fcmToken,
        notification: {
          title:
            "New Insurance Application",
          body:
            `Car No: ${carNo} submitted by ${req.user.fullName}`,
        },
      });

      console.log(
        "✅ Notification sent"
      );
    } else {
      console.log(
        "❌ Admin FCM token not found"
      );
    } 
  } catch (notificationError) {
    console.log(
      "Notification Error:",
      notificationError
    );
  }

      return res.status(201).json({
        success: true,
        message: "Application created successfully",
        data: app,
      });
    } catch (err) {
      console.error(
        "Create Application Error:",
        err
      );

      return res.status(500).json({
        success: false,
        message: err.message || "Server Error",
      });
    }
  };



exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userRole = (req.user?.role || "").toLowerCase();

    // Debug logs to help frontend troubleshooting
    console.log("GET /api/application/my called. req.user:", req.user);

    // AUTH CHECK
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Optional filters
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, parseInt(req.query.limit || "0", 10));
    const statusFilter = req.query.status;

    let query = {};

    if (userRole === "admin") {
      query = {};
    } else if (userRole === "teamleader" || userRole === "tl") {
      // Resolve TeamLeader by linked user or by id
      let tl = await TeamLeader.findOne({ user: userId });
      if (!tl) tl = await TeamLeader.findById(userId);

      if (!tl) {
        return res.status(404).json({ success: false, message: "Team Leader not found" });
      }

      query = { teamLeader: tl._id };
    } else if (userRole === "executive" || userRole === "exe") {
      // Resolve Executive by id or linked user
      let executive = await Executive.findById(userId);
      if (!executive) executive = await Executive.findOne({ user: userId });

      if (!executive) {
        return res.status(404).json({ success: false, message: "Executive not found" });
      }

      query = { executive: executive._id };
    } else {
      // default: dealer/user
      query = { user: userId };
    }

    if (statusFilter) {
      query.status = statusFilter;
      console.log("Applying status filter:", statusFilter);
    }

    let q = Application.find(query)
      .populate("user", "fullName")
      .populate("executive", "Name")
      .sort({ createdAt: -1 });

    // apply pagination if limit provided
    let total = await Application.countDocuments(query);
    if (limit > 0) {
      const skip = (page - 1) * limit;
      q = q.skip(skip).limit(limit);
    }

    const apps = await q.exec();

    console.log("Query used for /my:", JSON.stringify(query), "returned", apps.length, "applications");

    return res.status(200).json({ success: true, data: apps, total, page: limit > 0 ? page : undefined, limit: limit || undefined });
  } catch (err) {
    console.error("GET MY APPLICATIONS ERROR:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

  exports.getApplicationStats = async (req, res) => {
    try {
      const stats = await Application.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]);

      let result = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      };

      stats.forEach((s) => {
        const status = (s._id || "pending").toLowerCase();

        if (result.hasOwnProperty(status)) {
          result[status] = s.count;
        }

        result.total += s.count;
      });

      return res.status(200).json({
        success: true,
        data: result,
      });

    } catch (err) {
      console.error("Stats Error:", err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  };

  // ================= GET ALL FOR ADMIN =================
  exports.getAllApplicationsForAdmin = async (req, res) => {
    try {
      console.log("Admin route called, user role:", req.user.role);

      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      console.log("Fetching applications...");
      const apps = await Application.find()
        .populate("user", "fullName emailId mobileNumber")
        .populate(
            "executive",
            "Name Email mobileNo"
          )
        .populate("teamLeader", "Name Email mobileNo")
        .sort({ createdAt: -1 });

      console.log("Found applications:", apps.length);
      res.json(apps);
    } catch (err) {
      console.error("Error fetching all applications for admin:", err);
      res.status(500).json({ message: "Server Error", error: err.message });
    }
  };

  exports.assignExecutive = async (req, res) => {
    try {
      const { id } = req.params;
      const { teamLeaderId, executiveId } = req.body;

      // ================= UPDATE APPLICATION =================
      // validate ids if provided
      if (teamLeaderId) {
        const tl = await TeamLeader.findById(teamLeaderId);
        if (!tl) return res.status(400).json({ success: false, message: "Invalid teamLeaderId" });
      }

      if (executiveId) {
        const ex = await Executive.findById(executiveId);
        if (!ex) return res.status(400).json({ success: false, message: "Invalid executiveId" });
      }

      const updateObj = {};
      if (teamLeaderId) updateObj.teamLeader = teamLeaderId;
      if (executiveId) updateObj.executive = executiveId;

      const updatedApplication = await Application.findByIdAndUpdate(id, updateObj, { new: true })
        .populate("user", "fullName emailId mobileNumber")
        .populate("executive", "Name emailId mobileNumber")
        .populate("teamLeader", "Name Email mobileNo");

      if (!updatedApplication) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      // ================= UPDATE EXECUTIVE & TEAMLEADER =================
      if (executiveId) {
        await Executive.findByIdAndUpdate(
          executiveId,
          {
            $addToSet: {
              assignedApplications: id,
            },
          },
          { new: true }
        );
      }

      if (teamLeaderId) {
        await TeamLeader.findByIdAndUpdate(
          teamLeaderId,
          {
            $addToSet: {
              assignedApplications: id,
            },
          },
          { new: true }
        );
      }

      res.status(200).json({
        success: true,
        message: "Executive Assigned Successfully",
        data: updatedApplication,
      });

    } catch (error) {
      console.log("ASSIGN EXECUTIVE ERROR:", error);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  exports.getApplicationByExecutive = async (req, res) => {
    try {
      const executiveId = req.params.id;

      const apps = await Application.find({
        executive: executiveId,
      })
        .populate("user", "fullName emailId mobileNumber")
        .populate("teamLeader", "Name Email mobileNo")
        .sort({ createdAt: -1 });

      res.json(apps);
    } catch (err) {
      console.error(
        "Error fetching applications for executive:",
        err
      );

      res.status(500).json({
        message: "Server Error",
        error: err.message,
      });
    }
  };

  // ================= GET APPLICATIONS BY TEAM LEADER =================
exports.getApplicationByTeamLeader =
  async (req, res) => {
    try {
      const teamLeaderId =
        req.params.id;

      const apps =
        await Application.find({
          teamLeader:
            teamLeaderId,
        })
          .populate(
            "user",
            "fullName emailId mobileNumber"
          )
          .populate(
            "executive",
            "Name Email mobileNo"
          )
          .populate(
            "teamLeader",
            "Name Email mobileNo"
          )
          .sort({
            createdAt: -1,
          });

      return res
        .status(200)
        .json({
          success: true,
          data: apps,
        });
    } catch (err) {
      console.error(
        "Error fetching applications for team leader:",
        err
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Server Error",
          error:
            err.message,
        });
    }
  };


  // ================= GET SINGLE =================
  exports.getApplicationById = async (req, res) => {
    try {
  const app = await Application.findById(req.params.id)
    .populate("user", "fullName emailId mobileNumber")
    .populate("executive", "Name emailId mobileNumber")
    .populate("teamLeader", "Name Email mobileNo");

      if (!app) {
        return res.status(404).json({ message: "Not found" });
      }

      res.json(app);
    } catch (err) {
      res.status(500).json({ message: "Server Error" });
    }
  };

  // ================= UPDATE =================

  exports.updateApplication = async (req, res) => {
    try {
      req.body = req.body || {};

      console.log("BODY:", req.body);
      console.log("FILES:", req.files);

      // ================= HELPER FUNCTION =================
      const getFileUrl = (file) => {
        return file.path;
      };

      const application = await Application.findById(
        req.params.id
      );

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      // ================= STATUS =================
      let statusChanged = false;
      let newStatus = null;

      if (req.body.status?.trim()) {
        const status =
          req.body.status.trim();

        // Track if status is being changed to approved or rejected
        if (status === "approved" || status === "rejected") {
          statusChanged = true;
          newStatus = status;
        }

        application.status = status;

        // ================= REJECT REASON =================
        if (status === "rejected") {
          application.rejectionReason =
            req.body.rejectionReason
              ? req.body.rejectionReason
                  .toString()
                  .trim()
              : "";
        }

        if (status === "approved") {
          application.rejectionReason =
            "";
        }
      }

      // ================= MOBILE NUMBER =================
      if (req.body.mobileNo?.trim()) {
        application.mobileNo =
          req.body.mobileNo.trim();
      }

      // ================= EXECUTIVE ASSIGN =================
      if (
        req.body.executiveId?.trim()
      ) {
        application.executive =
          req.body.executiveId.trim();

        await Executive.findByIdAndUpdate(
          req.body.executiveId,
          {
            $addToSet: {
              assignedApplications:
                application._id,
            },
          }
        );
      }

      // ================= HANDLE DOCUMENT UPDATE =================
      if (
        req.files &&
        Object.keys(req.files)
          .length > 0
      ) {
        const addNewDocument = (
          fieldName
        ) => {
          if (
            req.files[fieldName] &&
            req.files[fieldName]
              .length > 0
          ) {
        const uploadedFiles =
    req.files[
      fieldName
    ].map(
      getFileUrl
    );

            // ================= SAVE HISTORY =================
            if (
              !application
                .newDocuments
            ) {
              application.newDocuments =
                {};
            }

            if (
              !application
                .newDocuments[
                fieldName
              ]
            ) {
              application.newDocuments[
                fieldName
              ] = [];
            }

            application.newDocuments[
              fieldName
            ].push({
              urls: uploadedFiles,
              uploadedAt:
                new Date(),

              uploadedAfterReject:
                application.status ===
                "rejected",
            });

            // ================= IMPORTANT FIX =================
            // OLD + NEW IMAGES MERGE
            application[
              fieldName
            ] = [
              ...(application[
                fieldName
              ] || []),
              ...uploadedFiles,
            ];
          }
        };

        // ================= UPDATE DOCS =================
        addNewDocument(
          "rcBookImages"
        );

        addNewDocument(
          "aadharCardImages"
        );

        addNewDocument(
          "panCardImages"
        );

        addNewDocument(
          "oldPolicyImages"
        );

        addNewDocument(
          "otherImages"
        );

        // ================= POLICY DOCUMENT =================
        if (
          req.files
            .adminPolicyDocument &&
          req.files
            .adminPolicyDocument
            .length > 0
        ) {
        application.adminPolicyDocument =
    getFileUrl(
      req.files
        .adminPolicyDocument[0]
    );
  }

        // ================= RESET STATUS AFTER REUPLOAD =================
        application.status =
          "pending";

        // clear reject reason after reupload
        application.rejectionReason =
          "";
      }

      // ================= SAVE =================
      await application.save();

      // ================= SEND NOTIFICATION TO DEALER =================
    // ================= SEND NOTIFICATION TO DEALER =================
  try {
    if (newStatus) {
      const dealer = await User.findById(
        application.user
      );

      if (
        dealer &&
        dealer.fcmToken
      ) {
        let title = "";
        let body = "";

        // Approved
        if (
          newStatus === "approved"
        ) {
          title =
            "Insurance Approved ✅";

          body = `Your application for vehicle ${application.carNo} has been approved`;
        }

        // Rejected
        else if (
          newStatus ===
          "rejected"
        ) {
          title =
            "Insurance Rejected ❌";

          body = `Your application for vehicle ${application.carNo} has been rejected`;

          if (
            application.rejectionReason
          ) {
            body += ` | Reason: ${application.rejectionReason}`;
          }
        }

        const message = {
          token: dealer.fcmToken,

          notification: {
            title,
            body,
          },

          android: {
            priority: "high",
            notification: {
              sound: "default",
              channelId:
                "insurance_channel",
            },
          },

          apns: {
            payload: {
              aps: {
                sound: "default",
              },
            },
          },

          data: {
            click_action:
              "FLUTTER_NOTIFICATION_CLICK",
            type:
              "application_status",
            applicationId:
              application._id.toString(),
            status:
              newStatus,
            carNo:
              application.carNo || "",
            title,
            body,
          },
        };

        const response =
          await admin
            .messaging()
            .send(message);

        console.log(
          "✅ Dealer notification sent:",
          response
        );
      } else {
        console.log(
          "❌ Dealer FCM token not found"
        );
      }
    }
  } catch (
    notificationError
  ) {
    console.log(
      "Notification Error:",
      notificationError
    );
  }

      // ================= GET UPDATED DATA =================
      const updatedApplication = await Application.findById(application._id)
        .populate("user", "fullName emailId mobileNumber")
        .populate("executive", "Name emailId mobileNumber")
        .populate("teamLeader", "Name Email mobileNo");

      return res.status(200).json({
        success: true,
        message:
          "Application updated successfully",
        data: updatedApplication,
      });
    } catch (error) {
      console.log(
        "UPDATE APPLICATION ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Server Error",
      });
    }
  };

  // exports.updateApplication = async (req, res) => {
  //   try {
  //     console.log("BODY:", req.body);
  //     console.log("FILES:", req.files);

  //     const application = await Application.findById(req.params.id);

  //     if (!application) {
  //       return res.status(404).json({
  //         success: false,
  //         message: "Application not found",
  //       });
  //     }

  //     // ================= STATUS UPDATE =================
  //     if (req.body.status !== undefined) {
  //       application.status = req.body.status;
  //     }

  //     // ================= MOBILE NUMBER UPDATE =================
  //     if (
  //       req.body.mobileNo !== undefined &&
  //       req.body.mobileNo.trim() !== ""
  //     ) {
  //       application.mobileNo = req.body.mobileNo;
  //     }

  //     // ================= EXECUTIVE ASSIGN =================
  //     if (req.body.executiveId) {
  //       application.executive = req.body.executiveId;

  //       await Executive.findByIdAndUpdate(
  //         req.body.executiveId,
  //         {
  //           $addToSet: {
  //             assignedApplications: application._id,
  //           },
  //         },
  //         { new: true }
  //       );
  //     }

  //     // ================= POLICY DOCUMENT =================
  //     if (
  //       req.files &&
  //       req.files.adminPolicyDocument &&
  //       req.files.adminPolicyDocument.length > 0
  //     ) {
  //       const file = req.files.adminPolicyDocument[0];

  //       application.adminPolicyDocument =
  //         `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
  //     }

  //     // ================= SAVE =================
  //     await application.save();

  //     // ================= UPDATED DATA =================
  //     const updatedApplication = await Application.findById(
  //       application._id
  //     )
  //       .populate("user", "fullName emailId mobileNumber")
  //       .populate("executive", "Name emailId mobileNumber");

  //     return res.status(200).json({
  //       success: true,
  //       message: "Application updated successfully",
  //       data: updatedApplication,
  //     });

  //   } catch (error) {
  //     console.log("UPDATE APPLICATION ERROR:", error);

  //     return res.status(500).json({
  //       success: false,
  //       message: error.message || "Server Error",
  //     });
  //   }
  // };

  // ================= DELETE =================
  exports.deleteApplication = async (req, res) => {
    try {
      const app = await Application.findByIdAndDelete(req.params.id);

      if (!app) {
        return res.status(404).json({ message: "Not found" });
      }

      res.json({ message: "Application deleted" });
    } catch (err) {
      res.status(500).json({ message: "Server Error" });
    }
  };

  // ================= GET APPLICATION PDF =================
  exports.getApplicationPDF =
    async (req, res) => {
      try {
        const { id } =
          req.params;

        const app =
          await Application.findById(
            id
          );

        if (!app) {
          return res
            .status(404)
            .json({
              success:
                false,
              message:
                "Application not found",
            });
        }

        // PDF generated or not
        if (
          !app.pdfFileName
        ) {
          return res
            .status(404)
            .json({
              success:
                false,
              message:
                "PDF not found",
            });
        }

        // PDF path
        const pdfPath =
          path.join(
            __dirname,
            "../uploads",
            app.pdfFileName
          );

        // File exists?
        if (
          !fs.existsSync(
            pdfPath
          )
        ) {
          return res
            .status(404)
            .json({
              success:
                false,
              message:
                "PDF file missing from server",
            });
        }

        // ================= DIRECT DOWNLOAD =================
        res.setHeader(
          "Content-Type",
          "application/pdf"
        );

        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${app.pdfFileName}"`
        );

        return res.sendFile(
          pdfPath
        );
      } catch (
        error
      ) {
        console.error(
          "Get PDF Error:",
          error
        );

        return res
          .status(500)
          .json({
            success:
              false,
            message:
              error.message ||
              "Server Error",
          });
      }
    };

  // ================= REGENERATE PDF =================
  exports.regenerateApplicationPDF = async (req, res) => {
    try {
      const { id } = req.params;

      const app = await Application.findById(id);

      if (!app) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      // Regenerate PDF
      const uploadsDir = path.join(__dirname, "../uploads");
      const pdfData = await generateApplicationPDF(app, uploadsDir);

      // Update application with PDF info
      app.pdfFileName = pdfData.fileName;
      app.pdfFileUrl = pdfData.fileUrl;
      await app.save();

      res.json({
        success: true,
        message: "PDF regenerated successfully",
        data: {
          pdfFileName: app.pdfFileName,
          pdfFileUrl: app.pdfFileUrl,
        },
      });
    } catch (error) {
      console.error("Regenerate PDF Error:", error);

      res.status(500).json({
        success: false,
        message: error.message || "Server Error",
      });
    }
  };
