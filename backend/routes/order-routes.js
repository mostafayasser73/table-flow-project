const express = require("express");

const orderControllers = require("../controllers/order-controllers");
const { protect, restrictTo } = require("../middlewares/auth-middleware");

const router = express.Router();

// you must be logged in to use any order route
router.use(protect);

router.get("/my-orders", orderControllers.getMyOrders);

router.get(
  "/kitchen",
  restrictTo("admin", "manager", "chef"),
  orderControllers.getKitchenOrders,
);

router.get(
  "/stats",
  restrictTo("admin", "manager"),
  orderControllers.getOrderStats,
);

router
  .route("/")
  .get(
    restrictTo("admin", "manager", "waiter", "chef"),
    orderControllers.getAllOrders,
  )
  .post(orderControllers.createOrder);

router.patch(
  "/:id/status",
  restrictTo("admin", "manager", "chef", "waiter"),
  orderControllers.updateOrderStatus,
);

router
  .route("/:id")
  .get(orderControllers.getOrderById)
  .delete(restrictTo("admin"), orderControllers.deleteOrder);

module.exports = router;
