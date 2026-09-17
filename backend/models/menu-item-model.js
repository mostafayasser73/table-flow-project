const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Item name is required"],
      unique: true,
      trim: true,
      minlength: [3, "Item name must be at least 3 characters long"],
      maxlength: [100, "Item name cannot exceed 100 characters"],
    },

    description: {
      type: String,
      required: [true, "Item description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    price: {
      type: Number,
      required: [true, "Item price is required"],
      min: [0, "Price cannot be negative"],
    },

    category: {
      type: String,
      required: [true, "Item category is required"],
      trim: true,
      enum: {
        values: [
          "pizza",
          "burgers",
          "salads",
          "pasta",
          "grills",
          "desserts",
          "drinks",
        ],
        message: "Please provide a valid category",
      },
    },

    preparationTime: {
      type: String,
      required: [true, "Preparation time is required"],
      trim: true,
    },

    available: {
      type: Boolean,
      default: true,
    },

    imageUrl: {
      type: String,
      trim: true,
    },

    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot be greater than 5"],
    },

    numReviews: {
      type: Number,
      default: 0,
      min: [0, "Reviews count cannot be negative"],
    },
  },
  {
    timestamps: true,
  },
);

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

module.exports = MenuItem;
