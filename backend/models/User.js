const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },

    isAdmin: {
      type: Boolean,
      default: false
    },

    PhoneNumber: {
      type: String,
      trim: true
    },

    Assignment: {
      originalName: {
        type: String,
        trim: true
      },
      filename: {
        type: String,
        trim: true
      },
      mimetype: {
        type: String,
        trim: true
      },
      size: {
        type: Number
      }
    },

    password: {
      type: String,
      required: true
    },

    profilePicture: {
      type: String,
      trim: true
    },
    profilePicturePublicId: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);