const jwt = require("jsonwebtoken");

// creates the token that the client sends back with every request.
// the token stores only the minimal information: the user id and the role.
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
};

module.exports = generateToken;
