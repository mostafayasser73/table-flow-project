import { HttpErrorResponse } from '@angular/common/http';
import { TitleCasePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { uploadedImage } from '../../../api-config';
import { MenuCategory, MenuItem } from '../../../models/menu-item.model';
import { MenuService } from '../../../services/menu.service';

// The Add / Edit panel is a Reactive Form: the whole form lives here in
// TypeScript, together with its rules, and the template only connects to it.
const buildDishForm = () =>
  new FormGroup({
    name: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(100),
    ]),

    description: new FormControl('', [
      Validators.required,
      Validators.maxLength(1000),
    ]),

    price: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
    ]),

    category: new FormControl<MenuCategory>(MenuCategory.Pizza, [
      Validators.required,
    ]),

    preparationTime: new FormControl('15-20 min', [Validators.required]),

    available: new FormControl(true),
  });

@Component({
  selector: 'app-menu-management',
  imports: [FormsModule, ReactiveFormsModule, TitleCasePipe],
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
  protected readonly dishForm = buildDishForm();
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
    this.dishForm.reset({
      name: '',
      description: '',
      price: null,
      category: MenuCategory.Pizza,
      preparationTime: '15-20 min',
      available: true,
    });

    this.editingId.set(null);
    this.pickedPhoto = undefined;
    this.formError.set('');
    this.isFormOpen.set(true);
  }

  protected openEdit(item: MenuItem): void {
    // setValue fills every control at once, so the panel opens on the dish
    this.dishForm.setValue({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      preparationTime: item.preparationTime,
      available: item.available,
    });

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

    // a form that is still invalid is not sent: every field is marked as
    // touched instead, which is what makes the messages below them appear
    if (this.dishForm.invalid) {
      this.dishForm.markAllAsTouched();
      return;
    }

    const value = this.dishForm.getRawValue();

    const data = new FormData();
    data.append('name', value.name ?? '');
    data.append('description', value.description ?? '');
    data.append('price', String(value.price ?? 0));
    data.append('category', value.category ?? MenuCategory.Pizza);
    data.append('preparationTime', value.preparationTime ?? '');
    data.append('available', String(value.available));

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
