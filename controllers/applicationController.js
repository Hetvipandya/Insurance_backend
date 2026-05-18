const Application = require("../models/Application");
const Executive = require("../models/Executive");

// ================= CREATE =================
exports.createApplication = async (req, res) => {
  try {
    const { carNo, tp, otherDetails, mobileNo } = req.body;

    const userId = req.user?.id;

    if (!userId) { 
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // ================= ADMIN CHECK =================
    if (
      req.files?.adminPolicyDocument &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Only admin can upload policy document",
      });
    }

    // ================= GET FILE PATHS =================
    const rcBookImages = req.files?.rcBookImages
      ? req.files.rcBookImages.map(
          (file) => `/uploads/${file.filename}`
        )
      : [];

    const aadharCardImages = req.files?.aadharCardImages
      ? req.files.aadharCardImages.map(
          (file) => `/uploads/${file.filename}`
        )
      : [];

    const panCardImages = req.files?.panCardImages
      ? req.files.panCardImages.map(
          (file) => `/uploads/${file.filename}`
        )
      : [];

    const oldPolicyImages = req.files?.oldPolicyImages
      ? req.files.oldPolicyImages.map(
          (file) => `/uploads/${file.filename}`
        )
      : [];

    const otherImages = req.files?.otherImages
      ? req.files.otherImages.map(
          (file) => `/uploads/${file.filename}`
        )
      : [];

    const adminPolicyDocument = req.files?.adminPolicyDocument
      ? `/uploads/${req.files.adminPolicyDocument[0].filename}`
      : null;

    // ================= VALIDATION =================
    if (!carNo || !tp) {
      return res.status(400).json({
        message: "carNo & tp required",
      });
    }

    if (
      !rcBookImages.length ||
      !aadharCardImages.length
    ) {
      return res.status(400).json({
        message: "RC Book & Aadhar images required",
      });
    }

    // ================= CREATE APPLICATION =================
    const app = await Application.create({
      user: userId,
      carNo,
      tp,
      mobileNo,
      rcBookImages,
      aadharCardImages,
      panCardImages,
      oldPolicyImages,
      otherImages,

      otherDetails,

      adminPolicyDocument,

      status: "pending",
    });

    // ================= RESPONSE =================
    res.status(201).json({
      message: "Application created",

      data: {
        ...app.toObject(),

        status: app.status || "pending",

        adminPolicyDocument:
          app.adminPolicyDocument || null,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// ================= GET ALL (User wise) =================
// ================= GET ALL (User wise + Admin) =================

exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let apps;

    // ✅ Admin → ALL applications
    if (userRole === "admin") {
      apps = await Application.find()
  .populate("user", "fullName emailId mobileNumber")
  .populate("executive", "Name emailId mobileNumber")
  .sort({ createdAt: -1 });
    } 
    // ✅ Normal user → Only own applications
    else {
      apps = await Application.find({ user: userId })
        .populate("user", "fullName emailId mobileNumber")
        .sort({ createdAt: -1 });
    }

    res.json(apps);

  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ message: "Server Error" });
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
    const { executiveId } = req.body;

    // ================= UPDATE APPLICATION =================
    const updatedApplication =
      await Application.findByIdAndUpdate(
        id,
        {
          executive: executiveId,
        },
        { new: true }
      )
  .populate("user", "fullName emailId mobileNumber")
  .populate("executive", "Name emailId mobileNumber");

    if (!updatedApplication) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // ================= UPDATE EXECUTIVE =================
    await Executive.findByIdAndUpdate(
      executiveId,
      {
        $addToSet: {
          assignedApplications: id,
        },
      },
      { new: true }
    );

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


// ================= GET SINGLE =================
exports.getApplicationById = async (req, res) => {
  try {
const app = await Application.findById(req.params.id)
  .populate("user", "fullName emailId mobileNumber")
  .populate("executive", "Name emailId mobileNumber");

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

    // SAFE BODY
    req.body = req.body || {};

    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    // ================= FIND APPLICATION =================
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // ================= STATUS UPDATE =================
    if (
      req.body.status !== undefined &&
      req.body.status.toString().trim() !== ""
    ) {
      application.status = req.body.status;
    }

    // ================= MOBILE NUMBER UPDATE =================
    if (
      req.body.mobileNo !== undefined &&
      req.body.mobileNo.toString().trim() !== ""
    ) {
      application.mobileNo = req.body.mobileNo.toString();
    }

    // ================= EXECUTIVE ASSIGN =================
    if (
      req.body.executiveId !== undefined &&
      req.body.executiveId.toString().trim() !== ""
    ) {

      application.executive = req.body.executiveId;

      await Executive.findByIdAndUpdate(
        req.body.executiveId,
        {
          $addToSet: {
            assignedApplications: application._id,
          },
        },
        { new: true }
      );
    }

    // ================= RC BOOK IMAGES =================
    if (
      req.files &&
      req.files.rcBookImages &&
      req.files.rcBookImages.length > 0
    ) {

      const rcImages = req.files.rcBookImages.map(
        (file) => `/uploads/insurance/${file.filename}`
      );

      application.rcBookImages = [
        ...(application.rcBookImages || []),
        ...rcImages,
      ];
    }

    // ================= AADHAR CARD IMAGES =================
    if (
      req.files &&
      req.files.aadharCardImages &&
      req.files.aadharCardImages.length > 0
    ) {

      const aadharImages = req.files.aadharCardImages.map(
        (file) => `/uploads/insurance/${file.filename}`
      );

      application.aadharCardImages = [
        ...(application.aadharCardImages || []),
        ...aadharImages,
      ];
    }

    // ================= PAN CARD IMAGES =================
    if (
      req.files &&
      req.files.panCardImages &&
      req.files.panCardImages.length > 0
    ) {

      const panImages = req.files.panCardImages.map(
        (file) => `/uploads/insurance/${file.filename}`
      );

      application.panCardImages = [
        ...(application.panCardImages || []),
        ...panImages,
      ];
    }

    // ================= OLD POLICY IMAGES =================
    if (
      req.files &&
      req.files.oldPolicyImages &&
      req.files.oldPolicyImages.length > 0
    ) {

      const oldPolicyImages = req.files.oldPolicyImages.map(
        (file) => `/uploads/insurance/${file.filename}`
      );

      application.oldPolicyImages = [
        ...(application.oldPolicyImages || []),
        ...oldPolicyImages,
      ];
    }

    // ================= OTHER IMAGES =================
    if (
      req.files &&
      req.files.otherImages &&
      req.files.otherImages.length > 0
    ) {

      const otherImages = req.files.otherImages.map(
        (file) => `/uploads/insurance/${file.filename}`
      );

      application.otherImages = [
        ...(application.otherImages || []),
        ...otherImages,
      ];
    }

    // ================= POLICY DOCUMENT =================
    if (
      req.files &&
      req.files.adminPolicyDocument &&
      req.files.adminPolicyDocument.length > 0
    ) {

      const file = req.files.adminPolicyDocument[0];

      application.adminPolicyDocument =
        `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
    }

    // ================= SAVE APPLICATION =================
    await application.save();

    // ================= GET UPDATED APPLICATION =================
    const updatedApplication = await Application.findById(
      application._id
    )
      .populate("user", "fullName emailId mobileNumber")
      .populate("executive", "Name emailId mobileNumber");

    // ================= RESPONSE =================
    return res.status(200).json({
      success: true,
      message: "Application updated successfully",
      data: updatedApplication,
    });

  } catch (error) {

    console.log("UPDATE APPLICATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
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
