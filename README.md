# TableFlow — Backend (Node.js + Express + MongoDB + Mongoose)

Backend REST API for the TableFlow restaurant system.

Base URL: `http://localhost:5000/api/v1`

---

## How to run

1. Install the packages:

```bash
npm install
```

2. Create a `.env` file in the project root:

```env
PORT=5000
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/
DB_NAME=table-flow
JWT_SECRET=your_secret_key
```

3. Fill the database with starting data (users, menu items, tables):

```bash
npm run seed
```

4. Start the server:

```bash
npm start
```

Accounts created by the seed (all with the password `password123`):

| Email | Role |
| ----- | ---- |
| mostafa@example.com | admin |
| ahmed@example.com | manager |
| sara@example.com | chef |
| omar@example.com | waiter |
| nour@example.com | customer |

---

## Project structure

```text
backend project/
│
├── config/
│   └── db-connect.js
│
├── controllers/
│   ├── auth-controllers.js
│   ├── user-controllers.js
│   ├── menu-item-controllers.js
│   ├── review-controllers.js
│   ├── order-controllers.js
│   ├── reservation-controllers.js
│   ├── table-controllers.js
│   └── dashboard-controllers.js
│
├── models/
│   ├── user-model.js
│   ├── menu-item-model.js
│   ├── review-model.js
│   ├── order-model.js
│   ├── reservation-model.js
│   └── table-model.js
│
├── routes/
│   ├── auth-routes.js
│   ├── user-routes.js
│   ├── menu-item-routes.js
│   ├── review-routes.js
│   ├── order-routes.js
│   ├── reservation-routes.js
│   ├── table-routes.js
│   └── dashboard-routes.js
│
├── middlewares/
│   ├── auth-middleware.js
│   └── multer-middleware.js
│
├── utils/
│   └── delete-uploaded-file.js
│
├── data/
│   └── seed.js
│
├── uploads/          (created automatically by Multer)
│   ├── users/
│   └── menu-items/
│
├── .env
├── .gitignore
├── index.js
└── package.json
```

---

## Sending the token

Every protected route needs the token returned by login or register:

```text
Authorization: Bearer <token>
```

---

## API Endpoints

### Auth — `/api/v1/auth`

| Method | Endpoint | Access | Screen |
| ------ | -------- | ------ | ------ |
| POST | `/register` | public | 02 Register Page |
| POST | `/login` | public | 01 Login Page |
| GET | `/me` | logged in | 08 User Profile |
| PATCH | `/me` | logged in | 08 Edit Profile |
| PATCH | `/change-password` | logged in | 08 Settings tab |

`register` and `PATCH /me` accept `form-data` with an `imageUrl` file field.

### Menu Items — `/api/v1/menu-items`

| Method | Endpoint | Access | Screen |
| ------ | -------- | ------ | ------ |
| GET | `/` | public | 04 Menu Page, 11 Menu Management |
| GET | `/popular` | public | 03 Popular Items |
| GET | `/categories` | public | 03 Browse by Category |
| GET | `/:id` | public | 05 Item Details |
| POST | `/` | admin, manager | 12 Add Item |
| PATCH | `/:id` | admin, manager | 12 Edit Item, 11 Available toggle |
| DELETE | `/:id` | admin, manager | 11 Delete button |

Query parameters on `GET /`:
`?category=pizza` `?search=burger` `?available=true` `?page=1&limit=8`

### Reviews

| Method | Endpoint | Access | Screen |
| ------ | -------- | ------ | ------ |
| GET | `/menu-items/:id/reviews` | public | 05 Customer Reviews |
| POST | `/menu-items/:id/reviews` | logged in | 05 Customer Reviews |
| DELETE | `/reviews/:id` | owner or admin | — |

### Orders — `/api/v1/orders`

| Method | Endpoint | Access | Screen |
| ------ | -------- | ------ | ------ |
| POST | `/` | logged in | 06 Place Order |
| GET | `/my-orders` | logged in | 08 My Orders tab |
| GET | `/` | staff | 13 Orders Dashboard |
| GET | `/stats` | admin, manager | 13 the four cards |
| GET | `/kitchen` | admin, manager, chef | 15 Kitchen Display |
| GET | `/:id` | owner or staff | — |
| PATCH | `/:id/status` | staff | 13 / 15 / 16 action buttons |
| DELETE | `/:id` | admin | — |

Query parameters on `GET /`:
`?status=pending` `?orderType=delivery` `?search=1042` `?page=1&limit=10`

### Reservations — `/api/v1/reservations`

| Method | Endpoint | Access | Screen |
| ------ | -------- | ------ | ------ |
| POST | `/` | logged in | 07 Confirm Reservation |
| GET | `/my-reservations` | logged in | 08 My Reservations tab |
| GET | `/` | admin, manager, waiter | 14 Reservations Management |
| GET | `/:id` | owner or staff | — |
| PATCH | `/:id/status` | staff (customer may cancel) | 14 Confirm / Reject / Cancel |
| DELETE | `/:id` | admin, manager | — |

Query parameters on `GET /`:
`?status=pending` `?filter=today|tomorrow|week` `?search=mostafa`

### Tables — `/api/v1/tables`

| Method | Endpoint | Access | Screen |
| ------ | -------- | ------ | ------ |
| GET | `/my-tables` | waiter | 16 Waiter Dashboard |
| GET | `/` | admin, manager, waiter | — |
| POST | `/` | admin, manager | — |
| GET | `/:id` | admin, manager, waiter | — |
| PATCH | `/:id` | admin, manager, waiter | — |
| DELETE | `/:id` | admin, manager | — |

### Users — `/api/v1/users`

| Method | Endpoint | Access | Screen |
| ------ | -------- | ------ | ------ |
| GET | `/` | admin, manager | 10 Users Management |
| POST | `/` | admin, manager | 10 + Add User |
| GET | `/:id` | admin, manager | — |
| PATCH | `/:id` | admin, manager | 10 Edit button |
| DELETE | `/:id` | admin | 10 Delete button |

Query parameters on `GET /`:
`?role=waiter` `?status=active` `?search=sara` `?page=1&limit=10`

### Dashboard — `/api/v1/dashboard`

| Method | Endpoint | Access | Screen |
| ------ | -------- | ------ | ------ |
| GET | `/stats` | admin, manager | 09 Admin Dashboard |

### Uploaded images

```text
http://localhost:5000/api/v1/uploads/users/user-1753456789012.png
http://localhost:5000/api/v1/uploads/menu-items/item-1753456789012.png
```

---

## Response format

Every endpoint answers with the same shape:

```json
{
  "status": "success",
  "count": 8,
  "data": {
    "menuItems": []
  }
}
```

On an error:

```json
{
  "status": "fail",
  "message": "Menu item not found"
}
```

Status codes used: `200` OK, `201` Created, `400` Bad Request,
`401` Unauthorized, `403` Forbidden, `404` Not Found.
