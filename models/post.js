const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  date: {
    type: Date,
    default: Date.now,
  },

  content: {
    type: String,
  },

  fileContent: {
    type: String, // path or URL of image (optional)
    default: null,
  },

  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

//  Ensure at least text or file is present isko hum controller mai hi handle kar lenge
// postSchema.pre("validate", function (next) {
//   if (!this.content && !this.contentfile) {
//     return next(new Error("Post must have either text or an image"));
//   }
//   next();
// });

module.exports = mongoose.model("Post", postSchema);
