const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const session = require("express-session");
const flash = require("connect-flash");

dotenv.config();

// Connect to MongoDB
const connectDB = require("./db/db.js");
connectDB();

// Import Routes
const authRoutes = require("./routes/authRoutes.js");
const postRoutes = require("./routes/postRoutes.js");
const userRoutes = require("./routes/userRoutes.js");

const app = express();

// View engine
app.set("view engine", "ejs");

// Core middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser()); //→ adds the middleware to your Express app.
// After this, every request will have req.cookies populated.

// Session middleware (must come before flash)->A session is a way to store data about a user on the server across multiple requests.
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mySecretKey", // put SESSION_SECRET in .env  // used to sign the session ID cookie
    resave: false, // avoid resaving unchanged sessions
    saveUninitialized: false, // do not save new sessions if they are empty
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 hour session
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // secure cookies only in prod

      // secure: true → cookie is sent only over HTTPS (encrypted).
      // secure: false → cookie can be sent over HTTP or HTTPS.
    },
  })
  // Unlike cookies, sessions store data on the server, not on the client. The client only gets a session ID.
  //Session storage is in Server (memory/DB)
);

// Flash middleware
app.use(flash());
// Flash messages are temporary messages stored in the session.
//They are usually used to show success, error, or info messages after a redirect.

// Global variables middleware (available in all EJS views)

app.use((req, res, next) => {
  // req.flash("key"): retrieves flash messages for the given "key" and removes them from the session. You get arrays of messages, because you can push multiple messages.
  const successArr = req.flash("success_msg");
  const errorArr = req.flash("error_msg");
  const messageArr = req.flash("message");

  //res.locals: Make message available in EJS views
  res.locals.success_msg = successArr.length > 0 ? successArr[0] : null;
  res.locals.error_msg = errorArr.length > 0 ? errorArr[0] : null;
  res.locals.message = messageArr.length > 0 ? messageArr[0] : null;

  next();
});

// 4️⃣ Order matters
// Express checks routers top-down.

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
}, 60 * 60 * 1000); // every 1 hour

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
