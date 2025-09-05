const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const { link } = require("../routes/authRoutes");
dotenv.config(); // ✅ load environment variables

// creates a “transporter” object that knows how to send mails.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // must be App Password
  },
});

const sendEmail = async ({ email, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"MySocial" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });
    console.log("✅ Email sent to", email);
  } catch (err) {
    console.error("❌ Email sending error:", err);
  }
};

const emailVerificationMailgenContent = (username, url) => {
  return {
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
  };
};

const forgotPasswordMailgenContent = (username, url) => {
  return {
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
  };
};

// ✅ Export functions for CommonJS
module.exports = {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
};
