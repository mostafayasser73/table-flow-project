import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { uploadedImage } from '../../api-config';
import { MenuItem } from '../../models/menu-item.model';
import { Review } from '../../models/review.model';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { MenuService } from '../../services/menu.service';
import { ReviewService } from '../../services/review.service';

@Component({
  selector: 'app-item-details',
  imports: [FormsModule, RouterLink],
  templateUrl: './item-details.html',
  styleUrl: './item-details.css',
})
export class ItemDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly menuService = inject(MenuService);
  private readonly reviewService = inject(ReviewService);
  private readonly cartService = inject(CartService);
  protected readonly authService = inject(AuthService);

  protected readonly item = signal<MenuItem | null>(null);
  protected readonly reviews = signal<Review[]>([]);
  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(true);

  protected quantity = 1;
  protected readonly addedMessage = signal('');

  // the "Write a review" form
  protected newReview = { rating: 5, comment: '' };
  protected readonly reviewError = signal('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      return;
    }

    this.menuService.getMenuItemById(id).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.item.set(response.data.menuItem);
      },
      error: (error: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message);
      },
    });

    this.loadReviews(id);
  }

  protected dishImage(item: MenuItem): string {
    return uploadedImage('menu-items', item.imageUrl);
  }

  protected reviewerName(review: Review): string {
    const user = review.user as User;
    return user?.firstName ? `${user.firstName} ${user.lastName}` : 'Customer';
  }

  protected reviewerImage(review: Review): string {
    const user = review.user as User;
    return uploadedImage('users', user?.imageUrl ?? 'default-user.webp');
  }

  protected addToCart(): void {
    const dish = this.item();

    if (!dish) {
      return;
    }

    this.cartService.add(dish, this.quantity);
    this.addedMessage.set(`${this.quantity} x ${dish.name} added to your cart`);
  }

  protected submitReview(): void {
    const dish = this.item();

    if (!dish) {
      return;
    }

    this.reviewError.set('');

    this.reviewService.createReview(dish._id, this.newReview).subscribe({
      next: () => {
        this.newReview = { rating: 5, comment: '' };
        this.loadReviews(dish._id);

        // the rating on the dish changes with the new review
        this.menuService.getMenuItemById(dish._id).subscribe({
          next: (response) => this.item.set(response.data.menuItem),
        });
      },
      error: (error: Error) => {
        this.reviewError.set(error.message);
      },
    });
  }

  private loadReviews(id: string): void {
    this.reviewService.getReviews(id).subscribe({
      next: (response) => this.reviews.set(response.data.reviews),
      error: () => this.reviews.set([]),
    });
  }
}
