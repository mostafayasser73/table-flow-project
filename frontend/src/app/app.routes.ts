import { Routes } from '@angular/router';

import { authGuard, roleGuard } from './guards/auth-guard';
import { UserRole } from './models/user.model';

import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';
import { Menu } from './pages/menu/menu';
import { ItemDetails } from './pages/item-details/item-details';
import { Cart } from './pages/cart/cart';
import { ReservationPage } from './pages/reservation/reservation';
import { Profile } from './pages/profile/profile';
import { AdminLayout } from './pages/admin/admin-layout/admin-layout';
import { Dashboard } from './pages/admin/dashboard/dashboard';
import { Users } from './pages/admin/users/users';
import { MenuManagement } from './pages/admin/menu-management/menu-management';
import { Orders } from './pages/admin/orders/orders';
import { Reservations } from './pages/admin/reservations/reservations';
import { Kitchen } from './pages/kitchen/kitchen';
import { Waiter } from './pages/waiter/waiter';

// The roles on each route are the same ones the backend checks with
// restrictTo(). Doing it here as well only keeps the screens tidy — the real
// protection is on the server, because anything in the browser can be edited.
export const routes: Routes = [
  // ---- open to everyone ----
  // title is what the browser tab shows while the page is open
  { path: '', component: Home, title: 'Table Flow' },
  { path: 'menu', component: Menu, title: 'Menu | Table Flow' },
  {
    path: 'menu/:id',
    component: ItemDetails,
    title: 'Dish details | Table Flow',
  },
  { path: 'cart', component: Cart, title: 'Your cart | Table Flow' },
  { path: 'login', component: Login, title: 'Log in | Table Flow' },
  // A page that demonstrates the Angular building blocks on the real data.
  // loadComponent keeps it out of the first download: the file is only
  // fetched when somebody opens /lab.
  {
    path: 'lab',
    loadComponent: () => import('./pages/lab/lab').then((m) => m.Lab),
    title: 'Angular lab | Table Flow',
  },
  { path: 'signup', component: Signup, title: 'Sign up | Table Flow' },

  // ---- any logged in user ----
  {
    path: 'reservation',
    component: ReservationPage,
    canActivate: [authGuard],
    title: 'Book a table | Table Flow',
  },
  {
    path: 'profile',
    component: Profile,
    canActivate: [authGuard],
    title: 'My profile | Table Flow',
  },

  // ---- management ----
  // One parent for every /admin/... page. The parent checks that somebody is
  // logged in once, and each child only adds the roles allowed on it.
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: Dashboard,
        canActivate: [roleGuard(UserRole.Admin, UserRole.Manager)],
        title: 'Dashboard | Table Flow',
      },
      {
        path: 'users',
        component: Users,
        canActivate: [roleGuard(UserRole.Admin, UserRole.Manager)],
        title: 'Users | Table Flow',
      },
      {
        path: 'menu',
        component: MenuManagement,
        canActivate: [roleGuard(UserRole.Admin, UserRole.Manager)],
        title: 'Menu admin | Table Flow',
      },
      {
        path: 'orders',
        component: Orders,
        canActivate: [
          roleGuard(
            UserRole.Admin,
            UserRole.Manager,
            UserRole.Waiter,
            UserRole.Chef,
          ),
        ],
        title: 'Orders | Table Flow',
      },
      {
        path: 'reservations',
        component: Reservations,
        canActivate: [
          roleGuard(UserRole.Admin, UserRole.Manager, UserRole.Waiter),
        ],
        title: 'Reservations | Table Flow',
      },
    ],
  },

  // ---- the two screens made for one job ----
  {
    path: 'kitchen',
    component: Kitchen,
    canActivate: [
      authGuard,
      roleGuard(UserRole.Admin, UserRole.Manager, UserRole.Chef),
    ],
    title: 'Kitchen | Table Flow',
  },
  {
    path: 'waiter',
    component: Waiter,
    canActivate: [authGuard, roleGuard(UserRole.Waiter)],
    title: 'My section | Table Flow',
  },

  // anything that does not match a route above goes back to the home page
  { path: '**', redirectTo: '' },
];
