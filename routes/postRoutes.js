const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const { isLoggedIn } = require("../utils/middleware");
const { upload } = require("../middleware/multer.middleware");

router.get("/like/:id", isLoggedIn, postController.likePost);
router.get("/edit/:id", isLoggedIn, postController.editPostPage);
router.post(
  "/update/:id",
  isLoggedIn,
  upload.single("fileContent"),
  postController.updatePost
);
router.get("/post-delete/:id", postController.deletePost);
router.post(
  "/post",
  isLoggedIn,
  upload.single("fileContent"),
  postController.createPost
);

module.exports = router;
