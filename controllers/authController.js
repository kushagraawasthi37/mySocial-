// controllers/authController.js
const User = require("../models/user");
const crypto = require("crypto");
const {
  sendEmail,
  emailVerificationContent,
  forgotPasswordContent,
} = require("../utils/mail");

// -------- Helpers --------
const generateToken = () => {
  const unHashedToken = crypto.randomBytes(20).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");
  return { unHashedToken, hashedToken };
};

const tokenExpiryTime = 10 * 60 * 1000; // 10 minutes

// -------- GET PAGES --------
exports.getHome = (req, res) => res.render("home");
exports.getLogin = (req, res) => res.render("login");
exports.getRegister = (req, res) => res.render("home");
exports.getForgotPassword = (req, res) => res.render("forgot-password");

// -------- REGISTER USER --------
exports.registerUser = async (req, res) => {
  const { email, username, password, name, age } = req.body;
  let tempUser;

  try {
    // Check if user exists
    if (await User.findOne({ $or: [{ email }, { username }] })) {
      req.flash("error_msg", "User already exists. Please login.");
      return res.redirect("/login");
    }

    const { unHashedToken, hashedToken } = generateToken();

    // Create temp user
    tempUser = new User({
      email,
      username,
      name,
      age,
      password,
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: Date.now() + tokenExpiryTime,
      isEmailVerified: false,
    });
    await tempUser.save();

    const verificationURL = `${process.env.FORGET_PASSWORD_REDIRECT_URL.replace(
      "/reset-password",
      ""
    )}/verify-email/${unHashedToken}`;

    // Send verification email
    await sendEmail({
      email,
      subject: "Verify Your Email - MySocial",
      html: emailVerificationContent(username, verificationURL),
    });

    req.flash(
      "success_msg",
      "Verification email sent! Please check your inbox."
    );
    res.redirect("/login");
  } catch (err) {
    console.error("Registration/Error:", err);

    // Delete temp user if created
    if (tempUser?._id) await User.findByIdAndDelete(tempUser._id);

    req.flash("error_msg", "Something went wrong. Please try again.");
    res.redirect("/register");
  }
};

// -------- EMAIL VERIFICATION --------
exports.verifyEmail = async (req, res) => {
  try {
    const token = req.params.token;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({ emailVerificationToken: hashedToken });
    if (!user) {
      req.flash("error_msg", "Invalid verification link.");
      return res.redirect("/login");
    }

    if (user.emailVerificationExpiry < Date.now()) {
      await User.findByIdAndDelete(user._id);
      req.flash(
        "error_msg",
        "Verification link expired. Please register again."
      );
      return res.redirect("/register");
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    req.flash("success_msg", "Email verified! You can now login.");
    res.redirect("/login");
  } catch (err) {
    console.error("Verify email error:", err);
    req.flash("error_msg", "Something went wrong. Please try again.");
    res.redirect("/login");
  }
};

// -------- LOGIN --------
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });

    if (!user)
      return req.flash("error_msg", "User not found."), res.redirect("/login");
    if (!user.isEmailVerified)
      return (
        req.flash("error_msg", "Verify your email first."),
        res.redirect("/login")
      );

    if (!(await user.isPasswordCorrect(password))) {
      return (
        req.flash("error_msg", "Incorrect password."), res.redirect("/login")
      );
    }

    res.cookie("token", user.generateAccessToken(), { httpOnly: true });
    req.flash("success_msg", "Login successful!");
    res.redirect("/profile");
  } catch (err) {
    console.error("Login error:", err);
    req.flash("error_msg", "Something went wrong. Please try again.");
    res.redirect("/login");
  }
};

// -------- LOGOUT --------
exports.logoutUser = (req, res) => {
  res.cookie("token", "", { maxAge: 1 });
  req.flash("success_msg", "Logged out successfully.");
  res.redirect("/login");
};

// -------- FORGOT PASSWORD --------
exports.sendForgotPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return (
        req.flash("error_msg", "Email not found."),
        res.redirect("/forgot-password")
      );

    const { unHashedToken, hashedToken } = generateToken();
    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = Date.now() + tokenExpiryTime;
    await user.save();

    const resetURL = `${process.env.FORGET_PASSWORD_REDIRECT_URL}/${unHashedToken}`;
    await sendEmail({
      email: user.email,
      subject: "Reset Your Password - MySocial",
      html: forgotPasswordContent(user.username, resetURL),
    });

    req.flash("success_msg", "Password reset email sent. Check your inbox!");
    res.redirect("/forgot-password");
  } catch (err) {
    console.error("Forgot Password Error:", err);
    req.flash("error_msg", "Something went wrong. Please try again.");
    res.redirect("/forgot-password");
  }
};

// -------- RESET PASSWORD PAGE --------
exports.getResetPasswordPage = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const user = await User.findOne({
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user)
      return (
        req.flash("error_msg", "Invalid or expired reset link."),
        res.redirect("/forgot-password")
      );
    res.render("reset-password", { token: req.params.token });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Something went wrong. Please try again.");
    res.redirect("/forgot-password");
  }
};

// -------- RESET PASSWORD ACTION --------
exports.resetForgotPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const user = await User.findOne({
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user)
      return (
        req.flash("error_msg", "Invalid or expired reset link."),
        res.redirect("/forgot-password")
      );

    user.password = req.body.newPassword;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save();

    req.flash("success_msg", "Password reset successful. You can now login!");
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Something went wrong. Please try again.");
    res.redirect("/forgot-password");
  }
};
