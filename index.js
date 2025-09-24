// app.js
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const session = require("express-session");
const flash = require("connect-flash");
const cors = require("cors");

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = require("./db/db.js");
connectDB();

// Import models
const User = require("./models/user");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// View engine
app.set("view engine", "ejs");

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // frontend URL
    credentials: true, // allow cookies to be sent
  })
);

// Core middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mySecretKey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 hour
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// Flash middleware
app.use(flash());

// Global variables middleware for EJS
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg")[0] || null;
  res.locals.error_msg = req.flash("error_msg")[0] || null;
  res.locals.message = req.flash("message")[0] || null;
  next();
});

// Routes
app.use("/", authRoutes);
app.use("/", postRoutes);
app.use("/", userRoutes);

// Cleanup expired temp users every 1 hour
setInterval(async () => {
  try {
    const result = await User.deleteMany({
      isEmailVerified: false,
      emailVerificationExpiry: { $lt: Date.now() },
    });
    if (result.deletedCount > 0)
      console.log(`🗑️ Cleaned up ${result.deletedCount} expired temp users`);
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}, 60 * 60 * 1000);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
