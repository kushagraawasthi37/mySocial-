const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const { isLoggedIn } = require("../utils/middleware");

router.post("/post", isLoggedIn, postController.createPost);
router.get("/like/:id", isLoggedIn, postController.likePost);
router.get("/edit/:id", isLoggedIn, postController.editPostPage);
router.post("/update/:id", isLoggedIn, postController.updatePost);
router.get("/post-delete/:id", postController.deletePost);

module.exports = router;
