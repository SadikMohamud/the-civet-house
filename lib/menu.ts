// ================================================================
// THE CIVET HOUSE MENU
//
// PLACEHOLDER CONTENT: realistic items and sample UK prices so the menu
// looks complete. Swap in the shop's real items, descriptions and prices.
// Each category may set an `image` (a coffee photo in public/img) shown
// as the category banner.
// ================================================================

export interface MenuItem {
  name: string;
  description?: string;
  price: number; // in GBP
}

export interface MenuCategory {
  name: string;
  image?: string;
  items: MenuItem[];
}

export const menu: MenuCategory[] = [
  {
    name: "Coffee",
    image: "/img/menu-coffee.jpg",
    items: [
      { name: "Espresso", description: "Our house dark roast, double shot", price: 2.6 },
      { name: "Flat White", description: "Velvety steamed milk, double shot", price: 3.4 },
      { name: "Latte", description: "Smooth espresso with steamed milk", price: 3.6 },
      { name: "Cappuccino", description: "Espresso, steamed milk, airy foam", price: 3.5 },
      { name: "Americano", description: "Espresso lengthened with hot water", price: 2.9 },
      { name: "Mocha", description: "Espresso, chocolate and steamed milk", price: 3.8 },
    ],
  },
  {
    name: "Cold Drinks",
    image: "/img/menu-cold.jpg",
    items: [
      { name: "Iced Latte", description: "Chilled espresso over milk and ice", price: 3.8 },
      { name: "Cold Brew", description: "Slow-steeped for 18 hours, smooth", price: 3.9 },
      { name: "Iced Mocha", description: "Chocolate, espresso, milk and ice", price: 4.1 },
      { name: "Sparkling Water", description: "Still or sparkling, 330ml", price: 2.0 },
    ],
  },
  {
    name: "Pastries & Bakes",
    image: "/img/menu-pastries.jpg",
    items: [
      { name: "Butter Croissant", description: "Baked fresh each morning", price: 2.8 },
      { name: "Pain au Chocolat", description: "Flaky pastry, dark chocolate", price: 3.0 },
      { name: "Cinnamon Roll", description: "Warm, with cream cheese glaze", price: 3.6 },
      { name: "Banana Bread", description: "Toasted, with butter", price: 3.2 },
    ],
  },
];
