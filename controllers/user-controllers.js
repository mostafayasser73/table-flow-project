const User = require("../models/user-model");
const deleteUploadedFile = require("../utils/delete-uploaded-file");

// GET /api/v1/users  (Users Management page)
// supports: ?role=admin  ?status=active  ?search=mostafa  ?page=1&limit=10
const getAllUsers = async (req, res) => {
  try {
    const filter = {};

    if (req.query.role && req.query.role !== "all") {
      filter.role = req.query.role.toLowerCase();
    }

    if (req.query.status && req.query.status !== "all") {
      filter.status = req.query.status.toLowerCase();
    }

    // the search box on the Users Management page
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: "i" } },
        { lastName: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments(filter);

    res.status(200).json({
      status: "success",
      count: users.length,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      data: {
        users,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Failed to fetch users: ${error.message}`,
    });
  }
};

// GET /api/v1/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

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

// POST /api/v1/users  (+ Add User button)
const createUser = async (req, res) => {
  try {
    const role = req.body.role?.toLowerCase();

    const newUser = await User.create({
      ...req.body,
      role,
      imageUrl: req.file?.filename,
    });

    newUser.password = undefined;

    res.status(201).json({
      status: "success",
      message: "User added successfully",
      data: {
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

// PATCH /api/v1/users/:id  (Edit button)
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    if (req.body.role) req.body.role = req.body.role.toLowerCase();
    if (req.body.status) req.body.status = req.body.status.toLowerCase();

    if (req.file) {
      req.body.imageUrl = req.file.filename;
      if (user.imageUrl) deleteUploadedFile("users", user.imageUrl);
    }

    Object.assign(user, req.body);

    const updatedUser = await user.save();

    updatedUser.password = undefined;

    res.status(200).json({
      status: "success",
      message: "User updated successfully",
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

// DELETE /api/v1/users/:id  (Delete button)
const deleteUser = async (req, res) => {
  try {
    // an admin should not be able to delete their own account by mistake
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({
        status: "fail",
        message: "You cannot delete your own account",
      });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    if (deletedUser.imageUrl) {
      deleteUploadedFile("users", deletedUser.imageUrl);
    }

    deletedUser.password = undefined;

    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
      data: {
        user: deletedUser,
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
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
