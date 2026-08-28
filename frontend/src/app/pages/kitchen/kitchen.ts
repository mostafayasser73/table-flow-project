import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { Order, OrderStatus } from '../../models/order.model';
import { User } from '../../models/user.model';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-kitchen',
  imports: [DatePipe],
  templateUrl: './kitchen.html',
  styleUrl: './kitchen.css',
})
export class Kitchen implements OnInit {
  private readonly orderService = inject(OrderService);

  protected readonly OrderStatus = OrderStatus;

  protected readonly orders = signal<Order[]>([]);
  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(true);

  // the two columns of the Kitchen Display
  protected readonly pending = computed(() =>
    this.orders().filter((order) => order.status === OrderStatus.Pending),
  );

  protected readonly preparing = computed(() =>
    this.orders().filter((order) => order.status === OrderStatus.Preparing),
  );

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.orderService.getKitchenOrders().subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.orders.set(response.data.orders);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          error.error?.message ?? 'Could not load the kitchen orders',
        );
      },
    });
  }

  protected customerName(order: Order): string {
    const user = order.user as User;
    return user?.firstName ? `${user.firstName} ${user.lastName}` : 'Customer';
  }

  protected where(order: Order): string {
    if (order.tableNumber) {
      return `Table ${order.tableNumber}`;
    }

    return order.orderType;
  }

  protected setStatus(order: Order, status: OrderStatus): void {
    this.orderService.updateStatus(order._id, status).subscribe({
      next: () => this.load(),
      error: (error: HttpErrorResponse) =>
        this.errorMessage.set(error.error?.message ?? 'Could not update'),
    });
  }
}
