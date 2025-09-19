// utils/mail.js
const sgMail = require("@sendgrid/mail");
require("dotenv").config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, html) => {
  try {
    await sgMail.send({
      to,
      from: process.env.EMAIL_USER,
      subject,
      html,
    });
    console.log("✅ Email sent to", to);
  } catch (err) {
    console.error("❌ Email sending error:", err);
  }
};

const emailVerificationContent = (username, url) => `
  <div style="font-family:Arial,sans-serif;text-align:center;">
    <p>Hi ${username},</p>
    <p>Welcome to MySocial! Please verify your email:</p>
    <a href="${url}" style="
      display:inline-block;
      padding:10px 20px;
      background:#22BC66;
      color:#fff;
      text-decoration:none;
      border-radius:5px;
      margin-top:10px;
    ">Verify Email</a>
    <p style="margin-top:20px;font-size:12px;color:#555;">Ignore this if you did not register.</p>
  </div>
`;

const forgotPasswordContent = (username, url) => `
  <div style="font-family:Arial,sans-serif;text-align:center;">
    <p>Hi ${username},</p>
    <p>You requested a password reset:</p>
    <a href="${url}" style="
      display:inline-block;
      padding:10px 20px;
      background:#FF0000;
      color:#fff;
      text-decoration:none;
      border-radius:5px;
      margin-top:10px;
    ">Reset Password</a>
    <p style="margin-top:20px;font-size:12px;color:#555;">Ignore if you didn't request it.</p>
  </div>
`;

module.exports = {
  sendEmail,
  emailVerificationContent,
  forgotPasswordContent,
};
