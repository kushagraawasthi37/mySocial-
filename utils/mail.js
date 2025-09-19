const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config(); // Load environment variables

// Create transporter using SendGrid
const transporter = nodemailer.createTransport({
  service: "SendGrid",
  auth: {
    user: "apikey", // literally "apikey"
    pass: process.env.SENDGRID_API_KEY,
  },
});

// Generic function to send email
const sendEmail = async ({ email, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"MySocial" <${process.env.EMAIL_USER}>`, // verified sender
      to: email,
      subject,
      html,
    });
    console.log("✅ Email sent to", email);
  } catch (err) {
    console.error("❌ Email sending error:", err);
  }
};

// Email verification template
const emailVerificationMailgenContent = (username, url) => ({
  body: {
    name: username,
    intro: "Welcome! Please verify your email.",
    action: {
      instructions: "Click the button below to verify your email:",
      button: {
        color: "#22BC66",
        text: "Verify Email",
        link: url,
      },
    },
  },
});

// Forgot password email template
const forgotPasswordMailgenContent = (username, url) => ({
  body: {
    name: username,
    intro: "You requested a password reset.",
    action: {
      instructions: "Click the button below to reset your password:",
      button: {
        color: "#FF0000",
        text: "Reset Password",
        link: url,
      },
    },
    outro: "If you did not request this, please ignore this email.",
  },
});

module.exports = {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
};
