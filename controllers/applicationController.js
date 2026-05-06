const Application = require("../models/Application");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// ================= CLOUDINARY CONFIG =================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ================= UPLOAD TO CLOUDINARY =================
const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "insurance-applications",
      resource_type: "auto",
    });
    
    // Delete local file after successful upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
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

    // ✅ Upload to Cloudinary instead of local path
    const rcBookImages = req.files?.rcBookImages
      ? await Promise.all(req.files.rcBookImages.map(f => uploadToCloudinary(f.path)))
      : [];

    const aadharCardImages = req.files?.aadharCardImages
      ? await Promise.all(req.files.aadharCardImages.map(f => uploadToCloudinary(f.path)))
      : [];

    const panCardImages = req.files?.panCardImages
      ? await Promise.all(req.files.panCardImages.map(f => uploadToCloudinary(f.path)))
      : [];

    const oldPolicyImages = req.files?.oldPolicyImages
      ? await Promise.all(req.files.oldPolicyImages.map(f => uploadToCloudinary(f.path)))
      : [];

    const otherImages = req.files?.otherImages
      ? await Promise.all(req.files.otherImages.map(f => uploadToCloudinary(f.path)))
      : [];

    const adminPolicyDocument = req.files?.adminPolicyDocument
      ? await uploadToCloudinary(req.files.adminPolicyDocument[0].path)
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
    });

    res.status(201).json({
      message: "Application created",
      data: app,
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
      apps = await Application.find().sort({ createdAt: -1 });
    } 
    // ✅ Normal user → Only own applications
    else {
      apps = await Application.find({ user: userId }).sort({ createdAt: -1 });
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
    const app = await Application.findById(req.params.id);

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

    if (req.files["adminPolicyDocument"]) {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admin can upload policy document" });
      }

      app.adminPolicyDocument = await uploadToCloudinary(
        req.files["adminPolicyDocument"][0].path
      );
    }

    // 🔹 Replace images with Cloudinary upload
    if (req.files["rcBookImages"]) {
      app.rcBookImages = await Promise.all(
        req.files["rcBookImages"].map(f => uploadToCloudinary(f.path))
      );
    }

    if (req.files["aadharCardImages"]) {
      app.aadharCardImages = await Promise.all(
        req.files["aadharCardImages"].map(f => uploadToCloudinary(f.path))
      );
    }

    if (req.files["panCardImages"]) {
      app.panCardImages = await Promise.all(
        req.files["panCardImages"].map(f => uploadToCloudinary(f.path))
      );
    }

    if (req.files["oldPolicyImages"]) {
      app.oldPolicyImages = await Promise.all(
        req.files["oldPolicyImages"].map(f => uploadToCloudinary(f.path))
      );
    }

    if (req.files["otherImages"]) {
      app.otherImages = await Promise.all(
        req.files["otherImages"].map(f => uploadToCloudinary(f.path))
      );
    }

    await app.save();

    res.json({
      message: "Application updated",
      data: app,
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