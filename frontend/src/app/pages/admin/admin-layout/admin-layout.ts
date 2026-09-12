import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// The parent of every /admin/... page. The app's own <router-outlet> shows this
// component, and this component's <router-outlet> shows the child route that
// matched: the dashboard, users, menu, orders or reservations.
@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AdminLayout {}
