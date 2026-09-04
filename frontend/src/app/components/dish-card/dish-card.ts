import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { uploadedImage } from '../../api-config';
import { MenuItem } from '../../models/menu-item.model';

// One dish on the Menu page. The card knows nothing about the server: the
// page above hands it a dish and listens for the Add to cart click, so the
// same card can be reused anywhere a dish has to be shown.
@Component({
  selector: 'app-dish-card',
  imports: [RouterLink],
  templateUrl: './dish-card.html',
  styleUrl: './dish-card.css',
})
export class DishCard {
  // Parent -> Child
  readonly item = input.required<MenuItem>();

  // true for a moment after the dish was added, so the button can say so
  readonly justAdded = input(false);

  // Child -> Parent: the page owns the cart, the card only reports the click
  readonly addToCart = output<MenuItem>();

  // derived from the input signal, so it follows the dish automatically
  protected readonly image = computed(() =>
    uploadedImage('menu-items', this.item().imageUrl),
  );
}
