const MenuItem = require("../models/menu-item-model");
const deleteUploadedFile = require("../utils/delete-uploaded-file");

// GET /api/v1/menu-items  (Menu Page + Menu Management page)
// supports: ?category=pizza  ?search=burger  ?available=true  ?page=1&limit=8
const getAllMenuItems = async (req, res) => {
  try {
    const filter = {};

    // the category pills: All / Pizza / Burgers / ...
    if (req.query.category && req.query.category.toLowerCase() !== "all") {
      filter.category = req.query.category.toLowerCase();
    }

    // the "Search menu..." box
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // the public Menu Page only shows the available items
    if (req.query.available) {
      filter.available = req.query.available === "true";
    }

    const page = +req.query.page || 1;
    const limit = +req.query.limit || 8;
    const skip = (page - 1) * limit;

    const menuItems = await MenuItem.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalItems = await MenuItem.countDocuments(filter);

    res.status(200).json({
      status: "success",
      count: menuItems.length,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
      data: {
        menuItems,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Failed to fetch menu items: ${error.message}`,
    });
  }
};

// GET /api/v1/menu-items/popular  (Popular Items section on the Home Page)
const getPopularMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ available: true })
      .sort({ rating: -1, numReviews: -1 })
      .limit(4);

    res.status(200).json({
      status: "success",
      count: menuItems.length,
      data: {
        menuItems,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// GET /api/v1/menu-items/categories  (Browse by Category section)
const getCategories = async (req, res) => {
  try {
    const categories = [
      "pizza",
      "burgers",
      "salads",
      "pasta",
      "grills",
      "desserts",
      "drinks",
    ];

    res.status(200).json({
      status: "success",
      count: categories.length,
      data: {
        categories,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// GET /api/v1/menu-items/:id  (Item Details page)
const getMenuItemById = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        status: "fail",
        message: "Menu item not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        menuItem,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// POST /api/v1/menu-items  (Add New Menu Item page)
const createMenuItem = async (req, res) => {
  try {
    const category = req.body.category?.toLowerCase();

    const newMenuItem = await MenuItem.create({
      ...req.body,
      category,
      imageUrl: req.file?.filename,
    });

    res.status(201).json({
      status: "success",
      message: "Menu item added successfully",
      data: {
        menuItem: newMenuItem,
      },
    });
  } catch (error) {
    if (req.file) {
      deleteUploadedFile("menu-items", req.file.filename);
    }

    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// PATCH /api/v1/menu-items/:id  (Edit Item page + the Available toggle)
const updateMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        status: "fail",
        message: "Menu item not found",
      });
    }

    if (req.body.category) {
      req.body.category = req.body.category.toLowerCase();
    }

    if (req.file) {
      req.body.imageUrl = req.file.filename;
      if (menuItem.imageUrl) {
        deleteUploadedFile("menu-items", menuItem.imageUrl);
      }
    }

    Object.assign(menuItem, req.body);

    const updatedMenuItem = await menuItem.save();

    res.status(200).json({
      status: "success",
      message: "Menu item updated successfully",
      data: {
        menuItem: updatedMenuItem,
      },
    });
  } catch (error) {
    if (req.file) {
      deleteUploadedFile("menu-items", req.file.filename);
    }

    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// DELETE /api/v1/menu-items/:id  (Delete button on Menu Management)
const deleteMenuItem = async (req, res) => {
  try {
    const deletedMenuItem = await MenuItem.findByIdAndDelete(req.params.id);

    if (!deletedMenuItem) {
      return res.status(404).json({
        status: "fail",
        message: "Menu item not found",
      });
    }

    if (deletedMenuItem.imageUrl) {
      deleteUploadedFile("menu-items", deletedMenuItem.imageUrl);
    }

    res.status(200).json({
      status: "success",
      message: "Menu item deleted successfully",
      data: {
        menuItem: deletedMenuItem,
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
  getAllMenuItems,
  getPopularMenuItems,
  getCategories,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
