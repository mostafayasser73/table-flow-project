// Fills the database with some starting data so the screens are not empty.
// Run it with:  npm run seed

require("dotenv").config();

const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const dbConnect = require("../config/db-connect");

const User = require("../models/user-model");
const MenuItem = require("../models/menu-item-model");
const Table = require("../models/table-model");

const users = [
  {
    firstName: "Mostafa",
    lastName: "Yasser",
    email: "mostafa@example.com",
    phone: "+20 100 000 0000",
    password: "password123",
    role: "admin",
  },
  {
    firstName: "Ahmed",
    lastName: "Kamal",
    email: "ahmed@example.com",
    phone: "+20 100 000 0001",
    password: "password123",
    role: "manager",
  },
  {
    firstName: "Sara",
    lastName: "Hassan",
    email: "sara@example.com",
    phone: "+20 100 000 0002",
    password: "password123",
    role: "chef",
  },
  {
    firstName: "Omar",
    lastName: "Farouk",
    email: "omar@example.com",
    phone: "+20 100 000 0003",
    password: "password123",
    role: "waiter",
  },
  {
    firstName: "Nour",
    lastName: "Adel",
    email: "nour@example.com",
    phone: "+20 100 000 0004",
    password: "password123",
    role: "customer",
  },
];

const menuItems = [
  {
    name: "Margherita Pizza",
    description:
      "Classic tomato sauce, fresh mozzarella, basil. Baked in our stone oven at 450C for the perfect crispy crust.",
    price: 12.99,
    category: "pizza",
    preparationTime: "15-20 min",
  },
  {
    name: "Pepperoni Supreme",
    description: "Pepperoni, olives, bell peppers, onions",
    price: 14.49,
    category: "pizza",
    preparationTime: "15-20 min",
  },
  {
    name: "Classic Smash Burger",
    description: "Double patty, cheddar, pickles, secret sauce",
    price: 10.49,
    category: "burgers",
    preparationTime: "10-15 min",
  },
  {
    name: "Caesar Salad",
    description: "Romaine, croutons, parmesan, caesar dressing",
    price: 8.99,
    category: "salads",
    preparationTime: "5-10 min",
  },
  {
    name: "Creamy Alfredo",
    description: "Fettuccine, parmesan cream, grilled chicken",
    price: 14.99,
    category: "pasta",
    preparationTime: "15-20 min",
  },
  {
    name: "Grilled Ribeye",
    description: "300g ribeye, herb butter, roasted vegetables",
    price: 24.99,
    category: "grills",
    preparationTime: "20-25 min",
    available: false,
  },
  {
    name: "Chocolate Lava Cake",
    description: "Warm chocolate cake, vanilla ice cream",
    price: 7.99,
    category: "desserts",
    preparationTime: "10-15 min",
  },
  {
    name: "Fresh Lemonade",
    description: "Fresh squeezed lemons, mint, ice",
    price: 4.99,
    category: "drinks",
    preparationTime: "5 min",
  },
];

const seedDatabase = async () => {
  try {
    await dbConnect();

    // start from a clean database
    await User.deleteMany();
    await MenuItem.deleteMany();
    await Table.deleteMany();

    // create() is used one by one so the pre("save") hook hashes the passwords
    const createdUsers = [];

    for (const user of users) {
      createdUsers.push(await User.create(user));
    }

    await MenuItem.create(menuItems);

    const waiter = createdUsers.find((user) => user.role === "waiter");

    const tables = [];

    for (let number = 1; number <= 12; number++) {
      tables.push({
        tableNumber: number,
        capacity: number % 3 === 0 ? 6 : 4,
        assignedWaiter: number % 3 === 2 ? waiter._id : undefined,
      });
    }

    await Table.create(tables);

    console.log("Database seeded successfully");
    console.log("Login with: mostafa@example.com / password123");

    process.exit(0);
  } catch (error) {
    console.log(`Seeding Error: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
