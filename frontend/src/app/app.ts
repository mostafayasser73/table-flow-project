import { Component, computed, inject } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import { uploadedImage } from './api-config';
import { UserRole } from './models/user.model';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';

// one entry in the navigation bar, and the roles allowed to see it
interface NavLink {
  label: string;
  path: string;
  roles: UserRole[];
}

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

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
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

  protected avatar(): string {
    return uploadedImage(
      'users',
      this.authService.currentUser()?.imageUrl ?? 'default-user.webp',
    );
  }

  protected onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
