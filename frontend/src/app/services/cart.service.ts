import { Injectable, computed, effect, signal } from '@angular/core';

import { CartLine } from '../models/order.model';
import { MenuItem } from '../models/menu-item.model';

const CART_KEY = 'tableflow_cart';

// The cart only lives in the browser. Nothing is sent to the backend until the
// customer presses Place Order, and even then only the dish ids and the
// quantities are sent — the backend looks the prices up itself.
@Injectable({ providedIn: 'root' })
export class CartService {
  // the signal itself stays private: nobody outside the service may replace
  // the cart, they can only read it and use the methods below
  private readonly _lines = signal<CartLine[]>(this.readStoredCart());

  readonly lines = this._lines.asReadonly();

  // how many dishes in total, for the badge in the navigation bar
  readonly count = computed(() =>
    this.lines().reduce((sum, line) => sum + line.quantity, 0),
  );

  readonly subtotal = computed(() =>
    this.lines().reduce(
      (sum, line) => sum + line.item.price * line.quantity,
      0,
    ),
  );

  constructor() {
    // Writing to localStorage is a side effect, not part of the state, so it
    // belongs in an effect. Angular runs it after every change of lines(),
    // which means no method has to remember to save.
    effect(() => {
      localStorage.setItem(CART_KEY, JSON.stringify(this.lines()));
    });
  }

  add(item: MenuItem, quantity = 1): void {
    const existing = this.lines().find((line) => line.item._id === item._id);

    if (existing) {
      // a new array, otherwise the signal keeps the same reference and
      // nothing that reads it is told about the change
      this._lines.update((lines) =>
        lines.map((line) =>
          line.item._id === item._id
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        ),
      );

      return;
    }

    this._lines.update((lines) => [...lines, { item, quantity }]);
  }

  setQuantity(itemId: string, quantity: number): void {
    if (quantity < 1) {
      this.remove(itemId);
      return;
    }

    this._lines.update((lines) =>
      lines.map((line) =>
        line.item._id === itemId ? { ...line, quantity } : line,
      ),
    );
  }

  remove(itemId: string): void {
    this._lines.update((lines) =>
      lines.filter((line) => line.item._id !== itemId),
    );
  }

  clear(): void {
    this._lines.set([]);
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
