import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { OrderTicket } from '../../components/order-ticket/order-ticket';
import { Order, OrderStatus } from '../../models/order.model';
import { OrderService } from '../../services/order.service';

// how often the board asks the server for new tickets
const REFRESH_EVERY = 15_000;

@Component({
  selector: 'app-kitchen',
  imports: [OrderTicket],
  templateUrl: './kitchen.html',
  styleUrl: './kitchen.css',
})
export class Kitchen implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);

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

  constructor() {
    // Nobody stands next to the screen pressing Refresh, so the board polls
    // by itself. DestroyRef keeps the timer next to the code that started it,
    // and stops it when the screen is left — otherwise the interval would go
    // on requesting orders for a page that is gone.
    const timerId = window.setInterval(() => this.load(), REFRESH_EVERY);

    this.destroyRef.onDestroy(() => clearInterval(timerId));
  }

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

  protected setStatus(order: Order, status: OrderStatus): void {
    this.orderService.updateStatus(order._id, status).subscribe({
      next: () => this.load(),
      error: (error: HttpErrorResponse) =>
        this.errorMessage.set(error.error?.message ?? 'Could not update'),
    });
  }
}
