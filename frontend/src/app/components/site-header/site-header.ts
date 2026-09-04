import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { User } from '../../models/user.model';
import { NavLink } from '../../models/nav-link.model';

// The navigation bar. Everything it shows is handed to it by the root
// component through input(), and the only thing it decides on its own is
// when to ask for a log out — which it reports back with output().
@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
})
export class SiteHeader {
  // Parent -> Child. required, because the header is useless without them.
  readonly staffLinks = input.required<NavLink[]>();

  // null while nobody is logged in
  readonly user = input<User | null>(null);

  readonly avatarUrl = input('');
  readonly cartCount = input(0);

  // Child -> Parent: the root component owns the AuthService and the Router
  readonly logout = output<void>();
}
