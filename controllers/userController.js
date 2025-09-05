const postModel = require("../models/post");
const userModel = require("../models/user");
const jwt = require("jsonwebtoken");

// -------- PROFILE PAGE --------
exports.getProfile = async (req, res) => {
  try {
    const user = req.user; // Already fetched by middleware

    // Optional: populate posts and likes if needed
    const populatedUser = await userModel
      .findById(user._id)
      .populate("posts") // populate posts
      .populate({
        path: "posts.likes", // populate likes inside posts
        select: "_id", // only get the _id of likes
      })
      .lean();

    //Aisa format dega
    //       {
    //   _id: "64f2abc123...",
    //   username: "john",
    //   posts: [
    //     { _id: "post1id", title: "Post 1", likes: [{ _id: "user2id" }, { _id: "user3id" }] },
    //     { _id: "post2id", title: "Post 2", likes: [{ _id: "user3id" }] }
    //   ]
    // }

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
    const posts = await postModel
      .find() //Get all posts from DB
      .populate("user") //Replace user ID with full user document
      .sort({ createdAt: -1 }); //Sort posts by newest first

    //  Sorts the posts by createdAt field.
    // -1 → descending order → newest posts first.
    // 1 → ascending order → oldest posts first.

    if (!req.user) {
      req.flash("error_msg", "You must be logged in to view the feed.");
      return res.redirect("/login");
    }

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

    //Regex characters like *, ., ?, [, etc. can break your regex search.
    //This function escapes all special characters, so the search term is treated as a literal string.

    const users = await userModel.find({
      username: { $regex: escapeRegex(searchTerm), $options: "i" },
      // username: { $regex: ..., $options: "i" } → searches usernames that match the regex.
      // $options: "i" → case-insensitive search
      // Regex does partial matching by default.
      // Returns an array of all matching users.
    });

    if (!users.length)
      return res.render("search-user", {
        message: `No results for "${searchTerm}"`,
      });

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
      .populate("posts");

    if (!user) return res.status(404).send("User not found");

    res.render("others_profile", { user });
  } catch (err) {
    console.error("View profile error:", err);
    req.flash("error_msg", "Something went wrong. Please try again.");
    res.redirect("/feed");
  }
};

// -------- DELETE ACCOUNT PAGE --------
exports.deleteAccountPage = async (req, res) => {
  try {
    const user = await userModel.findOne({ username: req.params.username });
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
    if (!confirmCheck || confirmText !== "DELETE")
      return res.status(400).send("You must confirm deletion");

    const deletedUser = await userModel.findOneAndDelete({
      username: req.params.username,
    });
    
    if (!deletedUser) return res.status(404).send("User not found");

    req.flash("success_msg", "Account deleted successfully.");
    res.redirect("/login");
  } catch (err) {
    console.error("Delete account action error:", err);
    req.flash("error_msg", "Something went wrong. Please try again.");
    res.redirect("/feed");
  }
};
