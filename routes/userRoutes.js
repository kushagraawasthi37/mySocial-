const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { isLoggedIn } = require("../utils/middleware");

router.get("/profile", isLoggedIn, userController.getProfile);
router.get("/feed", isLoggedIn, userController.getFeed);
router.get(
  "/feed/profile/:username",
  isLoggedIn,
  userController.viewOtherProfile
);

router.get("/search/user", userController.searchPage);
router.post("/search/user", userController.searchUsers);

router.get("/delete-account/:username", userController.deleteAccountPage);
router.post("/delete-account/:username", userController.deleteAccountAction);

// Route to view another user's profile
router.get("/user/:username", userController.viewOtherProfile);

module.exports = router;
