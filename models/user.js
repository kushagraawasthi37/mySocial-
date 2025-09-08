const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    
    // Basic info
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    name: { type: String, trim: true },
    age: { type: Number },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },

    // Verification & tokens
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpiry: { type: Date },
    forgotPasswordToken: { type: String },
    forgotPasswordExpiry: { type: Date },
    refreshToken: { type: String },

    // Relations
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },

      // Without ref → You can store IDs, but populate() won’t work.
      // With ref → You can easily fetch full related documents.
    ],
  },
  { timestamps: true }
  // timestamps	:Automatically adds createdAt & updatedAt fields and updates them
);

// ---------------- Password Hash ----------------
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ---------------- JWT ----------------
userSchema.methods.generateAccessToken = function () {
  const token = jwt.sign(
    { id: this._id }, // ⚡ must be 'id'
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY } // token valid for 30minutes
  );
  return token;
};

// ---------------- Refresh Token ----------------
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },

    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

// ---------------- Temporary Token ----------------
userSchema.methods.generateTemporaryToken = function () {
  const unHashedToken = crypto
    .randomBytes(20) //creates 20 random bytes
    .toString("hex"); //converts the bytes into a hexadecimal string.

  const hashedToken = crypto
    .createHash("sha256") //creates a SHA-256 hash object.
    .update(unHashedToken) //adds the token to be hashed.
    .digest("hex"); //produces the final hashed token as a string.

  const tokenExpiry = Date.now() + 3 * 60 * 1000; // 3 minutes expiry:Invalid after expiry time
  return { unHashedToken, hashedToken, tokenExpiry };
};

// ---------------- Password Verification ----------------
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
