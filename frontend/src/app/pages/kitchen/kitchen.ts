import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { filter, interval } from 'rxjs';

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
    // by itself. interval() emits 0, 1, 2... every REFRESH_EVERY ms, and
    // filter() lets a tick through only while the tab is on screen, so a
    // board left open in a background tab stops asking the server for orders.
    const refresh = interval(REFRESH_EVERY)
      .pipe(filter(() => document.visibilityState === 'visible'))
      .subscribe(() => this.load());

    // DestroyRef keeps the cleanup next to the code that started it, and
    // stops the stream when the screen is left — otherwise it would go on
    // requesting orders for a page that is gone.
    this.destroyRef.onDestroy(() => refresh.unsubscribe());
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
      error: (error: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message);
      },
    });
  }

  protected setStatus(order: Order, status: OrderStatus): void {
    this.orderService.updateStatus(order._id, status).subscribe({
      next: () => this.load(),
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }
}
