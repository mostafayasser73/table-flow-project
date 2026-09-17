const express = require("express");

const reservationControllers = require("../controllers/reservation-controllers");
const { protect, restrictTo } = require("../middlewares/auth-middleware");

const router = express.Router();

router.use(protect);

router.get("/my-reservations", reservationControllers.getMyReservations);

router
  .route("/")
  .get(
    restrictTo("admin", "manager", "waiter"),
    reservationControllers.getAllReservations,
  )
  .post(reservationControllers.createReservation);

// the staff on the Reservations Management page can confirm / reject / cancel,
// and a customer is allowed in here only to cancel their own reservation
// (the controller checks that). A chef never works with reservations.
router.patch(
  "/:id/status",
  restrictTo("admin", "manager", "waiter", "customer"),
  reservationControllers.updateReservationStatus,
);

router
  .route("/:id")
  .get(reservationControllers.getReservationById)
  .delete(restrictTo("admin", "manager"), reservationControllers.deleteReservation);

module.exports = router;
