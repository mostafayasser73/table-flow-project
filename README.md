# TableFlow — Restaurant Management System (MEAN)

The whole project lives in this repository:

| Part | Folder | Built with |
| ---- | ------ | ---------- |
| Backend REST API | the root | Node.js, Express, MongoDB, Mongoose |
| Frontend | [`frontend/`](frontend) | Angular, TypeScript |

The frontend talks to the backend over HTTP and never touches MongoDB itself.
Each part has its own `package.json`, so they are installed and started
separately — see [`frontend/README.md`](frontend/README.md) for the Angular side.

API base URL: `http://localhost:5001/api/v1`

---

## How to run

### The backend

1. Install the packages:

```bash
npm install
```

2. Create a `.env` file in the project root:

```env
PORT=5001
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/
DB_NAME=table-flow
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

To generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. Start the server:

```bash
npm start
```

The database already holds the restaurant's staff accounts, menu and tables, so
the API answers with real data straight away. Staff accounts are created by an
admin from the Users Management page; `POST /auth/signup` always creates a
customer.

The dish and profile pictures live under `uploads/`, and are served at
`/api/v1/uploads/...`.

### The frontend

In a second terminal, from the `frontend` folder:

```bash
cd frontend
npm install
npm start
```

Then open `http://localhost:4200`. The backend has to be running first, because
every screen reads its data from it.

---

## Authentication Module (Session 16 task)

### What the module does

It is the part of TableFlow that answers the two questions from the session:

- **Authentication — "who are you?"** A user signs up or logs in, the server checks the
  credentials, and returns a **JWT**. Because HTTP is stateless the server does not remember
  the user, so the client sends that token back with every following request.
- **Authorization — "what are you allowed to do?"** The token also carries the user role, and
  the `restrictTo` middleware decides which roles may reach which endpoint.

How it is built:

| Piece | File | What it does |
| ----- | ---- | ------------ |
| User model | `models/user-model.js` | fields, validation, and the `pre("save")` hook that hashes the password with **bcryptjs** |
| Token helper | `utils/get-jwt.js` | signs `{ id, role }` with `JWT_SECRET` using **jsonwebtoken** |
| Controllers | `controllers/auth-controllers.js` | signup, login, profile, change password |
| Route protection | `middlewares/auth-middleware.js` | `protect` verifies the token, `restrictTo` checks the role |
| Routes | `routes/auth-routes.js` | mounts everything under `/api/v1/auth` |

Two details worth pointing out:

- The password field is `select: false`, so it is **never** returned by a normal query. Login
  has to ask for it on purpose with `.select("+password")`.
- Passwords are stored hashed, never in plain text. `12345678` becomes `$2b$10$P5Q...`, and
  `bcrypt.compare()` is what checks a login.

### Chosen user roles

TableFlow is a restaurant system, so the roles follow the real staff of a restaurant:

| Role | What it is allowed to do |
| ---- | ------------------------ |
| `admin` | full control: users, menu, orders, reservations, tables, dashboard |
| `manager` | same day-to-day management as admin, without user management |
| `chef` | the Kitchen Display: sees pending/preparing orders and moves them forward |
| `waiter` | the Waiter Dashboard: only the tables assigned to them, and serving their orders |
| `customer` | browse the menu, place orders, book a reservation, manage their own profile |

`signup` always creates a `customer`. Staff accounts are created by an admin, so nobody can
make themselves an admin by registering.

### Routes

| Method | Endpoint | Access |
| ------ | -------- | ------ |
| POST | `/api/v1/auth/signup` | public |
| POST | `/api/v1/auth/login` | public |
| GET | `/api/v1/auth/me` | any logged in user |
| PATCH | `/api/v1/auth/me` | any logged in user |
| PATCH | `/api/v1/auth/change-password` | any logged in user |

#### Example 1 — Sign up

`POST /api/v1/auth/signup`

```json
{
  "firstName": "Mostafa",
  "lastName": "Yasser",
  "email": "mostafa.new@example.com",
  "phone": "01012345678",
  "password": "password123",
  "confirmPassword": "password123"
}
```

Response `201 Created`:

```json
{
  "status": "success",
  "message": "Account created successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "6721f0a3c8b1d2e4f5a60123",
      "firstName": "Mostafa",
      "lastName": "Yasser",
      "email": "mostafa.new@example.com",
      "role": "customer",
      "status": "active",
      "imageUrl": "default-user.webp"
    }
  }
}
```

To upload a profile picture at the same time, send the request as `form-data` instead of JSON
and add a file field named `imageUrl`.

#### Example 2 — Log in

`POST /api/v1/auth/login`

```json
{
  "email": "mostafa@example.com",
  "password": "password123"
}
```

Response `200 OK`:

```json
{
  "status": "success",
  "message": "Logged in successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "_id": "...", "email": "mostafa@example.com", "role": "admin" }
  }
}
```

With wrong credentials, `401 Unauthorized`:

```json
{
  "status": "fail",
  "message": "Incorrect email or password"
}
```

The same message is used for a wrong email and a wrong password on purpose, so the response
does not tell an attacker which email addresses exist.

#### Example 3 — Use the token on a protected route

`GET /api/v1/auth/me`

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Response `200 OK`:

```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "6721f0a3c8b1d2e4f5a60123",
      "firstName": "Mostafa",
      "email": "mostafa@example.com",
      "role": "admin"
    }
  }
}
```

Without the header, `401 Unauthorized`:

```json
{
  "status": "fail",
  "message": "You are not logged in, please login first"
}
```

#### Example 4 — Authorization, not just authentication

A logged-in `customer` sending `POST /api/v1/menu-items` is authenticated but not allowed:

```json
{
  "status": "fail",
  "message": "You do not have permission to perform this action"
}
```

Status `403 Forbidden` — the token is valid, the role is wrong. That is the difference between
authentication (401) and authorization (403).

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
│   ├── get-jwt.js
│   └── delete-uploaded-file.js
│
├── uploads/          (Multer writes new uploads here)
│   ├── users/
│   └── menu-items/
│
├── frontend/         (the Angular app — see frontend/README.md)
│   ├── src/
│   ├── public/
│   ├── angular.json
│   └── package.json
│
├── .env
├── .gitignore
├── index.js
└── package.json
```

`frontend/` keeps its own `package.json` and `.gitignore`, so its
`node_modules` and `dist` are never committed.

---

## Sending the token

Every protected route needs the token returned by signup or login:

```text
Authorization: Bearer <token>
```

---

## API Endpoints

### Auth — `/api/v1/auth`

| Method | Endpoint | Access | Screen |
| ------ | -------- | ------ | ------ |
| POST | `/signup` | public | 02 Register Page |
| POST | `/login` | public | 01 Login Page |
| GET | `/me` | logged in | 08 User Profile |
| PATCH | `/me` | logged in | 08 Edit Profile |
| PATCH | `/change-password` | logged in | 08 Settings tab |

`signup` and `PATCH /me` accept `form-data` with an `imageUrl` file field.

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
http://localhost:5001/api/v1/uploads/users/user-1753456789012.png
http://localhost:5001/api/v1/uploads/menu-items/item-1753456789012.png
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
