// ============================================================
// backend/src/models/User.js  — PRODUCTION UPGRADED
// FIX 1: Single mongoose import (not multiple instances)
// FIX 2: Added required validators + email format check
// FIX 3: Added isActive flag for soft-delete
// FIX 4: Added timestamps
// FIX 5: passwordHash not sent in queries by default (select: false)
// ============================================================

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: ["admin", "controller", "engineer", "viewer"],
      default: "controller",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt automatically
  }
);

// Instance method to verify password
userSchema.methods.verifyPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model("User", userSchema);
