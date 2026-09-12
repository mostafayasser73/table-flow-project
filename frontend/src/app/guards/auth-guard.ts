import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

// Stops a page from opening when nobody is logged in.
// This is only about the screens: the backend checks the token again anyway.
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // remember where the user wanted to go, so login can send them back
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

// Stops a page from opening when the logged in user has the wrong role.
// Used as: canActivate: [authGuard, roleGuard(UserRole.Admin, UserRole.Manager)]
export const roleGuard = (...roles: UserRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // the role is read from the token, the same place the backend reads it
    const role = authService.getRole();

    if (role && roles.includes(role)) {
      return true;
    }

    return router.createUrlTree(['/menu']);
  };
};
