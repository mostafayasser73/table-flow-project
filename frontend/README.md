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
| Service | `services/auth.service.ts` | keeps the token and the user in **local storage**, so refreshing does not log the user out; decodes the token with **jwt-decode** to check `exp` (`isLoggedIn()`) and read the role (`getRole()`) |
| Auth interceptor | `interceptors/auth-interceptor.ts` | adds the `Authorization` header to every request, so no service has to remember to |
| Error interceptor | `interceptors/error-interceptor.ts` | turns every failed response into one `Error` with a readable message, and ends the session on a `401` for a request that carried a token |
| Guards | `guards/auth-guard.ts` | `authGuard` blocks a page when nobody is logged in, `roleGuard(...)` blocks it for the wrong role |

After logging in, each role lands on its own screen: admin and manager on
`/admin`, the chef on `/kitchen`, the waiter on `/waiter`, a customer on `/menu`
(unless a guard sent them to login with a `returnUrl`).

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
│   │   │   ├── nav-link.model.ts
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
│   │   ├── pages/lab/            every Angular concept, on the real data
│   │   │
│   │   ├── components/
│   │   │   ├── site-header/      navigation bar (input / output)
│   │   │   ├── site-footer/
│   │   │   ├── dish-card/        one dish on the menu
│   │   │   ├── order-ticket/     one ticket on the kitchen board
│   │   │   └── user-card/        one account in the card view
│   │   │
│   │   ├── directives/autofocus.ts
│   │   ├── guards/auth-guard.ts
│   │   ├── interceptors/
│   │   │   ├── auth-interceptor.ts
│   │   │   └── error-interceptor.ts
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
│   │   │       ├── admin-layout/  parent of the /admin child routes
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

---

## Where each Angular topic lives

| Topic | Where to look |
| --- | --- |
| Components split into a page | `app.html` with `site-header`, `site-footer` |
| `input()` / `output()` | `components/site-header`, `dish-card`, `order-ticket`, `user-card` |
| Content projection (`ng-content`) | `dish-card`, `user-card` |
| Data binding (`{{ }}`, `[ ]`, `( )`, `[( )]`) | every page; two-way binding in the toolbars and template-driven forms |
| `ngClass` | `components/order-ticket/order-ticket.html` |
| Control flow `@if` / `@else` | `app`, `menu`, `profile`, admin pages |
| `@for` with `track` and `@empty` | `menu`, `kitchen`, `home`, `waiter`, `item-details`, `dashboard` |
| `@switch` | `pages/admin/users` (table / card view), `pages/profile` (tabs) |
| Custom directive | `directives/autofocus.ts`, used in `menu` and `login` |
| Signals: `signal` / `computed` / `effect` | `services/cart.service.ts`, `services/auth.service.ts`, every page |
| Lifecycle: `ngOnInit` | most pages |
| Lifecycle: `ngOnChanges`, `ngOnDestroy` | `components/order-ticket` |
| Lifecycle: `ngAfterViewInit` + `viewChild` | `pages/admin/dashboard` (the canvas chart) |
| `DestroyRef` | `pages/kitchen` (the auto refresh timer) |
| `afterNextRender` | `directives/autofocus.ts` |
| Template-driven form | `pages/login`, `pages/reservation`, admin toolbars |
| Reactive form | `pages/admin/menu-management` (the add / edit dish panel) |
| Signal form | `pages/signup` (server errors land on the field) |
| Signal form: nested model, arrays, `submit()`, `applyEach` | `pages/lab` |
| Reactive form with `FormArray` | `pages/lab` |
| Legacy `*ngIf` / `*ngFor` / `*ngSwitch` | `pages/lab` (everywhere else uses `@if` / `@for` / `@switch`) |
| Legacy `@Input()` / `@Output()` + `EventEmitter` | `pages/lab/legacy-child` |
| Every lifecycle hook in order, `@ViewChild` / `@ContentChild` | `pages/lab/lifecycle-logger` |
| `ng-content select="..."` and fallback content | `pages/lab/slots-card` |
| `untracked()` and `effect(..., { manualCleanup: true })` | `pages/lab` |
| `ngStyle`, loop variables `$index $count $first $last $even $odd` | `pages/lab` |
| `asReadonly()` | `services/cart.service.ts` |
| Attribute binding `[attr.]` | `pages/admin/menu-management`, `pages/lab/legacy-child` |
| `titlecase` pipe | `pages/admin/menu-management` |
| Child routes (`children` + a nested `<router-outlet>`) | `app.routes.ts` under `admin`, `pages/admin/admin-layout` |
| Route `title` | every route in `app.routes.ts` |
| Guards returning a `UrlTree`, `returnUrl` | `guards/auth-guard.ts`, `pages/login` |
| Error interceptor (`catchError` / `throwError`) | `interceptors/error-interceptor.ts` |
| JWT decode, expiry check, `getRole()` | `services/auth.service.ts` |
| RxJS `map` / `retry` in a service | `services/menu.service.ts` (`getPopular`, `getCategories`) |
| RxJS `interval` / `filter` | `pages/kitchen` (refresh only while the tab is visible) |
| File upload with `FormData` | `pages/signup`, `pages/profile`, admin users and menu |
| Clearing a file input by hand (`viewChild` + `nativeElement`) | `pages/profile` |
| Component-level `providers` vs `providedIn: 'root'` | `pages/lab/tally-counter` |
| `new Observable` with `next` / `error` / `complete` | `pages/lab` |
| `HttpHeaders` | `pages/lab` |
