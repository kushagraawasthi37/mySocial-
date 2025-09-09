const userModel = require("../models/user.js");
const postModel = require("../models/post.js");
const { uploadOnCloudinary } = require("../utils/cloudinary.js");

// -------- CREATE POST --------
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    let fileContent = null;

    if (req.file) {
      const uploaded = await uploadOnCloudinary(req.file.path);
      fileContent = uploaded?.secure_url || null;
    }

    if (!content && !fileContent) {
      req.flash("error_msg", "Post must have text or an image.");
      return res.redirect("/profile");
    }

    const user = await userModel.findById(req.user._id);
    if (!user) return res.status(404).send("User not found");

    const post = await postModel.create({
      user: user._id,
      content,
      fileContent,
    });

    user.posts.push(post._id);
    await user.save();

    res.redirect("/profile");
  } catch (err) {
    console.error("Create post error:", err);
    req.flash("error_msg", "Failed to create post.");
    res.redirect("/profile");
  }
};

// -------- LIKE / UNLIKE POST --------
exports.likePost = async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    const userId = req.user._id.toString();
    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.redirect(req.headers.referer || "/feed");
  } catch (err) {
    console.error("Like/unlike error:", err);
    req.flash("error_msg", "Something went wrong.");
    res.redirect("/profile");
  }
};

// -------- EDIT POST PAGE --------
exports.editPostPage = async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id).populate("user");
    if (!post) return res.status(404).send("Post not found");

    if (post.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).send("Unauthorized");
    }

    res.render("edit", { post, user: post.user });
  } catch (err) {
    console.error("Load edit post page error:", err);
    req.flash("error_msg", "Something went wrong.");
    res.redirect("/profile");
  }
};

// -------- UPDATE POST --------
exports.updatePost = async (req, res) => {
  try {
    const { updatedcontent } = req.body;
    const updates = { content: updatedcontent || "" };

    if (!updatedcontent && !req.file) {
      req.flash("error_msg", "Post must have text or an image.");
      return res.redirect("/profile");
    }

    if (req.file) {
      const uploaded = await uploadOnCloudinary(req.file.path);
      updates.fileContent = uploaded?.secure_url || null;
    }

    const post = await postModel.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).send("Unauthorized");
    }

    await postModel.findByIdAndUpdate(req.params.id, updates);
    res.redirect("/profile");
  } catch (err) {
    console.error("Update post error:", err);
    req.flash("error_msg", "Failed to update post.");
    res.redirect("/profile");
  }
};

// -------- DELETE POST --------
exports.deletePost = async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).send("Unauthorized");
    }

    const user = await userModel.findById(post.user);
    user.posts = user.posts.filter((p) => p.toString() !== post._id.toString());
    await user.save();

    await postModel.findByIdAndDelete(post._id);
    res.redirect("/profile");
  } catch (err) {
    console.error("Delete post error:", err);
    req.flash("error_msg", "Failed to delete post.");
    res.redirect("/profile");
  }
};
