const multer = require("multer");
const { uploadToCloudinary } = require("../utils/cloudinary");

const memoryStorage = multer.memoryStorage(); // Store files in memory

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"), false);
  }
};

const upload = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

exports.uploadMiddleware = upload.single("profileImage");
