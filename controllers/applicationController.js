const Application = require("../models/Application");

// ================= CREATE =================
exports.createApplication = async (req, res) => {
  try {
    const { carNo, tp, otherDetails } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ Safe file extraction (no crash)
    const rcBookImages = req.files?.rcBookImages?.map(f => f.path) || [];
    const aadharCardImages = req.files?.aadharCardImages?.map(f => f.path) || [];
    const panCardImages = req.files?.panCardImages?.map(f => f.path) || [];
    const oldPolicyImages = req.files?.oldPolicyImages?.map(f => f.path) || [];
    const otherImages = req.files?.otherImages?.map(f => f.path) || [];

    // validations
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
    });

    res.status(201).json({
      message: "Application created",
      data: app,
    });

  } catch (err) {
    // ✅ handle invalid file type
    if (err.message.includes("Only JPG")) {
      return res.status(400).json({ message: err.message });
    }

    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// ================= GET ALL (User wise) =================
// applicationController.js માં આ મુજબ ફેરફાર કરો
exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role; // જો તમારા ટોકનમાં રોલ હોય તો

    let query = { user: userId };
    
    // જો યુઝર Admin હોય, તો બધી એપ્લિકેશન બતાવો (ખાલી ક્વેરી)
    if (userRole === "admin") {
      query = {};
    }

    const apps = await Application.find(query).sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
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
    const { carNo, tp, otherDetails } = req.body;

    const app = await Application.findById(req.params.id);

    if (!app) {
      return res.status(404).json({ message: "Not found" });
    }

    // 🔹 Update text fields
    if (carNo) app.carNo = carNo;
    if (tp) app.tp = tp;
    if (otherDetails) app.otherDetails = otherDetails;

    // 🔹 Replace images if new uploaded
    if (req.files["rcBookImages"]) {
      app.rcBookImages = req.files["rcBookImages"].map(f => f.path);
    }

    if (req.files["aadharCardImages"]) {
      app.aadharCardImages = req.files["aadharCardImages"].map(f => f.path);
    }

    if (req.files["panCardImages"]) {
      app.panCardImages = req.files["panCardImages"].map(f => f.path);
    }

    if (req.files["oldPolicyImages"]) {
      app.oldPolicyImages = req.files["oldPolicyImages"].map(f => f.path);
    }

    if (req.files["otherImages"]) {
      app.otherImages = req.files["otherImages"].map(f => f.path);
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