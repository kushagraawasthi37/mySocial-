const userModel = require("../models/user.js");
const postModel = require("../models/post.js");
const uploadOnCloudinary = require("../utils/cloudinary.js");

exports.createPost = async (req, res) => {
  try {
    const { content, email } = req.body;
    const fileContent = req.file?.path || null; // ✅ Ensure at least text or file is present

    // ✅ Check: must have either text OR file
    if (!content && !fileContent) {
      return res
        .status(400)
        .json({ error: "Post must have either text or an image" });
    }

    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).send("User not found");

    //Post save kr diya
    const post = await postModel.create({
      user: user._id,
      content,
      fileContent,
    });

    //user mai post  ko update kr diya
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");

    // ✅ Respond with both user + new post
    // res.status(201).json({
    //   message: "Post created successfully",
    //   post,
    //   user: {
    //     _id: user._id,
    //     email: user.email,
    //     username: user.username,
    //     posts: user.posts,
    //   },
    // });

  } catch (err) {
    console.error("Error in /post:", err);
    res.status(500).send("Server Error");
  }
};

exports.likePost = async (req, res) => {
  try {
    const postId = req.params.id.trim();
    let post = await postModel.findOne({ _id: postId }).populate("user");

    if (!post) return res.status(404).send("Post not found");

    if (post.likes.indexOf(req.user._id) === -1) {
      post.likes.push(req.user._id);
    } else {
      post.likes.splice(post.likes.indexOf(req.user._id), 1);
    }
    await post.save();

    res.redirect(req.headers.referer || "/feed");
  } catch (err) {
    console.error("Error in /like:", err);
    res.status(500).send("Server Error");
  }
};

exports.editPostPage = async (req, res) => {
  const post = await postModel.findById(req.params.id).populate("user");
  if (!post) return res.status(404).send("Post not found");
  res.render("edit", { post });
};

exports.updatePost = async (req, res) => {
  await postModel.findByIdAndUpdate(req.params.id, {
    content: req.body.updatedcontent,
  });
  res.redirect("/profile");
};

exports.deletePost = async (req, res) => {
  const post = await postModel.findById(req.params.id);
  if (!post) return res.status(404).send("Post not found");

  const user = await userModel.findById(post.user);
  if (!user) return res.status(404).send("User not found");

  ///remove the post from the user post
  //Must have to convert both to string because two object id can never be the same
  user.posts = user.posts.filter((p) => p.toString() !== post._id.toString());

  //can also do this
  //   const idx = user.posts.indexOf(post._id);
  // if (idx !== -1) user.posts.splice(idx, 1);

  await user.save();
  await postModel.findByIdAndDelete(post._id);
  res.redirect("/profile");
};
