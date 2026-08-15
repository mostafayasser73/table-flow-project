const express = require("express");

const reviewControllers = require("../controllers/review-controllers");
const { protect } = require("../middlewares/auth-middleware");

const router = express.Router();

router.delete("/:id", protect, reviewControllers.deleteReview);

module.exports = router;
