const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;

exports.uploadToCloudinary = async (file, folder = "doctor_profiles") => {
  try {
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const tempFilePath = path.join(tempDir, file.originalname);
    fs.writeFileSync(tempFilePath, file.buffer);

    const result = await cloudinary.uploader.upload(tempFilePath, {
      folder,
      width: 500,
      height: 500,
      crop: "fill",
      resource_type: "image",
    });

    fs.unlinkSync(tempFilePath); // cleanup

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
};
