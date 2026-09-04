import { DatePipe, NgClass } from '@angular/common';
import {
  Component,
  computed,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  input,
  output,
  signal,
} from '@angular/core';

import { Order } from '../../models/order.model';
import { User } from '../../models/user.model';

// One ticket on the Kitchen board. Besides showing the order it counts how
// long it has been waiting, which is the reason this component uses the
// lifecycle hooks: a ticket has to start a timer, react when a different
// order is put into it, and stop the timer before it is destroyed.
@Component({
  selector: 'app-order-ticket',
  imports: [DatePipe, NgClass],
  templateUrl: './order-ticket.html',
  styleUrl: './order-ticket.css',
})
export class OrderTicket implements OnInit, OnChanges, OnDestroy {
  // Parent -> Child
  readonly order = input.required<Order>();

  // the wording of the button changes between the two columns
  readonly actionLabel = input('Start preparing');
  readonly working = input(false);

  // Child -> Parent: the board owns the OrderService
  readonly advance = output<Order>();

  protected readonly waitingMinutes = signal(0);

  // minutes are fine for a fresh ticket, but an order from yesterday should
  // not say "waiting 8980 min"
  protected readonly waitingLabel = computed(() => {
    const minutes = this.waitingMinutes();

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} h ${minutes % 60} min`;
    }

    const days = Math.floor(hours / 24);

    return days === 1 ? '1 day' : `${days} days`;
  });

  private timerId?: number;

  // once, when the ticket appears on the board
  ngOnInit(): void {
    this.updateWaitingTime();

    // a ticket that says "waiting 3 min" must not still say so ten minutes
    // later, so the number is refreshed on its own
    this.timerId = window.setInterval(() => this.updateWaitingTime(), 30_000);
  }

  // Angular reuses the same ticket when the board reloads and a different
  // order takes this place, so the counter is recalculated for the new one.
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['order'] && !changes['order'].firstChange) {
      this.updateWaitingTime();
    }
  }

  // before the ticket leaves the board — without this the interval would keep
  // running for a component that is no longer on the page
  ngOnDestroy(): void {
    clearInterval(this.timerId);
  }

  protected customerName(): string {
    const user = this.order().user as User;
    return user?.firstName ? `${user.firstName} ${user.lastName}` : 'Customer';
  }

  protected where(): string {
    const order = this.order();
    return order.tableNumber ? `Table ${order.tableNumber}` : order.orderType;
  }

  private updateWaitingTime(): void {
    const placed = new Date(this.order().createdAt).getTime();
    const minutes = Math.floor((Date.now() - placed) / 60_000);

    this.waitingMinutes.set(Math.max(0, minutes));
  }
}
