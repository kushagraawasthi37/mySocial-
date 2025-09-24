// utils/middleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/user");

exports.isLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      req.flash("error_msg", "Please log in first.");
      return res.redirect("/login");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).lean();
    //lean()->Converts the Mongoose document into a plain JavaScript object.
    //Without .lean(), Mongoose returns a full document object, which has extra methods like .save().
    //With .lean(), you get a simpler object, faster and lighter for read-only operations.

    if (!user) {
      req.flash("error_msg", "User not found.");
      return res.redirect("/login");
    }

    req.user = user;
    next();
  } catch (err) {
    // console.error("Auth middleware error:", err);
    req.flash("error_msg", "Please log in again.");
    res.redirect("/login");
  }
};
