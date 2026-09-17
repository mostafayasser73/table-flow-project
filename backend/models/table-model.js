const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: [true, "Table number is required"],
      unique: true,
      min: [1, "Table number cannot be less than 1"],
    },

    capacity: {
      type: Number,
      required: [true, "Table capacity is required"],
      min: [1, "Capacity must be at least 1"],
      max: [20, "Capacity cannot exceed 20"],
    },

    currentGuests: {
      type: Number,
      default: 0,
      min: [0, "Current guests cannot be negative"],
    },

    status: {
      type: String,
      enum: {
        values: ["available", "occupied", "reserved"],
        message: "Status must be available, occupied, or reserved",
      },
      default: "available",
    },

    assignedWaiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

const Table = mongoose.model("Table", tableSchema);

module.exports = Table;
