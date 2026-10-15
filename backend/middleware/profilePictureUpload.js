const multer = require("multer");

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      return callback(new Error("Profile picture must be a JPG, PNG, WEBP, or GIF image."));
    }
    callback(null, true);
  }
}).single("profilePicture");

const profilePictureUpload = (req, res, next) => {
  upload(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "Profile picture must be 5 MB or smaller."
      });
    }

    return res.status(400).json({
      message: error.message || "Invalid profile picture upload."
    });
  });
};

module.exports = { profilePictureUpload };
