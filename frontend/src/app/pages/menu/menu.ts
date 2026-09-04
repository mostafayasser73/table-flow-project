import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { DishCard } from '../../components/dish-card/dish-card';
import { Autofocus } from '../../directives/autofocus';
import { MenuItem } from '../../models/menu-item.model';
import { CartService } from '../../services/cart.service';
import { MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-menu',
  imports: [FormsModule, DishCard, Autofocus],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu implements OnInit {
  private readonly menuService = inject(MenuService);
  private readonly cartService = inject(CartService);
  private readonly route = inject(ActivatedRoute);

  protected readonly menuItems = signal<MenuItem[]>([]);
  protected readonly categories = signal<string[]>([]);
  protected readonly selectedCategory = signal('all');
  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(false);

  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly totalItems = signal(0);

  // the id of the dish that was just added, so the button can say so
  protected readonly justAdded = signal('');

  // bound to the search box
  protected searchTerm = '';

  ngOnInit(): void {
    // the Home page links here with ?category=pizza already set
    const category = this.route.snapshot.queryParamMap.get('category');

    if (category) {
      this.selectedCategory.set(category);
    }

    this.loadCategories();
    this.loadMenuItems();
  }

  protected onCategoryClick(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
    this.loadMenuItems();
  }

  protected onSearch(): void {
    this.currentPage.set(1);
    this.loadMenuItems();
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
    this.loadMenuItems();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected addToCart(item: MenuItem): void {
    this.cartService.add(item);
    this.justAdded.set(item._id);

    setTimeout(() => this.justAdded.set(''), 1500);
  }

  private loadCategories(): void {
    this.menuService.getCategories().subscribe({
      next: (response) => this.categories.set(response.data.categories),
      // the pills are not critical, so a failure here only hides them
      error: () => this.categories.set([]),
    });
  }

  private loadMenuItems(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.menuService
      .getMenuItems({
        category: this.selectedCategory(),
        search: this.searchTerm.trim(),
        available: true,
        page: this.currentPage(),
        limit: 9,
      })
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.menuItems.set(response.data.menuItems);
          this.totalPages.set(response.totalPages);
          this.totalItems.set(response.totalItems);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.menuItems.set([]);
          this.errorMessage.set(
            error.error?.message ??
              'Could not reach the server. Is the backend running?',
          );
        },
      });
  }
}
