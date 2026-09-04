import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { uploadedImage } from './api-config';
import { NavLink } from './models/nav-link.model';
import { UserRole } from './models/user.model';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { SiteFooter } from './components/site-footer/site-footer';
import { SiteHeader } from './components/site-header/site-header';

const STAFF_LINKS: NavLink[] = [
  {
    label: 'Dashboard',
    path: '/admin',
    roles: [UserRole.Admin, UserRole.Manager],
  },
  {
    label: 'Orders',
    path: '/admin/orders',
    roles: [UserRole.Admin, UserRole.Manager, UserRole.Waiter, UserRole.Chef],
  },
  {
    label: 'Reservations',
    path: '/admin/reservations',
    roles: [UserRole.Admin, UserRole.Manager, UserRole.Waiter],
  },
  {
    label: 'Menu admin',
    path: '/admin/menu',
    roles: [UserRole.Admin, UserRole.Manager],
  },
  {
    label: 'Users',
    path: '/admin/users',
    roles: [UserRole.Admin, UserRole.Manager],
  },
  {
    label: 'Kitchen',
    path: '/kitchen',
    roles: [UserRole.Admin, UserRole.Manager, UserRole.Chef],
  },
  { label: 'My section', path: '/waiter', roles: [UserRole.Waiter] },
];

// The root component only assembles the page: the header, the routed page,
// and the footer. The header is a child component, so everything it needs is
// passed down with property binding and it reports the log out back up.
@Component({
  imports: [RouterOutlet, SiteHeader, SiteFooter],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);

  // only the links this user is allowed to open
  protected readonly staffLinks = computed(() => {
    const role = this.authService.currentUser()?.role;

    if (!role) {
      return [];
    }

    return STAFF_LINKS.filter((link) => link.roles.includes(role));
  });

  protected readonly avatar = computed(() =>
    uploadedImage(
      'users',
      this.authService.currentUser()?.imageUrl ?? 'default-user.webp',
    ),
  );

  protected onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
