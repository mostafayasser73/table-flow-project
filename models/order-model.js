const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: Number,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Order must belong to a user"],
    },

    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          required: [true, "Order item must reference a menu item"],
        },

        name: {
          type: String,
          required: [true, "Order item name is required"],
        },

        price: {
          type: Number,
          required: [true, "Order item price is required"],
          min: [0, "Price cannot be negative"],
        },

        quantity: {
          type: Number,
          required: [true, "Order item quantity is required"],
          min: [1, "Quantity must be at least 1"],
        },
      },
    ],

    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal cannot be negative"],
    },

    deliveryFee: {
      type: Number,
      default: 0,
      min: [0, "Delivery fee cannot be negative"],
    },

    tax: {
      type: Number,
      required: [true, "Tax is required"],
      min: [0, "Tax cannot be negative"],
    },

    total: {
      type: Number,
      required: [true, "Total is required"],
      min: [0, "Total cannot be negative"],
    },

    orderType: {
      type: String,
      required: [true, "Order type is required"],
      enum: {
        values: ["delivery", "dine-in", "pickup"],
        message: "Order type must be delivery, dine-in, or pickup",
      },
    },

    deliveryAddress: {
      type: String,
      trim: true,
    },

    tableNumber: {
      type: Number,
      min: [1, "Table number cannot be less than 1"],
    },

    status: {
      type: String,
      enum: {
        values: [
          "pending",
          "preparing",
          "ready",
          "served",
          "delivered",
          "cancelled",
        ],
        message: "Please provide a valid order status",
      },
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

// Mongoose middleware (hook): give every new order a readable order number.
// We take the highest number that was used before and add one to it,
// so deleting an old order can never make a new order reuse its number.
orderSchema.pre("save", async function () {
  if (!this.isNew) return;

  const lastOrder = await mongoose
    .model("Order")
    .find()
    .sort({ orderNumber: -1 })
    .limit(1);

  this.orderNumber = lastOrder.length > 0 ? lastOrder[0].orderNumber + 1 : 1001;
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
