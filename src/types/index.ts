export type Department = 'men' | 'women';

export interface Product {
  id: string;
  name: string;
  department: Department; // strictly 'men' | 'women'
  category: string;
  subcategory?: string; // e.g. "Men's Shoes", "Women's Shoes", "Knitwear", "Hoodies"
  description: string;
  price: number;
  originalPrice?: number;
  salePrice?: number;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  isFeatured: boolean;
  isActive: boolean;
  isExample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string; // composite key: `${productId}-${size}-${color}`
  productId: string;
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

export interface CustomerOrderDetails {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  notes?: string;
}

export interface WhatsAppOrderPayload {
  department: Department;
  recipientPhone: string;
  recipientNumberFormatted: string;
  encodedUrl: string;
  messageText: string;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export interface SiteSettings {
  storeName: string;
  tagline: string;
  promoBannerText: string;
  promoBannerActive: boolean;
  showHero?: boolean;
  showCategoryBanners?: boolean;
  heroTitle: string;
  heroSubtitle: string;
  heroTag: string;
  currency: string;
  currencySymbol: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  menFacebookUrl: string;
  menWhatsAppNumber: string;
  womenFacebookUrl: string;
  womenWhatsAppNumber: string;
  heroImageUrl: string;
  logoText: string;
}

export interface AdminStats {
  totalProducts: number;
  menProductsCount: number;
  womenProductsCount: number;
  shoesProductsCount: number;
  lowStockCount: number;
  totalStockUnits: number;
}
