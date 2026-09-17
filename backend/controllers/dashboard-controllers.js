const Order = require("../models/order-model");
const User = require("../models/user-model");
const Reservation = require("../models/reservation-model");

// GET /api/v1/dashboard/stats
// the four cards + the Recent Orders table on the Admin Dashboard
const getAdminStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();

    const paidOrders = await Order.find({ status: { $ne: "cancelled" } });

    const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0);

    const activeUsers = await User.countDocuments({ status: "active" });

    const totalReservations = await Reservation.countDocuments();

    const recentOrders = await Order.find()
      .populate("user", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      status: "success",
      data: {
        totalOrders,
        revenue: +revenue.toFixed(2),
        activeUsers,
        totalReservations,
        recentOrders,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Failed to fetch dashboard stats: ${error.message}`,
    });
  }
};

module.exports = { getAdminStats };
