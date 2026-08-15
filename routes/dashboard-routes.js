const express = require("express");

const dashboardControllers = require("../controllers/dashboard-controllers");
const { protect, restrictTo } = require("../middlewares/auth-middleware");

const router = express.Router();

router.get(
  "/stats",
  protect,
  restrictTo("admin", "manager"),
  dashboardControllers.getAdminStats,
);

module.exports = router;
