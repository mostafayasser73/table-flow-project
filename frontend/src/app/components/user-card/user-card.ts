import { Component, computed, input, output } from '@angular/core';

import { uploadedImage } from '../../api-config';
import { User } from '../../models/user.model';

// One account shown as a card in the Users screen. The card only displays a
// user and reports what the manager pressed; the page decides what happens.
@Component({
  selector: 'app-user-card',
  templateUrl: './user-card.html',
  styleUrl: './user-card.css',
})
export class UserCard {
  // Parent -> Child
  readonly user = input.required<User>();

  // deleting is only allowed for an admin, and never on their own account,
  // so the page works it out and tells the card
  readonly canDelete = input(false);

  // Child -> Parent
  readonly edit = output<User>();
  readonly remove = output<User>();

  protected readonly avatar = computed(() =>
    uploadedImage('users', this.user().imageUrl ?? 'default-user.webp'),
  );
}
