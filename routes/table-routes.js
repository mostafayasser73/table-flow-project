const express = require("express");

const tableControllers = require("../controllers/table-controllers");
const { protect, restrictTo } = require("../middlewares/auth-middleware");

const router = express.Router();

router.use(protect);

// the Waiter Dashboard
router.get("/my-tables", restrictTo("waiter"), tableControllers.getMyTables);

router
  .route("/")
  .get(
    restrictTo("admin", "manager", "waiter"),
    tableControllers.getAllTables,
  )
  .post(restrictTo("admin", "manager"), tableControllers.createTable);

router
  .route("/:id")
  .get(restrictTo("admin", "manager", "waiter"), tableControllers.getTableById)
  .patch(
    restrictTo("admin", "manager", "waiter"),
    tableControllers.updateTable,
  )
  .delete(restrictTo("admin", "manager"), tableControllers.deleteTable);

module.exports = router;
