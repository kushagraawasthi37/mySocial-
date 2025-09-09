const User = require("../models/user");
const {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
} = require("../utils/mail");
const crypto = require("crypto");

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
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      req.flash("error_msg", "User already exists. Please login.");
      return res.redirect("/login");
    }

    // Generate verification token
    const unHashedToken = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(unHashedToken)
      .digest("hex");
    const tokenExpiry = Date.now() + 3 * 60 * 1000; // 3 minutes

    // Create a temp user
    tempUser = new User({
      email,
      username,
      name,
      age,
      password,
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: tokenExpiry,
      isEmailVerified: false,
    });
    await tempUser.save();

    // Prepare verification email
    const verificationURL = `${req.protocol}://${req.get(
      "host"
    )}/verify-email/${unHashedToken}`;
    const emailContent = emailVerificationMailgenContent(
      username,
      verificationURL
    );

    // Send verification email
    await sendEmail({
      email,
      subject: "Verify Your Email",
      html: `<p>${emailContent.body.intro}</p>
             <p>${emailContent.body.action.instructions}</p>
             <a href="${verificationURL}" style="color:#fff; background:#22BC66; padding:10px 20px; text-decoration:none;">Verify Email</a>`,
    });

    req.flash(
      "success_msg",
      "Verification email sent! Please check your inbox."
    );
    return res.redirect("/login");
  } catch (err) {
    console.error("Registration/Error sending email:", err);

    // Delete temp user if exists
    if (tempUser && tempUser._id) {
      try {
        await User.findByIdAndDelete(tempUser._id);
        console.log("🗑️ Temp user deleted due to failure.");
      } catch (delErr) {
        console.error("Failed to delete temp user:", delErr);
      }
    }

    req.flash("error_msg", "Something went wrong. Please try again.");
    return res.redirect("/register");
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

    // Check if token has expired
    if (user.emailVerificationExpiry < Date.now()) {
      // Delete temp user
      await User.findByIdAndDelete(user._id);
      console.log("🗑️ Expired temp user deleted.");

      req.flash(
        "error_msg",
        "Verification link has expired. Please register again."
      );
      return res.redirect("/register");
    }

    // Verify the user
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;

    await user.save();

    req.flash("success_msg", "Email verified successfully. You can now login.");
    return res.redirect("/login");
  } catch (err) {
    console.error("Verify email error:", err);
    req.flash("error_msg", "Something went wrong. Please try again.");
    return res.redirect("/login");
  }
};

// -------- LOGIN --------
exports.loginUser = async (req, res) => {
  try {
    // Debug: login
    console.log("⚡ Login route hit");

    const { email, password } = req.body;

    // Debug: log email before processing
    // console.log("Email received from form:", `"${email}"`);

    const emailInput = email?.toLowerCase().trim();
    // console.log("Normalized email:", `"${emailInput}"`);

    // Find user in DB
    const user = await User.findOne({ email: emailInput });
    // console.log("Found user:", user);

    if (!user) {
      req.flash("error_msg", "User not found.");
      return res.redirect("/login");
    }

    if (!user.isEmailVerified) {
      req.flash("error_msg", "Please verify your email first.");
      return res.redirect("/login");
    }

    const isMatch = await user.isPasswordCorrect(password);
    // console.log("Password match:", isMatch);

    if (!isMatch) {
      req.flash("error_msg", "Incorrect password.");
      return res.redirect("/login");
    }

    //Sab sahi hai login kr skta hai aab cookie set krdo

    const accessToken = user.generateAccessToken();
    res.cookie("token", accessToken, { httpOnly: true });

    // httpOnly:true
    //Prevents JavaScript in the browser from accessing the cookie.
    //Improves security by protecting the cookie from XSS (cross-site scripting) attacks.
    //Browser can still send the cookie automatically on every request to your server.

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
  res.cookie("token", "", { maxAge: 1 }); // maxAge: 1  → Sets the cookie to expire in 1 millisecond.
  req.flash("success_msg", "You have logged out successfully.");
  res.redirect("/login");
};

// -------- FORGOT PASSWORD --------
exports.sendForgotPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      req.flash("error_msg", "Email not found.");
      return res.redirect("/forgot-password");
    }

    // Generate token
    const unHashedToken = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(unHashedToken)
      .digest("hex");
    const tokenExpiry = Date.now() + 3 * 60 * 1000; // 3 mins tak valid rahega

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;
    await user.save();

    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/reset-password/${unHashedToken}`;
    const emailContent = forgotPasswordMailgenContent(user.username, resetURL);

    await sendEmail({
      email: user.email,
      subject: "Reset Your Password",
      html: `<p>${emailContent.body.intro}</p>
             <p>${emailContent.body.action.instructions}</p>
             <a href="${resetURL}" style="color:#fff; background:#FF0000; padding:10px 20px; text-decoration:none;">Reset Password</a>
             <p>${emailContent.body.outro}</p>`,
    });

    req.flash("success_msg", "Password reset email sent. Check your inbox!");
    res.redirect("/forgot-password");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Something went wrong. Please try again.");
    res.redirect("/forgot-password");
  }
};

// -------- RESET PASSWORD PAGE --------
exports.getResetPasswordPage = async (req, res) => {
  try {
    const token = req.params.token;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error_msg", "Invalid or expired reset link.");
      return res.redirect("/forgot-password");
    }

    res.render("reset-password", { token });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Something went wrong. Please try again.");
    res.redirect("/forgot-password");
  }
};

// -------- RESET PASSWORD ACTION --------
exports.resetForgotPassword = async (req, res) => {
  try {
    const token = req.params.token;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error_msg", "Invalid or expired reset link.");
      return res.redirect("/forgot-password");
    }

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
