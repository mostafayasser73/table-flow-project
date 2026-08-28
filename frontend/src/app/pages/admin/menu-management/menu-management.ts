import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { uploadedImage } from '../../../api-config';
import { MenuCategory, MenuItem } from '../../../models/menu-item.model';
import { MenuService } from '../../../services/menu.service';

interface DishForm {
  name: string;
  description: string;
  price: number | null;
  category: MenuCategory;
  preparationTime: string;
  available: boolean;
}

const emptyForm = (): DishForm => ({
  name: '',
  description: '',
  price: null,
  category: MenuCategory.Pizza,
  preparationTime: '15-20 min',
  available: true,
});

@Component({
  selector: 'app-menu-management',
  imports: [FormsModule],
  templateUrl: './menu-management.html',
  styleUrl: './menu-management.css',
})
export class MenuManagement implements OnInit {
  private readonly menuService = inject(MenuService);

  protected readonly categories = Object.values(MenuCategory);

  protected readonly items = signal<MenuItem[]>([]);
  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(false);

  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly totalItems = signal(0);

  protected categoryFilter = 'all';
  protected searchTerm = '';

  protected readonly isFormOpen = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected form: DishForm = emptyForm();
  private pickedPhoto?: File;
  protected readonly formError = signal('');

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    // no "available" filter here: the staff must see the hidden dishes too
    this.menuService
      .getMenuItems({
        category: this.categoryFilter,
        search: this.searchTerm.trim(),
        page: this.currentPage(),
        limit: 10,
      })
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.items.set(response.data.menuItems);
          this.totalPages.set(response.totalPages);
          this.totalItems.set(response.totalItems);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            error.error?.message ?? 'Could not load the menu',
          );
        },
      });
  }

  protected onFilterChange(): void {
    this.currentPage.set(1);
    this.load();
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
    this.load();
  }

  protected dishImage(item: MenuItem): string {
    return uploadedImage('menu-items', item.imageUrl);
  }

  protected openAdd(): void {
    this.form = emptyForm();
    this.editingId.set(null);
    this.pickedPhoto = undefined;
    this.formError.set('');
    this.isFormOpen.set(true);
  }

  protected openEdit(item: MenuItem): void {
    this.form = {
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      preparationTime: item.preparationTime,
      available: item.available,
    };
    this.editingId.set(item._id);
    this.pickedPhoto = undefined;
    this.formError.set('');
    this.isFormOpen.set(true);
  }

  protected closeForm(): void {
    this.isFormOpen.set(false);
  }

  protected onPhotoPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pickedPhoto = input.files?.[0];
  }

  protected saveDish(): void {
    this.formError.set('');

    const data = new FormData();
    data.append('name', this.form.name);
    data.append('description', this.form.description);
    data.append('price', String(this.form.price ?? 0));
    data.append('category', this.form.category);
    data.append('preparationTime', this.form.preparationTime);
    data.append('available', String(this.form.available));

    if (this.pickedPhoto) {
      data.append('imageUrl', this.pickedPhoto);
    }

    const id = this.editingId();

    const request = id
      ? this.menuService.updateMenuItem(id, data)
      : this.menuService.createMenuItem(data);

    request.subscribe({
      next: () => {
        this.isFormOpen.set(false);
        this.load();
      },
      error: (error: HttpErrorResponse) =>
        this.formError.set(error.error?.message ?? 'Could not save the dish'),
    });
  }

  // the Available switch on each row
  protected toggleAvailable(item: MenuItem): void {
    const data = new FormData();
    data.append('available', String(!item.available));

    this.menuService.updateMenuItem(item._id, data).subscribe({
      next: () =>
        this.items.update((list) =>
          list.map((i) =>
            i._id === item._id ? { ...i, available: !i.available } : i,
          ),
        ),
      error: (error: HttpErrorResponse) =>
        this.errorMessage.set(error.error?.message ?? 'Could not update'),
    });
  }

  protected deleteDish(item: MenuItem): void {
    if (!confirm(`Delete ${item.name}?`)) {
      return;
    }

    this.menuService.deleteMenuItem(item._id).subscribe({
      next: () => this.load(),
      error: (error: HttpErrorResponse) =>
        this.errorMessage.set(
          error.error?.message ?? 'Could not delete the dish',
        ),
    });
  }
}
