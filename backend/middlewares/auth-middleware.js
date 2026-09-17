const jwt = require("jsonwebtoken");
const User = require("../models/user-model");

// Middleware that runs before the route handler and makes sure
// the request contains a valid token (REST APIs are stateless, so the
// token must be sent with every request).
const protect = async (req, res, next) => {
  try {
    let token;

    // The client sends: Authorization: Bearer <token>
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in, please login first",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "This user no longer exists",
      });
    }

    if (currentUser.status === "inactive") {
      return res.status(401).json({
        status: "fail",
        message: "This account is inactive",
      });
    }

    // save the user on the request so the next handlers can use it
    req.user = currentUser;

    next();
  } catch (error) {
    res.status(401).json({
      status: "fail",
      message: "Invalid or expired token",
    });
  }
};

// Middleware that only allows certain roles to continue.
// Example: restrictTo("admin", "manager")
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

module.exports = { protect, restrictTo };
