import { Injectable, signal } from '@angular/core';

// No providedIn here on purpose. A service with providedIn: 'root' has one
// instance for the whole app (that is how the cart is shared by every page).
// This one is only created when a component lists it in its own providers,
// and every such component gets a fresh copy.
@Injectable()
export class TallyService {
  private readonly total = signal(0);

  readonly count = this.total.asReadonly();

  increment(): void {
    this.total.update((value) => value + 1);
  }
}
