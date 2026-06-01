// const multer = require("multer");
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const cloudinary = require("cloudinary").v2;

// // ================= CLOUDINARY CONFIG =================
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // ================= STORAGE =================
// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: async (req, file) => { 
//     return {
//       folder: "insurance",
//       resource_type: "auto",
//       public_id:
//         Date.now() + "-" + file.originalname.split(".")[0],
//     };
//   },
// });

// // ================= FILE FILTER =================
// const fileFilter = (req, file, cb) => {
//   cb(null, true);
// };

// // ================= MULTER CONFIG =================
// const upload = multer({
//   storage,
//   fileFilter,
// });

// module.exports = upload;

const multer = require("multer");
const path = require("path");
const {
  CloudinaryStorage,
} = require(
  "multer-storage-cloudinary"
);
const cloudinary =
  require("cloudinary").v2;

// ================= CLOUDINARY CONFIG =================
cloudinary.config({
  cloud_name:
    process.env
      .CLOUDINARY_CLOUD_NAME,
  api_key:
    process.env
      .CLOUDINARY_API_KEY,
  api_secret:
    process.env
      .CLOUDINARY_API_SECRET,
});

// ================= STORAGE =================
const storage =
  new CloudinaryStorage({
    cloudinary,

    params: async (
      req,
      file
    ) => {
      const isPdf =
        file.mimetype ===
          "application/pdf" ||
        file.originalname
          .toLowerCase()
          .endsWith(".pdf");

      const fileName =
        path
          .parse(
            file.originalname
          )
          .name.replace(
            /\s+/g,
            "_"
          );

      return {
        folder:
          "insurance",

        // PDFs: raw resource type, Images: image resource type
        resource_type:
          isPdf
            ? "raw"
            : "image",

        public_id: `${Date.now()}-${fileName}`,

        use_filename: true,
        unique_filename: false,
      };
    },
  });

// ================= FILE FILTER =================
const fileFilter = (
  req,
  file,
  cb
) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (
    allowedTypes.includes(
      file.mimetype
    )
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only image and PDF files allowed"
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,

});

module.exports =
  upload;