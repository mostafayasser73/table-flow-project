import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { uploadedImage } from '../../api-config';
import { MenuItem } from '../../models/menu-item.model';
import { MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly menuService = inject(MenuService);
  private readonly router = inject(Router);

  protected readonly popular = signal<MenuItem[]>([]);
  protected readonly categories = signal<string[]>([]);

  ngOnInit(): void {
    this.menuService.getPopular().subscribe({
      next: (items) => this.popular.set(items),
      error: () => this.popular.set([]),
    });

    this.menuService.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([]),
    });
  }

  protected dishImage(item: MenuItem): string {
    return uploadedImage('menu-items', item.imageUrl);
  }

  // the category cards send the visitor to the menu with that filter already on
  protected openCategory(category: string): void {
    this.router.navigate(['/menu'], { queryParams: { category } });
  }
}
