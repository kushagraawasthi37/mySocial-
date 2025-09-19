// mail.js
const nodemailer = require("nodemailer");
require("dotenv").config(); // Load environment variables

// Create transporter using SendGrid
const transporter = nodemailer.createTransport({
  service: "SendGrid",
  auth: {
    user: "apikey", // literally "apikey"
    pass: process.env.SENDGRID_API_KEY,
  },
});

// Generic function to send email
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"MySocial" <${process.env.EMAIL_USER}>`, // verified sender
      to,
      subject,
      html,
    });
    console.log("✅ Email sent to", to);
  } catch (err) {
    console.error("❌ Email sending error:", err);
  }
};

// Email verification template
const emailVerificationContent = (username, url) => `
  <p>Hi ${username},</p>
  <p>Welcome! Please verify your email by clicking the link below:</p>
  <a href="${url}" style="display:inline-block;padding:10px 20px;background:#22BC66;color:white;text-decoration:none;">Verify Email</a>
`;

// Forgot password template
const forgotPasswordContent = (username, url) => `
  <p>Hi ${username},</p>
  <p>You requested a password reset. Click the link below:</p>
  <a href="${url}" style="display:inline-block;padding:10px 20px;background:#FF0000;color:white;text-decoration:none;">Reset Password</a>
  <p>If you did not request this, please ignore this email.</p>
`;

module.exports = {
  sendEmail,
  emailVerificationContent,
  forgotPasswordContent,
};
