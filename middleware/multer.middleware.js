const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

// Configure storage dynamically
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "public/images/others"; // default folder

    if (file.fieldname === "avatar") {
      folder = "public/images/profile";
    } else if (file.fieldname === "coverImage") {
      folder = "public/images/coverImage";
    } else if (file.fieldname === "post") {
      folder = "public/images/posts";
    }

    // ✅ Ensure folder exists
    fs.mkdirSync(folder, { recursive: true });

    cb(null, folder);
  },
  filename: function (req, file, cb) {
    // ✅ Generate unique hex name
    const uniqueName =
      crypto.randomBytes(12).toString("hex") + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

module.exports = { upload };
