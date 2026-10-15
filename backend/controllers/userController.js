const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs/promises");
const path = require("path");
const { uploadDirectory } = require("../middleware/assignmentUpload");
const cloudinary = require("../cloudinary");

const getAssignmentMetadata = (file) => ({
  originalName: path.basename(file.originalname.replace(/\\/g, "/")),
  filename: file.filename,
  mimetype: file.mimetype,
  size: file.size
});

const removeAssignmentFile = async (assignment) => {
  if (!assignment?.filename) {
    return;
  }

  try {
    await fs.unlink(path.join(uploadDirectory, path.basename(assignment.filename)));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Failed to remove assignment file:", error);
    }
  }
};

const uploadProfilePictureToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "profile_pictures",
        resource_type: "image"
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

const uploadProfilePicture = async (req, res) => {
  let uploadedAsset;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Choose a profile picture to upload."
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    uploadedAsset = await uploadProfilePictureToCloudinary(req.file.buffer);
    const previousPublicId = user.profilePicturePublicId;
    user.profilePicture = uploadedAsset.secure_url;
    user.profilePicturePublicId = uploadedAsset.public_id;
    await user.save();

    if (previousPublicId) {
      try {
        const deletion = await cloudinary.uploader.destroy(previousPublicId, {
          resource_type: "image"
        });
        if (deletion.result !== "ok" && deletion.result !== "not found") {
          console.error("Failed to remove previous profile picture:", deletion);
        }
      } catch (error) {
        console.error("Failed to remove previous profile picture:", error);
      }
    }

    return res.status(200).json({
      message: "Profile picture uploaded successfully",
      profilePicture: user.profilePicture
    });
  } catch (error) {
    if (uploadedAsset?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadedAsset.public_id, {
          resource_type: "image"
        });
      } catch (cleanupError) {
        console.error("Failed to clean up uploaded profile picture:", cleanupError);
      }
    }

    return res.status(500).json({
      message: error.message
    });
  }
};

const sendUserMessage = async (req, res) => {
  const message = typeof req.body.message === "string"
    ? req.body.message.trim()
    : "";

  if (!message) {
    return res.status(400).json({
      message: "Enter a message to send."
    });
  }

  if (message.length > 5000) {
    return res.status(400).json({
      message: "Messages must be 5000 characters or fewer."
    });
  }

  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName = process.env.BREVO_SENDER_NAME?.trim();

  if (!apiKey || !senderEmail) {
    return res.status(503).json({
      message: "Email sending is not configured. Set the Brevo API key and sender email."
    });
  }

  try {
    const user = await User.findById(req.params.id).select("name email");

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        sender: {
          email: senderEmail,
          ...(senderName ? { name: senderName } : {})
        },
        to: [{
          email: user.email,
          ...(user.name ? { name: user.name } : {})
        }],
        subject: "A message from User Management",
        textContent: message
      })
    });

    if (!response.ok) {
      const responseBody = await response.json().catch(() => ({}));
      console.error("Brevo email request failed:", response.status, responseBody);
      return res.status(502).json({
        message: "Brevo could not send the email. Check the Brevo sender and API configuration."
      });
    }

    return res.status(200).json({
      message: `Message sent to ${user.email}.`
    });
  } catch (error) {
    console.error("Failed to send user email:", error);
    return res.status(500).json({
      message: "Failed to send the email."
    });
  }
};

const insertUser = async (req, res) => {
  try {
    const { username, name, email, password, PhoneNumber } = req.body;

    if (!username || !name || !email || !PhoneNumber || !password) {
      await removeAssignmentFile(req.file);
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      await removeAssignmentFile(req.file);
      return res.status(400).json({
        message: "Username or email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      name,
      email,
      PhoneNumber,
      Assignment: req.file ? getAssignmentMetadata(req.file) : undefined,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({
      message: "User created successfully"
    });
  } catch (error) {
    await removeAssignmentFile(req.file);
    res.status(500).json({
      message: error.message
    });
  }
};



const getUsers = async (req, res) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminAccounts = [
      { isAdmin: true },
      { username: /^admin$/i },
      { name: /^admin$/i }
    ];

    if (adminEmail) {
      adminAccounts.push({ email: adminEmail });
    }

    const filter = { $nor: adminAccounts };
    const users = await User.find(filter).select("-password -__v -profilePicturePublicId");

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const uploadAssignment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Choose an assignment file to upload."
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      await removeAssignmentFile(req.file);
      return res.status(404).json({
        message: "User not found"
      });
    }

    const previousAssignment = user.Assignment;
    user.Assignment = getAssignmentMetadata(req.file);
    await user.save();
    await removeAssignmentFile(previousAssignment);

    return res.status(200).json({
      message: "Assignment uploaded successfully",
      Assignment: user.Assignment
    });
  } catch (error) {
    await removeAssignmentFile(req.file);
    return res.status(500).json({
      message: error.message
    });
  }
};

const downloadAssignment = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("Assignment");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (!user.Assignment?.filename) {
      return res.status(404).json({
        message: "No assignment found for this user"
      });
    }

    const filename = path.basename(user.Assignment.filename);
    const filePath = path.join(uploadDirectory, filename);

    return res.download(filePath, user.Assignment.originalName, (error) => {
      if (error && !res.headersSent) {
        res.status(error.code === "ENOENT" ? 404 : 500).json({
          message: error.code === "ENOENT"
            ? "Assignment file not found"
            : "Failed to download assignment"
        });
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};



const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, name, email, password, PhoneNumber } = req.body;

    if (!username || !name || !email || !PhoneNumber) {
      await removeAssignmentFile(req.file);
      return res.status(400).json({
        message: "Username, name, email, and phone number are required"
      });
    }

    const user = await User.findById(id);

    if (!user) {
      await removeAssignmentFile(req.file);
      return res.status(404).json({
        message: "User not found"
      });
    }

    const previousAssignment = user.Assignment;
    user.username = username;
    user.name = name;
    user.email = email;
    user.PhoneNumber = PhoneNumber;

    if (req.file) {
      user.Assignment = getAssignmentMetadata(req.file);
    }

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    if (req.file) {
      await removeAssignmentFile(previousAssignment);
    }

    res.status(200).json({
      message: "User updated successfully"
    });
  } catch (error) {
    await removeAssignmentFile(req.file);
    res.status(500).json({
      message: error.message
    });
  }
};



const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    await User.findByIdAndDelete(id);
    await removeAssignmentFile(user.Assignment);

    if (user.profilePicturePublicId) {
      try {
        const deletion = await cloudinary.uploader.destroy(user.profilePicturePublicId, {
          resource_type: "image"
        });
        if (deletion.result !== "ok" && deletion.result !== "not found") {
          console.error("Failed to remove profile picture:", deletion);
        }
      } catch (error) {
        console.error("Failed to remove profile picture:", error);
      }
    }

    res.status(200).json({
      message: "User deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};



const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    res.status(200).json({
      message: "Login successful",
      token
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


module.exports = {
  insertUser,
  getUsers,
  updateUser,
  deleteUser,
  loginUser,
  uploadAssignment,
  downloadAssignment,
  uploadProfilePicture,
  sendUserMessage
};