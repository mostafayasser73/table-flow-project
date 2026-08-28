// The categories the backend allows in the menu item model.
export enum MenuCategory {
  Pizza = 'pizza',
  Burgers = 'burgers',
  Salads = 'salads',
  Pasta = 'pasta',
  Grills = 'grills',
  Desserts = 'desserts',
  Drinks = 'drinks',
}

// One dish on the Menu page.
export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  preparationTime: string;
  available: boolean;
  imageUrl?: string;
  rating: number;
  numReviews: number;
  createdAt?: string;
}

// GET /menu-items answers with { data: { menuItems: [...] } }
export interface MenuItemsData {
  menuItems: MenuItem[];
}

// GET /menu-items/:id answers with { data: { menuItem: {...} } }
export interface MenuItemData {
  menuItem: MenuItem;
}

// GET /menu-items/categories answers with { data: { categories: [...] } }
export interface CategoriesData {
  categories: string[];
}
