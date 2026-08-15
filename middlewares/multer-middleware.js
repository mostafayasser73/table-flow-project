const multer = require("multer");
const fs = require("fs");

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dest = "uploads";

    if (req.baseUrl.includes("menu-items")) {
      dest = "uploads/menu-items";
    } else if (req.baseUrl.includes("users") || req.baseUrl.includes("auth")) {
      dest = "uploads/users";
    }

    try {
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    } catch (err) {
      cb(err, null);
    }
  },

  filename: function (req, file, cb) {
    let fileName = file.originalname;
    let fileType = file.mimetype.split("/")[1];

    if (req.baseUrl.includes("menu-items")) {
      fileName = `item-${Date.now()}.${fileType}`;
    } else if (req.baseUrl.includes("users") || req.baseUrl.includes("auth")) {
      fileName = `user-${Date.now()}.${fileType}`;
    }

    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  const fileType = file.mimetype.split("/")[0];

  if (fileType == "image") {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"), false);
  }
};

const upload = multer({ storage: diskStorage, fileFilter });

module.exports = upload;
