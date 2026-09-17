const express = require("express");

const userControllers = require("../controllers/user-controllers");
const { protect, restrictTo } = require("../middlewares/auth-middleware");
const multerUpload = require("../middlewares/multer-middleware");

const router = express.Router();

// every route below is only for the Users Management page
router.use(protect, restrictTo("admin", "manager"));

router
  .route("/")
  .get(userControllers.getAllUsers)
  .post(multerUpload.single("imageUrl"), userControllers.createUser);

router
  .route("/:id")
  .get(userControllers.getUserById)
  .patch(multerUpload.single("imageUrl"), userControllers.updateUser)
  .delete(restrictTo("admin"), userControllers.deleteUser);

module.exports = router;
