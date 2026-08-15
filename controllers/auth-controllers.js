const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/user-model");
const deleteUploadedFile = require("../utils/delete-uploaded-file");

// creates the token that the client sends back with every request
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// POST /api/v1/auth/register  (Register Page)
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword } =
      req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({
        status: "fail",
        message: "Password and confirm password do not match",
      });
    }

    const existingUser = await User.findOne({ email: email?.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({
        status: "fail",
        message: "This email is already registered",
      });
    }

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: "customer",
      imageUrl: req.file?.filename,
    });

    // never send the password back to the client
    newUser.password = undefined;

    res.status(201).json({
      status: "success",
      message: "Account created successfully",
      data: {
        token: createToken(newUser._id),
        user: newUser,
      },
    });
  } catch (error) {
    if (req.file) {
      deleteUploadedFile("users", req.file.filename);
    }

    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// POST /api/v1/auth/login  (Login Page)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect email or password",
      });
    }

    const isCorrectPassword = await bcrypt.compare(password, user.password);

    if (!isCorrectPassword) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect email or password",
      });
    }

    if (user.status === "inactive") {
      return res.status(401).json({
        status: "fail",
        message: "This account is inactive",
      });
    }

    user.password = undefined;

    res.status(200).json({
      status: "success",
      message: "Logged in successfully",
      data: {
        token: createToken(user._id),
        user,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// GET /api/v1/auth/me  (User Profile header)
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// PATCH /api/v1/auth/me  (Edit Profile button)
const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // the user must not be able to change these from here
    delete req.body.role;
    delete req.body.status;
    delete req.body.password;

    if (req.file) {
      req.body.imageUrl = req.file.filename;
      if (user.imageUrl) deleteUploadedFile("users", user.imageUrl);
    }

    Object.assign(user, req.body);

    const updatedUser = await user.save();

    updatedUser.password = undefined;

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    if (req.file) {
      deleteUploadedFile("users", req.file.filename);
    }

    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// PATCH /api/v1/auth/change-password  (Profile > Settings tab)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: "fail",
        message: "New password and confirm password do not match",
      });
    }

    const user = await User.findById(req.user._id);

    const isCorrectPassword = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isCorrectPassword) {
      return res.status(401).json({
        status: "fail",
        message: "Your current password is incorrect",
      });
    }

    user.password = newPassword;

    // the pre("save") hook in the model hashes the new password
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
};
