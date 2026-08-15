const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    reservationNumber: {
      type: Number,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reservation must belong to a user"],
    },

    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [3, "Full name must be at least 3 characters long"],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    date: {
      type: Date,
      required: [true, "Reservation date is required"],
    },

    time: {
      type: String,
      required: [true, "Reservation time is required"],
      trim: true,
    },

    guests: {
      type: Number,
      required: [true, "Number of guests is required"],
      min: [1, "There must be at least 1 guest"],
      max: [20, "Number of guests cannot exceed 20"],
    },

    specialRequests: {
      type: String,
      trim: true,
      maxlength: [500, "Special requests cannot exceed 500 characters"],
    },

    tableNumber: {
      type: Number,
      min: [1, "Table number cannot be less than 1"],
    },

    status: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "cancelled"],
        message: "Status must be pending, confirmed, or cancelled",
      },
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

// Mongoose middleware (hook): give every new reservation a readable number.
// Same idea as the order number: continue from the highest number that
// was already used, so deleting a reservation cannot cause a duplicate.
reservationSchema.pre("save", async function () {
  if (!this.isNew) return;

  const lastReservation = await mongoose
    .model("Reservation")
    .find()
    .sort({ reservationNumber: -1 })
    .limit(1);

  this.reservationNumber =
    lastReservation.length > 0 ? lastReservation[0].reservationNumber + 1 : 201;
});

const Reservation = mongoose.model("Reservation", reservationSchema);

module.exports = Reservation;
