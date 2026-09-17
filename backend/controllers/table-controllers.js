const Table = require("../models/table-model");
const Order = require("../models/order-model");

// GET /api/v1/tables
const getAllTables = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status && req.query.status.toLowerCase() !== "all") {
      filter.status = req.query.status.toLowerCase();
    }

    const tables = await Table.find(filter)
      .populate("assignedWaiter", "firstName lastName")
      .sort({ tableNumber: 1 });

    res.status(200).json({
      status: "success",
      count: tables.length,
      data: {
        tables,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Failed to fetch tables: ${error.message}`,
    });
  }
};

// GET /api/v1/tables/my-tables  (Waiter Dashboard)
const getMyTables = async (req, res) => {
  try {
    const tables = await Table.find({ assignedWaiter: req.user._id }).sort({
      tableNumber: 1,
    });

    const tableNumbers = tables.map((table) => table.tableNumber);

    // the "Orders to Serve" table on the Waiter Dashboard
    const orders = await Order.find({
      tableNumber: { $in: tableNumbers },
      status: { $in: ["preparing", "ready"] },
    })
      .populate("user", "firstName lastName")
      .sort({ createdAt: -1 });

    const readyToServe = orders.filter(
      (order) => order.status === "ready",
    ).length;

    res.status(200).json({
      status: "success",
      count: tables.length,
      activeOrders: orders.length,
      readyToServe,
      data: {
        tables,
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

// GET /api/v1/tables/:id
const getTableById = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id).populate(
      "assignedWaiter",
      "firstName lastName",
    );

    if (!table) {
      return res.status(404).json({
        status: "fail",
        message: "Table not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        table,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// POST /api/v1/tables
const createTable = async (req, res) => {
  try {
    const newTable = await Table.create(req.body);

    res.status(201).json({
      status: "success",
      message: "Table added successfully",
      data: {
        table: newTable,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// PATCH /api/v1/tables/:id
const updateTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({
        status: "fail",
        message: "Table not found",
      });
    }

    // a waiter works only on the tables of the Waiter Dashboard,
    // which are the tables assigned to them
    if (req.user.role === "waiter") {
      if (String(table.assignedWaiter) !== String(req.user._id)) {
        return res.status(403).json({
          status: "fail",
          message: "You can only update the tables assigned to you",
        });
      }

      // and a waiter must not move a table to another waiter
      delete req.body.assignedWaiter;
    }

    if (req.body.status) req.body.status = req.body.status.toLowerCase();

    const updatedTable = await Table.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!updatedTable) {
      return res.status(404).json({
        status: "fail",
        message: "Table not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Table updated successfully",
      data: {
        table: updatedTable,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// DELETE /api/v1/tables/:id
const deleteTable = async (req, res) => {
  try {
    const deletedTable = await Table.findByIdAndDelete(req.params.id);

    if (!deletedTable) {
      return res.status(404).json({
        status: "fail",
        message: "Table not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Table deleted successfully",
      data: {
        table: deletedTable,
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
  getAllTables,
  getMyTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
};
