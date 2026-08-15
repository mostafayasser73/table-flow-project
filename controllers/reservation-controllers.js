const Reservation = require("../models/reservation-model");
const Table = require("../models/table-model");

// GET /api/v1/reservations  (Reservations Management page)
// supports: ?status=pending  ?filter=today|tomorrow|week  ?search=mostafa
const getAllReservations = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status && req.query.status.toLowerCase() !== "all") {
      filter.status = req.query.status.toLowerCase();
    }

    // the Today / Tomorrow / This Week pills
    if (req.query.filter) {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);

      if (req.query.filter === "today") {
        endDate.setDate(endDate.getDate() + 1);
      } else if (req.query.filter === "tomorrow") {
        startDate.setDate(startDate.getDate() + 1);
        endDate.setDate(endDate.getDate() + 2);
      } else if (req.query.filter === "week") {
        endDate.setDate(endDate.getDate() + 7);
      }

      filter.date = { $gte: startDate, $lt: endDate };
    }

    if (req.query.search) {
      filter.fullName = { $regex: req.query.search, $options: "i" };
    }

    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const skip = (page - 1) * limit;

    const reservations = await Reservation.find(filter)
      .populate("user", "firstName lastName email")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const totalReservations = await Reservation.countDocuments(filter);

    res.status(200).json({
      status: "success",
      count: reservations.length,
      totalReservations,
      totalPages: Math.ceil(totalReservations / limit),
      currentPage: page,
      data: {
        reservations,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Failed to fetch reservations: ${error.message}`,
    });
  }
};

// GET /api/v1/reservations/my-reservations  (Profile > My Reservations tab)
const getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id }).sort({
      date: -1,
    });

    res.status(200).json({
      status: "success",
      count: reservations.length,
      data: {
        reservations,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// GET /api/v1/reservations/:id
const getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate(
      "user",
      "firstName lastName email",
    );

    if (!reservation) {
      return res.status(404).json({
        status: "fail",
        message: "Reservation not found",
      });
    }

    if (
      req.user.role === "customer" &&
      String(reservation.user._id) !== String(req.user._id)
    ) {
      return res.status(403).json({
        status: "fail",
        message: "You can only view your own reservations",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        reservation,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// POST /api/v1/reservations  (Confirm Reservation button)
const createReservation = async (req, res) => {
  try {
    const reservationDate = new Date(req.body.date);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
      return res.status(400).json({
        status: "fail",
        message: "You cannot reserve a table in the past",
      });
    }

    const newReservation = await Reservation.create({
      user: req.user._id,
      fullName: req.body.fullName,
      phone: req.body.phone,
      date: reservationDate,
      time: req.body.time,
      guests: req.body.guests,
      specialRequests: req.body.specialRequests,
    });

    res.status(201).json({
      status: "success",
      message: "Reservation created successfully",
      data: {
        reservation: newReservation,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// PATCH /api/v1/reservations/:id/status  (Confirm / Reject / Cancel buttons)
const updateReservationStatus = async (req, res) => {
  try {
    const status = req.body.status?.toLowerCase();

    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        status: "fail",
        message: "Reservation not found",
      });
    }

    // a customer is only allowed to cancel their own reservation
    if (req.user.role === "customer") {
      if (String(reservation.user) !== String(req.user._id)) {
        return res.status(403).json({
          status: "fail",
          message: "You can only change your own reservations",
        });
      }

      if (status !== "cancelled") {
        return res.status(403).json({
          status: "fail",
          message: "You can only cancel your reservation",
        });
      }
    }

    reservation.status = status;

    if (req.body.tableNumber) {
      reservation.tableNumber = req.body.tableNumber;
    }

    const updatedReservation = await reservation.save();

    // keep the table status in sync with the reservation.
    // a confirmed reservation also tells the Waiter View how many guests
    // are expected on that table, and cancelling it clears the count again.
    if (updatedReservation.tableNumber) {
      await Table.findOneAndUpdate(
        { tableNumber: updatedReservation.tableNumber },
        {
          status: status === "confirmed" ? "reserved" : "available",
          currentGuests:
            status === "confirmed" ? updatedReservation.guests : 0,
        },
        { runValidators: true },
      );
    }

    res.status(200).json({
      status: "success",
      message: "Reservation status updated successfully",
      data: {
        reservation: updatedReservation,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// DELETE /api/v1/reservations/:id
const deleteReservation = async (req, res) => {
  try {
    const deletedReservation = await Reservation.findByIdAndDelete(
      req.params.id,
    );

    if (!deletedReservation) {
      return res.status(404).json({
        status: "fail",
        message: "Reservation not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Reservation deleted successfully",
      data: {
        reservation: deletedReservation,
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
  getAllReservations,
  getMyReservations,
  getReservationById,
  createReservation,
  updateReservationStatus,
  deleteReservation,
};
