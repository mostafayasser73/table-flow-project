import { Component, EventEmitter, Input, Output } from '@angular/core';

import { MenuItem } from '../../../models/menu-item.model';

// The old way of talking between components, kept here for comparison.
// Everywhere else in this project uses input() and output() instead, which is
// what Angular 22 recommends.
@Component({
  selector: 'app-legacy-child',
  templateUrl: './legacy-child.html',
  styleUrl: './legacy-child.css',
})
export class LegacyChild {
  // Parent -> Child, the decorator way
  @Input() dish?: MenuItem;

  // an alias: the parent listens for (picked), not (dishSelected)
  @Output('picked') dishSelected = new EventEmitter<MenuItem>();

  select(): void {
    if (this.dish) {
      this.dishSelected.emit(this.dish);
    }
  }
}
