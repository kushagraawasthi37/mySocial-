const { body } = require("express-validator");

const userRegistorValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),

    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLength({ min: 5 })
      .withMessage("Username must be of at least 5 letters"),

    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password can't be empty")
      .isLength({ min: 7 })
      .withMessage("Password must be at least 7 characters"),

    body("name").trim().notEmpty().withMessage("Enter valid name"),
  ];
};

const userLoginValidator = () => {
  return [
    body("username").optional().notEmpty().withMessage("Incorrect username"),
    body("email").isEmail().withMessage("Incorrect Email"),
    body("password").notEmpty().withMessage("Password is required"),
  ];
};

const userChangeCurrentPasswordValidator = () => {
  return [
    body("oldPassword").notEmpty().withMessage("Old password is required"),
    body("newPassword").notEmpty().withMessage("New password is required"),
  ];
};

const userForgotPasswordValidator = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
  ];
};

const userResetForgotPasswordValidator = () => {
  return [body("newPassword").notEmpty().withMessage("Password is required")];
};

// Export using CommonJS
module.exports = {
  userRegistorValidator,
  userLoginValidator,
  userChangeCurrentPasswordValidator,
  userForgotPasswordValidator,
  userResetForgotPasswordValidator,
};
