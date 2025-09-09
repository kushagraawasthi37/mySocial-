const userModel = require("../models/user.js");
const postModel = require("../models/post.js");
const { uploadOnCloudinary } = require("../utils/cloudinary.js");

// -------- PROFILE PAGE --------
exports.getProfile = async (req, res) => {
  try {
    const populatedUser = await userModel
      .findById(req.user._id)
      .populate({
        path: "posts",
        select: "content fileContent likes user date",
        options: { sort: { date: -1 } }, // newest posts first
        populate: { path: "user", select: "username avatar" },
      })
      .lean();

    res.render("profile", {
      user: populatedUser,
      success_msg: res.locals.success_msg,
      error_msg: res.locals.error_msg,
      message: res.locals.message,
    });
  } catch (err) {
    console.error("Profile load error:", err);
    req.flash("error_msg", "Something went wrong. Please log in again.");
    res.redirect("/login");
  }
};

// -------- FEED PAGE --------
exports.getFeed = async (req, res) => {
  try {
    if (!req.user) {
      req.flash("error_msg", "You must be logged in to view the feed.");
      return res.redirect("/login");
    }

    const posts = await postModel
      .find()
      .populate("user", "username avatar")
      .sort({ date: -1 })
      .lean();

    res.render("feed", {
      posts,
      userId: req.user._id.toString(),
      user: req.user,
    });
  } catch (err) {
    console.error("Feed load error:", err);
    req.flash("error_msg", "Something went wrong. Please try again.");
    res.redirect("/login");
  }
};

// -------- SEARCH PAGE --------
exports.searchPage = (req, res) => res.render("search-user");

// -------- SEARCH USERS --------
exports.searchUsers = async (req, res) => {
  try {
    const searchTerm = req.body.username.trim();
    const escapeRegex = (text) =>
      text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    const users = await userModel.find({
      username: { $regex: escapeRegex(searchTerm), $options: "i" },
    });

    if (!users.length) {
      return res.render("search-user", {
        message: `No results for "${searchTerm}"`,
      });
    }

    res.render("search-user", { users });
  } catch (err) {
    console.error("Search error:", err);
    req.flash("error_msg", "Something went wrong. Please try again.");
    res.redirect("/search/user");
  }
};

// -------- VIEW OTHER USER PROFILE --------
exports.viewOtherProfile = async (req, res) => {
  try {
    const user = await userModel
      .findOne({ username: req.params.username })
      .select("username name age avatar coverImage posts")
      .populate({
        path: "posts",
        select: "content fileContent likes user date",
        options: { sort: { date: -1 } },
        populate: { path: "user", select: "username avatar" },
      })
      .lean();

    if (!user) return res.status(404).send("User not found");

    res.render("others_profile", {
      user,
      success_msg: res.locals.success_msg,
      error_msg: res.locals.error_msg,
      message: res.locals.message,
    });
  } catch (err) {
    console.error("View profile error:", err);
    req.flash("error_msg", "Something went wrong. Please try again.");
    res.redirect("/feed");
  }
};

// -------- DELETE ACCOUNT PAGE --------
exports.deleteAccountPage = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    if (!user) return res.status(404).send("User not found");

    res.render("deleteAccount", { user });
  } catch (err) {
    console.error("Delete account page error:", err);
    req.flash("error_msg", "Something went wrong.");
    res.redirect("/feed");
  }
};

// -------- DELETE ACCOUNT ACTION --------
exports.deleteAccountAction = async (req, res) => {
  try {
    const { confirmCheck, confirmText } = req.body;
    if (!confirmCheck || confirmText !== "DELETE") {
      return res.status(400).send("You must confirm deletion");
    }

    const deletedUser = await userModel.findByIdAndDelete(req.user._id);
    if (!deletedUser) return res.status(404).send("User not found");

    await postModel.deleteMany({ user: deletedUser._id });

    req.flash(
      "success_msg",
      "Account and all your posts deleted successfully."
    );
    res.redirect("/login");
  } catch (err) {
    console.error("Delete account action error:", err);
    req.flash("error_msg", "Something went wrong. Please try again.");
    res.redirect("/feed");
  }
};

// -------- UPLOAD PROFILE PHOTO --------
exports.uploadProfilephoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");

    const uploaded = await uploadOnCloudinary(req.file.path);

    await userModel.findByIdAndUpdate(req.user._id, {
      avatar: uploaded.secure_url,
    });
    res.redirect("/profile");
  } catch (err) {
    console.error("Avatar upload error:", err);
    req.flash("error_msg", "Error uploading avatar");
    res.redirect("/profile");
  }
};

// -------- UPDATE COVER IMAGE --------
exports.updateUsercoverImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No cover image uploaded");

    const uploaded = await uploadOnCloudinary(req.file.path);

    await userModel.findByIdAndUpdate(req.user._id, {
      coverImage: uploaded.secure_url,
    });
    res.redirect("/profile");
  } catch (err) {
    console.error("Cover image update error:", err);
    req.flash("error_msg", "Error updating cover image");
    res.redirect("/profile");
  }
};
