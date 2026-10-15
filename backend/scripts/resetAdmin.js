const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");

require("dotenv").config();

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD before running this command.");
  process.exit(1);
}

async function resetAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.findOne({ username: email });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (user) {
      const emailOwner = await User.findOne({ email });
      if (emailOwner && !emailOwner._id.equals(user._id)) {
        throw new Error("The email is already assigned to another account.");
      }

      user.email = email;
      user.password = passwordHash;
    } else {
      user = new User({
        username: email,
        name: "Admin",
        email,
        password: passwordHash
      });
    }

    user.isAdmin = true;
    await user.save();
    console.log("Admin account created or password reset successfully.");
  } catch (error) {
    console.error(`Admin account recovery failed (${error.name}).`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

resetAdmin();
