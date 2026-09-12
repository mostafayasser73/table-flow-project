import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { DashboardStats } from '../../../models/dashboard.model';
import { Order, OrderStatus } from '../../../models/order.model';
import { User } from '../../../models/user.model';
import { DashboardService } from '../../../services/dashboard.service';

// the colours of the bars, one per status
const STATUS_COLOURS: Record<string, string> = {
  [OrderStatus.Pending]: '#e0a800',
  [OrderStatus.Preparing]: '#2b7cd3',
  [OrderStatus.Ready]: '#2e9e5b',
  [OrderStatus.Served]: '#6c757d',
  [OrderStatus.Delivered]: '#6c757d',
  [OrderStatus.Cancelled]: '#c62828',
};

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, AfterViewInit {
  private readonly dashboardService = inject(DashboardService);

  protected readonly stats = signal<DashboardStats | null>(null);
  protected readonly errorMessage = signal('');

  // the <canvas> in this component's own template
  private readonly chart = viewChild<ElementRef<HTMLCanvasElement>>('chart');

  // how many of the recent orders sit in each status
  private readonly byStatus = computed(() => {
    const orders = this.stats()?.recentOrders ?? [];
    const counts = new Map<string, number>();

    for (const order of orders) {
      counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
    }

    return [...counts.entries()];
  });

  constructor() {
    // the numbers arrive after the first paint, so the chart is drawn again
    // whenever they change
    effect(() => {
      this.byStatus();
      this.drawChart();
    });
  }

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next: (response) => this.stats.set(response.data),
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }

  // the canvas only exists once the template has been rendered, which is
  // exactly what this hook is for
  ngAfterViewInit(): void {
    this.drawChart();
  }

  // the backend populates the customer on the recent orders
  protected customerName(order: Order): string {
    const user = order.user as User;
    return user?.firstName ? `${user.firstName} ${user.lastName}` : 'Customer';
  }

  private drawChart(): void {
    const canvas = this.chart()?.nativeElement;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) {
      return;
    }

    const bars = this.byStatus();

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (bars.length === 0) {
      return;
    }

    const highest = Math.max(...bars.map(([, count]) => count));
    const slot = canvas.width / bars.length;
    const bottom = canvas.height - 22;

    bars.forEach(([status, count], index) => {
      const height = (count / highest) * (bottom - 10);
      const x = index * slot + slot * 0.2;
      const width = slot * 0.6;

      context.fillStyle = STATUS_COLOURS[status] ?? '#6c757d';
      context.fillRect(x, bottom - height, width, height);

      context.fillStyle = '#6c757d';
      context.font = '11px system-ui, sans-serif';
      context.textAlign = 'center';
      context.fillText(
        `${status} (${count})`,
        x + width / 2,
        canvas.height - 6,
      );
    });
  }
}
