import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { Order, OrderStatus } from '../../models/order.model';
import { RestaurantTable, TableStatus } from '../../models/table.model';
import { User } from '../../models/user.model';
import { OrderService } from '../../services/order.service';
import { TableService } from '../../services/table.service';

@Component({
  selector: 'app-waiter',
  imports: [DatePipe],
  templateUrl: './waiter.html',
  styleUrl: './waiter.css',
})
export class Waiter implements OnInit {
  private readonly tableService = inject(TableService);
  private readonly orderService = inject(OrderService);

  protected readonly OrderStatus = OrderStatus;
  protected readonly TableStatus = TableStatus;

  protected readonly tables = signal<RestaurantTable[]>([]);
  protected readonly orders = signal<Order[]>([]);
  protected readonly readyToServe = signal(0);
  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.tableService.getMyTables().subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.tables.set(response.data.tables);
        this.orders.set(response.data.orders);
        this.readyToServe.set(response.readyToServe);
      },
      error: (error: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message);
      },
    });
  }

  protected customerName(order: Order): string {
    const user = order.user as User;
    return user?.firstName ? `${user.firstName} ${user.lastName}` : 'Customer';
  }

  protected markServed(order: Order): void {
    this.orderService.updateStatus(order._id, OrderStatus.Served).subscribe({
      next: () => this.load(),
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }

  // the waiter seats guests or clears a table from this screen
  protected setTableStatus(table: RestaurantTable, status: TableStatus): void {
    const changes: Partial<RestaurantTable> = { status };

    if (status === TableStatus.Available) {
      changes.currentGuests = 0;
    }

    this.tableService.updateTable(table._id, changes).subscribe({
      next: () => this.load(),
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }
}
