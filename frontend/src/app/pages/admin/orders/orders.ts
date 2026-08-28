import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  Order,
  OrderStats,
  OrderStatus,
  OrderType,
} from '../../../models/order.model';
import { User, UserRole } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { OrderService } from '../../../services/order.service';

@Component({
  selector: 'app-orders',
  imports: [FormsModule, DatePipe],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);

  protected readonly statuses = Object.values(OrderStatus);
  protected readonly types = Object.values(OrderType);
  protected readonly OrderStatus = OrderStatus;

  protected readonly orders = signal<Order[]>([]);
  protected readonly stats = signal<OrderStats | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(false);

  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly totalOrders = signal(0);

  protected statusFilter = 'all';
  protected typeFilter = 'all';
  protected searchTerm = '';

  ngOnInit(): void {
    this.load();
    this.loadStats();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.orderService
      .getAllOrders({
        status: this.statusFilter,
        orderType: this.typeFilter,
        search: this.searchTerm.trim(),
        page: this.currentPage(),
      })
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.orders.set(response.data.orders);
          this.totalPages.set(response.totalPages);
          this.totalOrders.set(response.totalOrders);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            error.error?.message ?? 'Could not load the orders',
          );
        },
      });
  }

  protected onFilterChange(): void {
    this.currentPage.set(1);
    this.load();
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
    this.load();
  }

  protected customerName(order: Order): string {
    const user = order.user as User;
    return user?.firstName ? `${user.firstName} ${user.lastName}` : 'Customer';
  }

  // What the staff can do next, based on where the order is now.
  protected nextSteps(order: Order): OrderStatus[] {
    switch (order.status) {
      case OrderStatus.Pending:
        return [OrderStatus.Preparing, OrderStatus.Cancelled];
      case OrderStatus.Preparing:
        return [OrderStatus.Ready];
      case OrderStatus.Ready:
        return order.orderType === OrderType.DineIn
          ? [OrderStatus.Served]
          : [OrderStatus.Delivered];
      default:
        return [];
    }
  }

  protected setStatus(order: Order, status: OrderStatus): void {
    this.orderService.updateStatus(order._id, status).subscribe({
      next: () => {
        this.load();
        this.loadStats();
      },
      error: (error: HttpErrorResponse) =>
        this.errorMessage.set(
          error.error?.message ?? 'Could not update the order',
        ),
    });
  }

  protected deleteOrder(order: Order): void {
    if (!confirm(`Delete order #${order.orderNumber}?`)) {
      return;
    }

    this.orderService.deleteOrder(order._id).subscribe({
      next: () => this.load(),
      error: (error: HttpErrorResponse) =>
        this.errorMessage.set(error.error?.message ?? 'Could not delete'),
    });
  }

  protected get canDelete(): boolean {
    return this.authService.currentUser()?.role === UserRole.Admin;
  }

  private loadStats(): void {
    this.orderService.getStats().subscribe({
      next: (response) => this.stats.set(response.data),
      error: () => this.stats.set(null),
    });
  }
}
