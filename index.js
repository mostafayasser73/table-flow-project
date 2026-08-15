require("dotenv").config();

const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const path = require("path");
const express = require("express");

const dbConnect = require("./config/db-connect");

const authRouter = require("./routes/auth-routes");
const userRouter = require("./routes/user-routes");
const menuItemRouter = require("./routes/menu-item-routes");
const reviewRouter = require("./routes/review-routes");
const orderRouter = require("./routes/order-routes");
const reservationRouter = require("./routes/reservation-routes");
const tableRouter = require("./routes/table-routes");
const dashboardRouter = require("./routes/dashboard-routes");

const app = express();

dbConnect();

// middleware that converts the incoming JSON into req.body
app.use(express.json());

// the Angular app runs on a different port, so it needs permission to call the API
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE");

  if (req.method === "OPTIONS") return res.sendStatus(200);

  next();
});

// simple logger middleware, runs before every route
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// serve the uploaded images as static files
app.use("/api/v1/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/menu-items", menuItemRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/reservations", reservationRouter);
app.use("/api/v1/tables", tableRouter);
app.use("/api/v1/dashboard", dashboardRouter);

// any url that does not match a route above
app.use((req, res) => {
  res.status(404).json({
    status: "fail",
    message: `This route does not exist: ${req.originalUrl}`,
  });
});

// error handling middleware (it has four parameters, so Express knows
// it should run whenever a route or a middleware passes an error)
app.use((error, req, res, next) => {
  console.log(error.message);

  res.status(400).json({
    status: "error",
    message: error.message,
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
