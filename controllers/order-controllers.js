const Order = require("../models/order-model");
const MenuItem = require("../models/menu-item-model");
const Table = require("../models/table-model");
const User = require("../models/user-model");

// the values used in the Order Summary card on the Cart & Checkout page
const TAX_RATE = 0.14;
const DELIVERY_FEE = 25;

// GET /api/v1/orders  (Orders Dashboard)
// supports: ?status=pending  ?orderType=delivery  ?search=1042  ?page=1&limit=10
const getAllOrders = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status && req.query.status.toLowerCase() !== "all") {
      filter.status = req.query.status.toLowerCase();
    }

    if (req.query.orderType && req.query.orderType.toLowerCase() !== "all") {
      filter.orderType = req.query.orderType.toLowerCase();
    }

    // the "Search orders..." box searches by order number or by customer name
    if (req.query.search) {
      const search = req.query.search.replace("#", "");

      // find the customers whose name matches what was typed
      const matchedUsers = await User.find({
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
        ],
      });

      const matchedUsersIds = matchedUsers.map((user) => user._id);

      filter.$or = [
        { orderNumber: +search || 0 },
        { user: { $in: matchedUsersIds } },
      ];
    }

    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .populate("user", "firstName lastName email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments(filter);

    res.status(200).json({
      status: "success",
      count: orders.length,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      data: {
        orders,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Failed to fetch orders: ${error.message}`,
    });
  }
};

// GET /api/v1/orders/my-orders  (Profile > My Orders tab)
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      status: "success",
      count: orders.length,
      data: {
        orders,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// GET /api/v1/orders/kitchen  (Kitchen Display)
const getKitchenOrders = async (req, res) => {
  try {
    // the kitchen only cares about the orders it still has to cook
    const orders = await Order.find({
      status: { $in: ["pending", "preparing"] },
    })
      .populate("user", "firstName lastName")
      .sort({ createdAt: 1 });

    const pendingCount = orders.filter(
      (order) => order.status === "pending",
    ).length;

    const preparingCount = orders.filter(
      (order) => order.status === "preparing",
    ).length;

    res.status(200).json({
      status: "success",
      count: orders.length,
      pendingCount,
      preparingCount,
      data: {
        orders,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// GET /api/v1/orders/stats  (the four cards on the Orders Dashboard)
const getOrderStats = async (req, res) => {
  try {
    const pending = await Order.countDocuments({ status: "pending" });
    const preparing = await Order.countDocuments({ status: "preparing" });
    const ready = await Order.countDocuments({ status: "ready" });

    // today's total revenue
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayOrders = await Order.find({
      createdAt: { $gte: startOfDay },
      status: { $ne: "cancelled" },
    });

    const todayTotal = todayOrders.reduce(
      (sum, order) => sum + order.total,
      0,
    );

    res.status(200).json({
      status: "success",
      data: {
        pending,
        preparing,
        ready,
        todayTotal,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// GET /api/v1/orders/:id
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "firstName lastName email phone",
    );

    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found",
      });
    }

    // a customer can only open their own order
    if (
      req.user.role === "customer" &&
      String(order.user._id) !== String(req.user._id)
    ) {
      return res.status(403).json({
        status: "fail",
        message: "You can only view your own orders",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        order,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// POST /api/v1/orders  (Place Order button)
const createOrder = async (req, res) => {
  try {
    const { items, orderType, deliveryAddress, tableNumber } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "Your cart is empty",
      });
    }

    const type = orderType?.toLowerCase();

    if (type === "delivery" && !deliveryAddress) {
      return res.status(400).json({
        status: "fail",
        message: "Delivery address is required for delivery orders",
      });
    }

    if (type === "dine-in" && !tableNumber) {
      return res.status(400).json({
        status: "fail",
        message: "Table number is required for dine-in orders",
      });
    }

    // a dine-in order must belong to a table that really exists
    let table;

    if (type === "dine-in") {
      table = await Table.findOne({ tableNumber });

      if (!table) {
        return res.status(404).json({
          status: "fail",
          message: `Table number ${tableNumber} does not exist`,
        });
      }
    }

    // build the items from the database so the client cannot send its own prices
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);

      if (!menuItem) {
        return res.status(404).json({
          status: "fail",
          message: `Menu item not found: ${item.menuItem}`,
        });
      }

      if (!menuItem.available) {
        return res.status(400).json({
          status: "fail",
          message: `${menuItem.name} is not available right now`,
        });
      }

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
      });
    }

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const deliveryFee = type === "delivery" ? DELIVERY_FEE : 0;
    const tax = subtotal * TAX_RATE;
    const total = subtotal + deliveryFee + tax;

    const newOrder = await Order.create({
      user: req.user._id,
      items: orderItems,
      subtotal: +subtotal.toFixed(2),
      deliveryFee,
      tax: +tax.toFixed(2),
      total: +total.toFixed(2),
      orderType: type,
      deliveryAddress,
      tableNumber,
    });

    // a dine-in order means the table is now busy.
    // the guest count is kept as it is, because it comes from the
    // confirmed reservation of this table (see reservation-controllers).
    if (type === "dine-in") {
      table.status = "occupied";

      await table.save();
    }

    res.status(201).json({
      status: "success",
      message: "Order placed successfully",
      data: {
        order: newOrder,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// PATCH /api/v1/orders/:id/status
// used by: Accept / Ready / Picked Up (Orders Dashboard),
// Start Preparing / Mark Ready (Kitchen Display), Mark Served (Waiter View)
const updateOrderStatus = async (req, res) => {
  try {
    const status = req.body.status?.toLowerCase();

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found",
      });
    }

    order.status = status;

    const updatedOrder = await order.save();

    // when a dine-in order is finished the table becomes free again
    if (
      updatedOrder.orderType === "dine-in" &&
      ["served", "delivered", "cancelled"].includes(updatedOrder.status)
    ) {
      await Table.findOneAndUpdate(
        { tableNumber: updatedOrder.tableNumber },
        { status: "available", currentGuests: 0 },
        { runValidators: true },
      );
    }

    res.status(200).json({
      status: "success",
      message: "Order status updated successfully",
      data: {
        order: updatedOrder,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// DELETE /api/v1/orders/:id
const deleteOrder = async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found",
      });
    }

    // the table must not stay busy because of an order that no longer exists
    if (deletedOrder.orderType === "dine-in") {
      await Table.findOneAndUpdate(
        { tableNumber: deletedOrder.tableNumber },
        { status: "available", currentGuests: 0 },
        { runValidators: true },
      );
    }

    res.status(200).json({
      status: "success",
      message: "Order deleted successfully",
      data: {
        order: deletedOrder,
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
  getAllOrders,
  getMyOrders,
  getKitchenOrders,
  getOrderStats,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
};
