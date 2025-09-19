const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const { isLoggedIn } = require("../utils/middleware");
const { upload } = require("../middleware/multer.middleware");
const postModel = require("../models/post");

router.get("/like/:id", isLoggedIn, postController.likePost);
router.get("/edit/:id", isLoggedIn, postController.editPostPage);
router.post(
  "/update/:id",
  isLoggedIn,
  upload.single("fileContent"),
  postController.updatePost
);
router.get("/post-delete/:id", isLoggedIn, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) {
      req.flash("error_msg", "Post not found");
      return res.redirect("/profile");
    }

    // Pass the post to EJS
    res.render("delete-posts", { posts: post });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Something went wrong");
    res.redirect("/profile");
  }
});

router.post("/post-delete/:id", isLoggedIn, postController.deletePost);
router.post(
  "/post",
  isLoggedIn,
  upload.single("fileContent"),
  postController.createPost
);

module.exports = router;
