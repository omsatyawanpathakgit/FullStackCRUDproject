const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const multer = require("multer");

const uploadDirectory = path.resolve(__dirname, "..", "uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedExtensions = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg"
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, uploadDirectory);
    },
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      return callback(new Error("Assignment must be PDF, DOC, DOCX, TXT, PNG, JPG, or JPEG."));
    }
    callback(null, true);
  }
}).single("Assignment");

const assignmentUpload = (req, res, next) => {
  upload(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "Assignment file must be 10 MB or smaller."
      });
    }

    return res.status(400).json({
      message: error.message || "Invalid assignment upload."
    });
  });
};

module.exports = {
  assignmentUpload,
  uploadDirectory
};
