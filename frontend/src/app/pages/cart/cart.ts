import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { uploadedImage } from '../../api-config';
import { CartLine, NewOrder, OrderType } from '../../models/order.model';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';

// The same numbers the backend uses when it works out the total.
// They are only shown here: the backend calculates the real amounts itself.
const TAX_RATE = 0.14;
const DELIVERY_FEE = 25;

@Component({
  selector: 'app-cart',
  imports: [FormsModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  protected readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly OrderType = OrderType;

  protected orderType: OrderType = OrderType.Delivery;
  protected deliveryAddress = '';
  protected tableNumber?: number;

  protected readonly errorMessage = signal('');
  protected readonly isPlacing = signal(false);

  protected readonly deliveryFee = computed(() =>
    this.orderType === OrderType.Delivery ? DELIVERY_FEE : 0,
  );

  protected readonly tax = computed(
    () => Math.round(this.cartService.subtotal() * TAX_RATE * 100) / 100,
  );

  protected readonly total = computed(
    () => this.cartService.subtotal() + this.deliveryFee() + this.tax(),
  );

  protected dishImage(line: CartLine): string {
    return uploadedImage('menu-items', line.item.imageUrl);
  }

  protected onQuantityChange(itemId: string, value: string): void {
    this.cartService.setQuantity(itemId, Number(value));
  }

  protected placeOrder(): void {
    this.errorMessage.set('');

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/cart' },
      });
      return;
    }

    const order: NewOrder = {
      items: this.cartService.lines().map((line) => ({
        menuItem: line.item._id,
        quantity: line.quantity,
      })),
      orderType: this.orderType,
      deliveryAddress:
        this.orderType === OrderType.Delivery ? this.deliveryAddress : undefined,
      tableNumber:
        this.orderType === OrderType.DineIn ? this.tableNumber : undefined,
    };

    this.isPlacing.set(true);

    this.orderService.createOrder(order).subscribe({
      next: () => {
        this.isPlacing.set(false);
        this.cartService.clear();
        this.router.navigate(['/profile'], {
          queryParams: { tab: 'orders' },
        });
      },
      error: (error: Error) => {
        this.isPlacing.set(false);
        this.errorMessage.set(error.message);
      },
    });
  }
}
