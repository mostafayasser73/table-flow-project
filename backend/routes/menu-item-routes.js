const express = require("express");

const menuItemControllers = require("../controllers/menu-item-controllers");
const reviewControllers = require("../controllers/review-controllers");
const { protect, restrictTo } = require("../middlewares/auth-middleware");
const multerUpload = require("../middlewares/multer-middleware");

const router = express.Router();

// public routes (Home Page and Menu Page can be opened without logging in)
router.get("/popular", menuItemControllers.getPopularMenuItems);

router.get("/categories", menuItemControllers.getCategories);

router.get("/", menuItemControllers.getAllMenuItems);

router.get("/:id", menuItemControllers.getMenuItemById);

// the Customer Reviews section on the Item Details page
router.get("/:id/reviews", reviewControllers.getMenuItemReviews);

router.post("/:id/reviews", protect, reviewControllers.createReview);

// the Menu Management pages are only for the staff
router.post(
  "/",
  protect,
  restrictTo("admin", "manager"),
  multerUpload.single("imageUrl"),
  menuItemControllers.createMenuItem,
);

router.patch(
  "/:id",
  protect,
  restrictTo("admin", "manager"),
  multerUpload.single("imageUrl"),
  menuItemControllers.updateMenuItem,
);

router.delete(
  "/:id",
  protect,
  restrictTo("admin", "manager"),
  menuItemControllers.deleteMenuItem,
);

module.exports = router;
