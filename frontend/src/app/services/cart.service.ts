import { Injectable, computed, signal } from '@angular/core';

import { CartLine } from '../models/order.model';
import { MenuItem } from '../models/menu-item.model';

const CART_KEY = 'tableflow_cart';

// The cart only lives in the browser. Nothing is sent to the backend until the
// customer presses Place Order, and even then only the dish ids and the
// quantities are sent — the backend looks the prices up itself.
@Injectable({ providedIn: 'root' })
export class CartService {
  readonly lines = signal<CartLine[]>(this.readStoredCart());

  // how many dishes in total, for the badge in the navigation bar
  readonly count = computed(() =>
    this.lines().reduce((sum, line) => sum + line.quantity, 0),
  );

  readonly subtotal = computed(() =>
    this.lines().reduce((sum, line) => sum + line.item.price * line.quantity, 0),
  );

  add(item: MenuItem, quantity = 1): void {
    const lines = [...this.lines()];
    const existing = lines.find((line) => line.item._id === item._id);

    if (existing) {
      existing.quantity += quantity;
    } else {
      lines.push({ item, quantity });
    }

    this.save(lines);
  }

  setQuantity(itemId: string, quantity: number): void {
    if (quantity < 1) {
      this.remove(itemId);
      return;
    }

    const lines = this.lines().map((line) =>
      line.item._id === itemId ? { ...line, quantity } : line,
    );

    this.save(lines);
  }

  remove(itemId: string): void {
    this.save(this.lines().filter((line) => line.item._id !== itemId));
  }

  clear(): void {
    this.save([]);
  }

  private save(lines: CartLine[]): void {
    this.lines.set(lines);
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  }

  private readStoredCart(): CartLine[] {
    const stored = localStorage.getItem(CART_KEY);

    if (!stored) {
      return [];
    }

    try {
      return JSON.parse(stored) as CartLine[];
    } catch {
      return [];
    }
  }
}
