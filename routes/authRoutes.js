const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
  userRegistorValidator,
  userLoginValidator,
} = require("../validators/userValidator");

const { validationResult } = require("express-validator");

// -------- GET PAGES --------
router.get("/", authController.getHome);
router.get("/login", authController.getLogin);
router.get("/register", authController.getRegister);
router.get("/forgot-password", authController.getForgotPassword);
router.get("/reset-password/:token", authController.getResetPasswordPage);

// -------- REGISTRATION --------
router.post("/register", userRegistorValidator(), (req, res) => {
  const errors = validationResult(req); //→ Comes from express-validator. Collects errors from userRegistorValidator().

  //errors ko array mai convert kro aur phir uske element ko mai uske messase dikao aur usnko , ke saath join kardo sab elementko
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((err) => err.msg)
      .join(", ");
    req.flash("error_msg", message);
    return res.redirect("/register"); // Redirect instead of render
  }

  //Sab sahi hai to aab register controller ko call kro
  authController.registerUser(req, res);
});

// -------- EMAIL VERIFICATION --------
router.get("/verify-email/:token", authController.verifyEmail);

// -------- LOGIN --------
router.post("/login", userLoginValidator(), (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    if (!errors.isEmpty()) {
      const message = errors
        .array()
        .map((err) => err.msg)
        .join(", ");
      req.flash("error_msg", message);
      return res.redirect("/login"); // Redirect instead of render
    }
  }
  //Mtlb jo data dala hai sahi format mai hai aab login  bala chalao
  authController.loginUser(req, res);
});

// -------- LOGOUT --------
router.get("/logout", authController.logoutUser);

// -------- FORGOT PASSWORD --------
router.post("/forgot-password", authController.sendForgotPasswordEmail);

// -------- RESET PASSWORD --------
router.post("/reset-password/:token", authController.resetForgotPassword);

module.exports = router;
