// utils/sendEmail.js
const sgMail = require("@sendgrid/mail");
const dotenv = require("dotenv");
dotenv.config(); // Loads environment variables

// ✅ Set SendGrid API Key from environment
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Send Email function
const sendEmail = async ({ email, subject, html }) => {
  try {
    await sgMail.send({
      to: email,
      from: process.env.EMAIL_USER, // Verified sender in SendGrid
      subject,
      html,
    });
    console.log("✅ Email sent to", email);
  } catch (err) {
    console.error(
      "❌ SendGrid Email Error:",
      err.response?.body?.errors || err.message
    );
  }
};

// Email verification template
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

// Forgot password template
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

module.exports = {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
};
