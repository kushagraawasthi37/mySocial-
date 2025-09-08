const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { isLoggedIn } = require("../utils/middleware");
const { upload } = require("../middleware/multer.middleware");

router.get("/profile", isLoggedIn, userController.getProfile);
router.get("/feed", isLoggedIn, userController.getFeed);
router.get(
  "/feed/profile/:username",
  isLoggedIn,
  userController.viewOtherProfile
);

router.get("/search/user", userController.searchPage);
router.post("/search/user", userController.searchUsers);

router.get(
  "/delete-account/:username",
  isLoggedIn,
  userController.deleteAccountPage
);
router.post(
  "/delete-account/:username",
  isLoggedIn,
  userController.deleteAccountAction
);
router.post(
  "/profile/photo",
  isLoggedIn,
  upload.single("avatar"),
  userController.uploadProfilephoto
);
router.post(
  "/profile/cover",
  isLoggedIn,
  upload.single("coverImage"),
  userController.updateUsercoverImage
);

// Route to view another user's profile
router.get("/user/:username", userController.viewOtherProfile);

module.exports = router;
