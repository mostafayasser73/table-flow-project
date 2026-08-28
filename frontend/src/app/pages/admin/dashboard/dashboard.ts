import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DashboardStats } from '../../../models/dashboard.model';
import { Order } from '../../../models/order.model';
import { User } from '../../../models/user.model';
import { DashboardService } from '../../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  protected readonly stats = signal<DashboardStats | null>(null);
  protected readonly errorMessage = signal('');

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next: (response) => this.stats.set(response.data),
      error: (error: HttpErrorResponse) =>
        this.errorMessage.set(
          error.error?.message ?? 'Could not load the dashboard',
        ),
    });
  }

  // the backend populates the customer on the recent orders
  protected customerName(order: Order): string {
    const user = order.user as User;
    return user?.firstName ? `${user.firstName} ${user.lastName}` : 'Customer';
  }
}
