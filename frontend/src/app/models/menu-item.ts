export type MenuCategory = 'STARTER' | 'MAIN_COURSE' | 'DESSERT' | 'BEVERAGE';

export interface MenuItem {
  itemId?: number;
  name: string;
  category: MenuCategory;
  price: number;
  available: boolean;
  manager: { managerId: number };
}
