# Table Flow — Frontend (Angular + TypeScript)

The Angular client for the Table Flow restaurant system. It lives in the
`frontend/` folder of the project, talks to the Express backend over HTTP, and
never touches MongoDB directly.

Backend base URL: `http://localhost:5001/api/v1` (set in `src/app/api-config.ts`)

---

## How to run

The backend has to be running first, because every screen reads its data from it.

1. Start the backend, from the folder **above** this one:

```bash
cd .. && npm start
```

2. In a second terminal, install the frontend packages (only the first time):

```bash
npm install
```

3. Start the Angular development server:

```bash
npm start
```

Then open `http://localhost:4200`.

---

## Screens

### Customer

| Route | Page | Backend endpoints |
| ----- | ---- | ----------------- |
| `/` | Home — hero, categories, popular dishes | `GET /menu-items/popular`, `GET /menu-items/categories` |
| `/menu` | Menu with search, category pills and paging | `GET /menu-items` |
| `/menu/:id` | Dish details, reviews, write a review | `GET /menu-items/:id`, `GET`/`POST /menu-items/:id/reviews` |
| `/cart` | Cart and checkout | `POST /orders` |
| `/reservation` | Book a table | `POST /reservations` |
| `/profile` | My orders, my reservations, edit profile, change password | `GET /orders/my-orders`, `GET /reservations/my-reservations`, `PATCH /auth/me`, `PATCH /auth/change-password` |
| `/login`, `/signup` | Log in and create an account | `POST /auth/login`, `POST /auth/signup` |

### Staff

| Route | Page | Who can open it |
| ----- | ---- | --------------- |
| `/admin` | Dashboard: four cards and recent orders | admin, manager |
| `/admin/orders` | Orders with filters and the action buttons | admin, manager, waiter, chef |
| `/admin/reservations` | Confirm, seat and cancel reservations | admin, manager, waiter |
| `/admin/menu` | Add, edit, hide and delete dishes | admin, manager |
| `/admin/users` | Add, edit and delete accounts | admin, manager |
| `/kitchen` | Kitchen display: new orders and the pass | admin, manager, chef |
| `/waiter` | The waiter's own tables and orders to serve | waiter |

The navigation bar only shows the links the logged in role is allowed to open.

---

## How the token works

HTTP is stateless, so the backend does not remember who logged in. After a
successful login or signup the backend answers with a **JWT**, and the client has
to send it again with every protected request:

```text
Authorization: Bearer <token>
```

Three pieces make that happen:

| Piece | File | What it does |
| ----- | ---- | ------------ |
| Service | `services/auth.service.ts` | keeps the token and the user in **local storage**, so refreshing does not log the user out |
| Interceptor | `interceptors/auth-interceptor.ts` | adds the `Authorization` header to every request, so no service has to remember to |
| Guards | `guards/auth-guard.ts` | `authGuard` blocks a page when nobody is logged in, `roleGuard(...)` blocks it for the wrong role |

The guards only keep the screens tidy. **The real protection is on the server**,
because anything in the browser can be edited — the same roles are checked again
by `restrictTo()` in the backend.

Signup always creates a **customer**: the backend forces `role: "customer"`, so
nobody can make themselves an admin by registering. Staff accounts are created by
an admin from the Users page.

---

## Where the TypeScript topics are used

| Topic | Where |
| ----- | ----- |
| Interfaces | everything in `models/` |
| Enums | `UserRole`, `MenuCategory`, `OrderType`, `OrderStatus`, `ReservationStatus`, `TableStatus` |
| Generics | `ApiResponse<T>` and the paged versions built on top of it |
| Interface extension | `MenuItemsPage<T> extends PaginatedApiResponse<T>` |
| Optional properties (`?`) | `MenuFilters`, `User.phone`, `MenuItem.imageUrl` |
| Union types | `Partial<RestaurantTable>`, `User \| string` for a field the backend may populate |
| Classes | every component and service |
| Function return types | the service methods return `Observable<...>` |

Because every backend response has the same shape and only the part inside
`data` changes, one generic describes all of them:

```ts
export interface ApiResponse<T> {
  status: string;
  message?: string;
  data: T;
}
```

The list endpoints name their own total after what they count, so each one adds
that single field on top of the shared shape:

```ts
export interface UsersPage<T> extends PaginatedApiResponse<T> {
  totalUsers: number;
}
```

---

## Project structure

```text
frontend/
│
├── public/
│   ├── hero-restaurant.jpg
│   └── about-dining.jpg
│
├── src/
│   ├── app/
│   │   ├── models/
│   │   │   ├── api-response.model.ts
│   │   │   ├── dashboard.model.ts
│   │   │   ├── menu-item.model.ts
│   │   │   ├── order.model.ts
│   │   │   ├── reservation.model.ts
│   │   │   ├── review.model.ts
│   │   │   ├── table.model.ts
│   │   │   └── user.model.ts
│   │   │
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── cart.service.ts
│   │   │   ├── dashboard.service.ts
│   │   │   ├── menu.service.ts
│   │   │   ├── order.service.ts
│   │   │   ├── reservation.service.ts
│   │   │   ├── review.service.ts
│   │   │   ├── table.service.ts
│   │   │   └── user.service.ts
│   │   │
│   │   ├── guards/auth-guard.ts
│   │   ├── interceptors/auth-interceptor.ts
│   │   │
│   │   ├── pages/
│   │   │   ├── home/
│   │   │   ├── menu/
│   │   │   ├── item-details/
│   │   │   ├── cart/
│   │   │   ├── reservation/
│   │   │   ├── profile/
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── kitchen/
│   │   │   ├── waiter/
│   │   │   └── admin/
│   │   │       ├── dashboard/
│   │   │       ├── menu-management/
│   │   │       ├── orders/
│   │   │       ├── reservations/
│   │   │       └── users/
│   │   │
│   │   ├── api-config.ts
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   └── app.ts / app.html / app.css
│   │
│   ├── index.html
│   ├── main.ts
│   └── styles.css
│
├── angular.json
├── package.json
└── tsconfig.json
```

---

## Notes

- The backend already allows requests from another port (the CORS headers in its
  `index.js`), so no extra setup is needed.
- The cart lives only in the browser (local storage). When the order is placed
  only the dish ids and quantities are sent — the backend looks the prices up
  itself, so a customer cannot send their own prices.
- If the port in the backend `.env` is not `5001`, change `API_BASE_URL` in
  `src/app/api-config.ts`.
