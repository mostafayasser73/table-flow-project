const express = require("express");

const authControllers = require("../controllers/auth-controllers");
const { protect } = require("../middlewares/auth-middleware");
const multerUpload = require("../middlewares/multer-middleware");

const router = express.Router();

router.post("/register", multerUpload.single("imageUrl"), authControllers.register);

router.post("/login", authControllers.login);

router
  .route("/me")
  .get(protect, authControllers.getMe)
  .patch(protect, multerUpload.single("imageUrl"), authControllers.updateMe);

router.patch("/change-password", protect, authControllers.changePassword);

module.exports = router;
