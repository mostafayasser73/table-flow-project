const Review = require("../models/review-model");
const MenuItem = require("../models/menu-item-model");

// recalculates the rating shown on the Item Details page
const updateMenuItemRating = async (menuItemId) => {
  const reviews = await Review.find({ menuItem: menuItemId });

  let averageRating = 0;

  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);

    averageRating = totalRating / reviews.length;
  }

  await MenuItem.findByIdAndUpdate(menuItemId, {
    rating: averageRating,
    numReviews: reviews.length,
  });
};

// GET /api/v1/menu-items/:id/reviews  (Customer Reviews section)
const getMenuItemReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ menuItem: req.params.id })
      .populate("user", "firstName lastName imageUrl")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      count: reviews.length,
      data: {
        reviews,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Failed to fetch reviews: ${error.message}`,
    });
  }
};

// POST /api/v1/menu-items/:id/reviews
const createReview = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        status: "fail",
        message: "Menu item not found",
      });
    }

    // one review per user for each item
    const existingReview = await Review.findOne({
      menuItem: req.params.id,
      user: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({
        status: "fail",
        message: "You have already reviewed this item",
      });
    }

    const newReview = await Review.create({
      menuItem: req.params.id,
      user: req.user._id,
      rating: req.body.rating,
      comment: req.body.comment,
    });

    await updateMenuItemRating(req.params.id);

    res.status(201).json({
      status: "success",
      message: "Review added successfully",
      data: {
        review: newReview,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// DELETE /api/v1/reviews/:id
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        status: "fail",
        message: "Review not found",
      });
    }

    // the owner of the review, or an admin, can delete it
    if (
      String(review.user) !== String(req.user._id) &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        status: "fail",
        message: "You can only delete your own review",
      });
    }

    await Review.findByIdAndDelete(req.params.id);

    await updateMenuItemRating(review.menuItem);

    res.status(200).json({
      status: "success",
      message: "Review deleted successfully",
      data: {
        review,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  getMenuItemReviews,
  createReview,
  deleteReview,
};
