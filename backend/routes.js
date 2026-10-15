const express = require("express");

const {
  insertUser,
  getUsers,
  updateUser,
  deleteUser,
  loginUser,
  uploadAssignment,
  downloadAssignment,
  uploadProfilePicture,
  sendUserMessage
} = require("./controllers/userController");

const authMiddleware = require("./middleware/authMiddleware");
const { assignmentUpload } = require("./middleware/assignmentUpload");
const { profilePictureUpload } = require("./middleware/profilePictureUpload");

const router = express.Router();


// LOGIN
router.post("/users/login", loginUser);


// GET ALL USERS
router.get("/users", authMiddleware, getUsers);

// SEND A MESSAGE TO A USER BY EMAIL
router.post("/users/:id/message", authMiddleware, sendUserMessage);

// DOWNLOAD USER ASSIGNMENT
router.get("/users/:id/assignment", authMiddleware, downloadAssignment);

// UPLOAD OR REPLACE USER ASSIGNMENT
router.post(
  "/users/:id/assignment",
  authMiddleware,
  assignmentUpload,
  uploadAssignment
);

// UPLOAD OR REPLACE USER PROFILE PICTURE
router.post(
  "/users/:id/profile-picture",
  authMiddleware,
  profilePictureUpload,
  uploadProfilePicture
);


// INSERT USER
router.post("/users", authMiddleware, assignmentUpload, insertUser);


// UPDATE USER
router.put("/users/:id", authMiddleware, assignmentUpload, updateUser);


// DELETE USER
router.delete("/users/:id", authMiddleware, deleteUser);


module.exports = router;