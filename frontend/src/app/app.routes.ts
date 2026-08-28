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
  { path: '', component: Home },
  { path: 'menu', component: Menu },
  { path: 'menu/:id', component: ItemDetails },
  { path: 'cart', component: Cart },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },

  // ---- any logged in user ----
  {
    path: 'reservation',
    component: ReservationPage,
    canActivate: [authGuard],
  },
  { path: 'profile', component: Profile, canActivate: [authGuard] },

  // ---- management ----
  {
    path: 'admin',
    component: Dashboard,
    canActivate: [authGuard, roleGuard(UserRole.Admin, UserRole.Manager)],
  },
  {
    path: 'admin/users',
    component: Users,
    canActivate: [authGuard, roleGuard(UserRole.Admin, UserRole.Manager)],
  },
  {
    path: 'admin/menu',
    component: MenuManagement,
    canActivate: [authGuard, roleGuard(UserRole.Admin, UserRole.Manager)],
  },
  {
    path: 'admin/orders',
    component: Orders,
    canActivate: [
      authGuard,
      roleGuard(
        UserRole.Admin,
        UserRole.Manager,
        UserRole.Waiter,
        UserRole.Chef,
      ),
    ],
  },
  {
    path: 'admin/reservations',
    component: Reservations,
    canActivate: [
      authGuard,
      roleGuard(UserRole.Admin, UserRole.Manager, UserRole.Waiter),
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
  },
  {
    path: 'waiter',
    component: Waiter,
    canActivate: [authGuard, roleGuard(UserRole.Waiter)],
  },

  // anything that does not match a route above goes back to the home page
  { path: '**', redirectTo: '' },
];
