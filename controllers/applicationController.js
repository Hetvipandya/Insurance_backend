const Application = require("../models/Application");
const cloudinary = require("cloudinary").v2;

// ================= CLOUDINARY CONFIG =================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ================= UPLOAD TO CLOUDINARY =================
const getCloudinaryResourceType = (originalname = "") => {
  const extension = originalname.split(".").pop()?.toLowerCase();
  return extension === "pdf" ? "raw" : "auto";
};

const uploadBufferToCloudinary = (buffer, originalname) => {
  return new Promise((resolve, reject) => {
    const resourceType = getCloudinaryResourceType(originalname);
    const extension = originalname.split(".").pop()?.toLowerCase();
    const publicId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "insurance-applications",
        resource_type: resourceType,
        public_id: resourceType === "raw" && extension ? `${publicId}.${extension}` : publicId,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
};

// ================= CREATE =================
exports.createApplication = async (req, res) => {
  try {
    const { carNo, tp, otherDetails } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.files?.adminPolicyDocument && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can upload policy document" });
    }

    const rcBookImages = req.files?.rcBookImages
      ? await Promise.all(req.files.rcBookImages.map(f => uploadBufferToCloudinary(f.buffer, f.originalname)))
      : [];

    const aadharCardImages = req.files?.aadharCardImages
      ? await Promise.all(req.files.aadharCardImages.map(f => uploadBufferToCloudinary(f.buffer, f.originalname)))
      : [];

    const panCardImages = req.files?.panCardImages
      ? await Promise.all(req.files.panCardImages.map(f => uploadBufferToCloudinary(f.buffer, f.originalname)))
      : [];

    const oldPolicyImages = req.files?.oldPolicyImages
      ? await Promise.all(req.files.oldPolicyImages.map(f => uploadBufferToCloudinary(f.buffer, f.originalname)))
      : [];

    const otherImages = req.files?.otherImages
      ? await Promise.all(req.files.otherImages.map(f => uploadBufferToCloudinary(f.buffer, f.originalname)))
      : [];

    const adminPolicyDocument = req.files?.adminPolicyDocument
      ? await uploadBufferToCloudinary(req.files.adminPolicyDocument[0].buffer, req.files.adminPolicyDocument[0].originalname)
      : null;

    if (!carNo || !tp) {
      return res.status(400).json({ message: "carNo & tp required" });
    }

    if (!rcBookImages.length || !aadharCardImages.length) {
      return res.status(400).json({
        message: "RC Book & Aadhar images required",
      });
    }

    const app = await Application.create({
      user: userId,
      carNo,
      tp,
      rcBookImages,
      aadharCardImages,
      panCardImages,
      oldPolicyImages,
      otherImages,
      otherDetails,
      adminPolicyDocument,
      status: "pending",
    });

    res.status(201).json({
      message: "Application created",
      data: {
        ...app.toObject(),
        status: app.status || "pending",
        adminPolicyDocument: app.adminPolicyDocument || null,
      },
    });

  } catch (err) {
    if (err.message.includes("Only JPG")) {
      return res.status(400).json({ message: err.message });
    }

    console.error(err);
    res.status(500).json({ message: "Server Error" });
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

// ================= GET SINGLE =================
exports.getApplicationById = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate("user", "fullName emailId mobileNumber");

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
    const { carNo, tp, otherDetails, status } = req.body;

    const app = await Application.findById(req.params.id);

    if (!app) {
      return res.status(404).json({ message: "Not found" });
    }

    if (carNo) app.carNo = carNo;
    if (tp) app.tp = tp;
    if (otherDetails) app.otherDetails = otherDetails;

    if (status) {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admin can update status" });
      }

      const allowedStatuses = ["pending", "approved", "rejected"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      app.status = status;
    }

    if (req.files?.adminPolicyDocument?.length) {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admin can upload policy document" });
      }

      app.adminPolicyDocument = await uploadBufferToCloudinary(
        req.files.adminPolicyDocument[0].buffer,
        req.files.adminPolicyDocument[0].originalname
      );
    }

    if (req.files?.rcBookImages?.length) {
      app.rcBookImages = await Promise.all(
        req.files.rcBookImages.map(f => uploadBufferToCloudinary(f.buffer, f.originalname))
      );
    }

    if (req.files?.aadharCardImages?.length) {
      app.aadharCardImages = await Promise.all(
        req.files.aadharCardImages.map(f => uploadBufferToCloudinary(f.buffer, f.originalname))
      );
    }

    if (req.files?.panCardImages?.length) {
      app.panCardImages = await Promise.all(
        req.files.panCardImages.map(f => uploadBufferToCloudinary(f.buffer, f.originalname))
      );
    }

    if (req.files?.oldPolicyImages?.length) {
      app.oldPolicyImages = await Promise.all(
        req.files.oldPolicyImages.map(f => uploadBufferToCloudinary(f.buffer, f.originalname))
      );
    }

    if (req.files?.otherImages?.length) {
      app.otherImages = await Promise.all(
        req.files.otherImages.map(f => uploadBufferToCloudinary(f.buffer, f.originalname))
      );
    }

    await app.save();

    const updatedApp = await Application.findById(app._id)
      .populate("user", "fullName emailId mobileNumber");

    res.json({
      message: "Application updated",
      data: updatedApp,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

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
