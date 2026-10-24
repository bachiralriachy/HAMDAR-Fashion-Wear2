import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Product, SiteSettings, AdminStats } from '../src/types/index.ts';

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const REPO_DATA_DIR = path.resolve(process.cwd(), 'data');
const REPO_DATA_FILE = path.join(REPO_DATA_DIR, 'store.json');
const TMP_DATA_DIR = path.join('/tmp', 'hamdar-data');
const TMP_DATA_FILE = path.join(TMP_DATA_DIR, 'store.json');

export interface AdminAuth {
  pinSalt: string;
  pinHash: string;
  passwordSalt: string;
  passwordHash: string;
  isInitialSetup: boolean;
}

export interface StoreData {
  products: Product[];
  settings: SiteSettings;
  auth: AdminAuth;
}

// Password / PIN hashing helpers
export function hashSecret(secret: string, salt?: string): { salt: string; hash: string } {
  const chosenSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(secret, chosenSalt, 64).toString('hex');
  return { salt: chosenSalt, hash };
}

export function verifySecret(secret: string, salt: string, expectedHash: string): boolean {
  try {
    const hash = crypto.scryptSync(secret, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch {
    return false;
  }
}

const defaultSettings: SiteSettings = {
  storeName: "HAMDAR Fashion Wear",
  tagline: "Modern Looks for a Better You",
  promoBannerText: "🚚 Express Delivery Across Lebanon • WhatsApp Orders Only",
  promoBannerActive: false,
  showHero: false,
  showCategoryBanners: false,
  heroTitle: "Modern Looks for a Better You",
  heroSubtitle: "Premium clothing for men and women. Comfort, quality and timeless style.",
  heroTag: "STYLE FOR EVERYDAY",
  currency: "USD",
  currencySymbol: "$",
  deliveryFee: 3.00,
  freeDeliveryThreshold: 75.00,
  menFacebookUrl: "https://www.facebook.com/share/1E7SjfVSzt/?mibextid=wwXIfr",
  menWhatsAppNumber: "+961 76 320 279",
  womenFacebookUrl: "https://www.facebook.com/share/1FzvXxuDSb/?mibextid=wwXIfr",
  womenWhatsAppNumber: "+961 81 612 154",
  heroImageUrl: "/src/assets/images/hero_fashion_models_1792786507434.jpg",
  logoText: "HAMDAR"
};

const defaultProducts: Product[] = [
  // 1. Women's Striped Knit Top
  {
    id: "hmd-001",
    name: "Striped Knit Top",
    department: "women",
    category: "Clothing",
    subcategory: "Knitwear",
    description: "Premium cotton-blend long-sleeve knit sweater featuring chic nautical horizontal stripes, relaxed crewneck neckline, and ribbed cuffs. Soft, breathable, and effortlessly stylish.",
    price: 29.00,
    originalPrice: 38.00,
    salePrice: 29.00,
    images: [
      "/src/assets/images/product_striped_knit_top_1792786508889.jpg",
      "/src/assets/images/hero_fashion_models_1792786507434.jpg"
    ],
    sizes: ["XS", "S", "M", "L"],
    colors: ["Black/White Stripe", "Navy/Cream Stripe"],
    stock: 24,
    isFeatured: true,
    isActive: true,
    isExample: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 2. Men's Essential Heavyweight Hoodie
  {
    id: "hmd-002",
    name: "Essential Heavyweight Hoodie",
    department: "men",
    category: "Clothing",
    subcategory: "Hoodies & Sweats",
    description: "Oversized minimalist hoodie crafted from 420 GSM brushed fleece cotton. Features a double-layered structured hood with tonal drawstrings and kangaroo pouch pocket.",
    price: 39.00,
    originalPrice: 48.00,
    salePrice: 39.00,
    images: [
      "/src/assets/images/product_hoodie_beige_1792786509010.jpg",
      "/src/assets/images/hero_fashion_models_1792786507434.jpg"
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Warm Beige", "Midnight Black", "Heather Grey"],
    stock: 35,
    isFeatured: true,
    isActive: true,
    isExample: true,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 3. Men's Shoes: Retro Court Lifestyle Sneakers
  {
    id: "hmd-003",
    name: "Retro Court Lifestyle Sneakers",
    department: "men",
    category: "Shoes",
    subcategory: "Men's Shoes",
    description: "Low-profile retro court sneakers engineered with premium tumbled leather uppers, contrast swoosh accents, cushioned foam midsole, and vintage gum rubber outsole.",
    price: 69.00,
    originalPrice: 85.00,
    salePrice: 69.00,
    images: [
      "/src/assets/images/product_sneakers_retro_1792786510224.jpg"
    ],
    sizes: ["40", "41", "42", "43", "44", "45"],
    colors: ["Grey/White", "Triple White", "Black/Gum"],
    stock: 18,
    isFeatured: true,
    isActive: true,
    isExample: true,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 4. Women's Heather Ribbed Knit Set
  {
    id: "hmd-004",
    name: "Heather Ribbed Knit Set",
    department: "women",
    category: "Clothing",
    subcategory: "Co-ord Sets",
    description: "Ultra-comfortable two-piece matching lounge set with a relaxed quarter-zip top and wide-leg drawstring knit trousers. Perfect for cozy days and effortless casual outings.",
    price: 54.00,
    originalPrice: 65.00,
    salePrice: 54.00,
    images: [
      "/src/assets/images/product_striped_knit_top_1792786508889.jpg"
    ],
    sizes: ["S", "M", "L"],
    colors: ["Heather Grey", "Oatmeal Beige"],
    stock: 14,
    isFeatured: true,
    isActive: true,
    isExample: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 5. Women's Emerald Green Lounge Set
  {
    id: "hmd-005",
    name: "Emerald Green Lounge Set",
    department: "women",
    category: "Clothing",
    subcategory: "Co-ord Sets",
    description: "Luxury knit two-piece set in a deep botanical emerald tone. Breathable ribbed knit fabric offering supreme comfort with a contemporary silhouette.",
    price: 54.00,
    originalPrice: 65.00,
    salePrice: 54.00,
    images: [
      "/src/assets/images/product_striped_knit_top_1792786508889.jpg"
    ],
    sizes: ["S", "M", "L"],
    colors: ["Forest Green", "Olive"],
    stock: 8,
    isFeatured: true,
    isActive: true,
    isExample: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 6. Women's Burgundy Velvet Knit Set
  {
    id: "hmd-006",
    name: "Burgundy Velvet Knit Set",
    department: "women",
    category: "Clothing",
    subcategory: "Co-ord Sets",
    description: "Rich burgundy two-piece co-ord set with elastic waist trousers and tailored lounge top. Elegant, warming, and designed for versatile styling.",
    price: 54.00,
    originalPrice: 65.00,
    salePrice: 54.00,
    images: [
      "/src/assets/images/product_striped_knit_top_1792786508889.jpg"
    ],
    sizes: ["S", "M", "L"],
    colors: ["Burgundy", "Wine"],
    stock: 12,
    isFeatured: true,
    isActive: true,
    isExample: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 7. Men's Quarter-Zip Athletic Top
  {
    id: "hmd-007",
    name: "Quarter-Zip Athletic Top",
    department: "men",
    category: "Clothing",
    subcategory: "Jackets & Tops",
    description: "Modern mock-neck quarter-zip pullover in technical cotton stretch. Minimalist chest branding, matte zip hardware, and clean banded cuffs.",
    price: 45.00,
    originalPrice: 55.00,
    salePrice: 45.00,
    images: [
      "/src/assets/images/product_hoodie_beige_1792786509010.jpg"
    ],
    sizes: ["M", "L", "XL", "XXL"],
    colors: ["Navy Blue", "Dark Charcoal"],
    stock: 22,
    isFeatured: true,
    isActive: true,
    isExample: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 8. Men's Tailored Smart Wool-Blend Trousers
  {
    id: "hmd-008",
    name: "Tailored Smart Wool-Blend Trousers",
    department: "men",
    category: "Clothing",
    subcategory: "Pants & Trousers",
    description: "Slim-tapered smart trousers with subtle front pleats and concealed elastic comfort waistband. Dressed up with loafers or down with sneakers.",
    price: 48.00,
    originalPrice: 60.00,
    salePrice: 48.00,
    images: [
      "/src/assets/images/hero_fashion_models_1792786507434.jpg"
    ],
    sizes: ["30", "32", "34", "36"],
    colors: ["Charcoal Grey", "Dark Navy", "Desert Tan"],
    stock: 16,
    isFeatured: false,
    isActive: true,
    isExample: true,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 9. Women's Shoes: Chic Platform Classic Sneakers
  {
    id: "hmd-009",
    name: "Chic Platform Classic Sneakers",
    department: "women",
    category: "Shoes",
    subcategory: "Women's Shoes",
    description: "Elevated platform sneakers with clean white leather finish, cushioned footbed, and tonal trim. Ideal for pairing with knit dresses and casual trousers.",
    price: 64.00,
    originalPrice: 78.00,
    salePrice: 64.00,
    images: [
      "/src/assets/images/product_sneakers_retro_1792786510224.jpg"
    ],
    sizes: ["36", "37", "38", "39", "40", "41"],
    colors: ["White/Cream", "Triple White"],
    stock: 19,
    isFeatured: true,
    isActive: true,
    isExample: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 10. Women's Classic Belted Trench Coat
  {
    id: "hmd-010",
    name: "Classic Belted Trench Coat",
    department: "women",
    category: "Clothing",
    subcategory: "Jackets & Coats",
    description: "Iconic double-breasted long trench coat with storm flaps, adjustable wrist straps, and tortoiseshell button details. Water-resistant and timeless.",
    price: 92.00,
    originalPrice: 110.00,
    salePrice: 92.00,
    images: [
      "/src/assets/images/product_striped_knit_top_1792786508889.jpg"
    ],
    sizes: ["S", "M", "L"],
    colors: ["Honey Camel", "Black"],
    stock: 6,
    isFeatured: false,
    isActive: true,
    isExample: true,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 11. Men's Shoes: Urban Runner Monochrome
  {
    id: "hmd-011",
    name: "Urban Runner Monochrome Sneakers",
    department: "men",
    category: "Shoes",
    subcategory: "Men's Shoes",
    description: "Lightweight technical lifestyle runner with engineered mesh breathability, reinforced heel cup, and responsive shock-absorbing sole.",
    price: 72.00,
    originalPrice: 89.00,
    salePrice: 72.00,
    images: [
      "/src/assets/images/product_sneakers_retro_1792786510224.jpg"
    ],
    sizes: ["40", "41", "42", "43", "44", "45"],
    colors: ["Stealth Black", "Smoke Grey"],
    stock: 15,
    isFeatured: false,
    isActive: true,
    isExample: true,
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 12. Women's Shoes: Modern Leather Ankle Booties
  {
    id: "hmd-012",
    name: "Modern Leather Chelsea Booties",
    department: "women",
    category: "Shoes",
    subcategory: "Women's Shoes",
    description: "Sleek low-heel Chelsea booties in supple black leather with elastic side gores and pull tab. Timeless comfort for daily wear.",
    price: 85.00,
    originalPrice: 98.00,
    salePrice: 85.00,
    images: [
      "/src/assets/images/product_striped_knit_top_1792786508889.jpg"
    ],
    sizes: ["36", "37", "38", "39", "40"],
    colors: ["Noir Black", "Dark Espresso"],
    stock: 10,
    isFeatured: false,
    isActive: true,
    isExample: true,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

class StoreManager {
  private data: StoreData;

  constructor() {
    this.data = this.loadData();
  }

  private getStoragePaths() {
    if (isServerless) {
      return {
        preferredRead: fs.existsSync(TMP_DATA_FILE) ? TMP_DATA_FILE : REPO_DATA_FILE,
        fallbackRead: REPO_DATA_FILE,
        writeDir: TMP_DATA_DIR,
        writeFile: TMP_DATA_FILE
      };
    }
    return {
      preferredRead: REPO_DATA_FILE,
      fallbackRead: REPO_DATA_FILE,
      writeDir: REPO_DATA_DIR,
      writeFile: REPO_DATA_FILE
    };
  }

  private loadData(): StoreData {
    const { preferredRead, fallbackRead, writeDir, writeFile } = this.getStoragePaths();

    // 1. Try preferred read location
    const candidates = [preferredRead];
    if (fallbackRead && fallbackRead !== preferredRead) {
      candidates.push(fallbackRead);
    }

    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        try {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.products) && parsed.settings && parsed.auth) {
            // Ensure all existing products conform to 'men' | 'women'
            parsed.products = parsed.products.map((p: any) => {
              let dept = p.department;
              if (dept !== 'men' && dept !== 'women') {
                dept = (p.subcategory?.includes('Men') || p.name?.toLowerCase().includes('men') || p.category?.toLowerCase().includes('men')) ? 'men' : 'women';
              }
              return { ...p, department: dept };
            });

            // If on serverless and tmp file doesn't exist yet, seed it
            if (isServerless && !fs.existsSync(writeFile)) {
              try {
                if (!fs.existsSync(writeDir)) fs.mkdirSync(writeDir, { recursive: true });
                fs.writeFileSync(writeFile, raw, 'utf-8');
              } catch (seedErr) {
                console.warn('Could not seed /tmp store file:', seedErr);
              }
            }

            return parsed;
          }
        } catch (err) {
          console.error(`Error reading data from ${filePath}:`, err);
        }
      }
    }

    // Default initial admin PIN is '1234' with fresh salt
    const { salt: pinSalt, hash: pinHash } = hashSecret('1234');
    const { salt: passwordSalt, hash: passwordHash } = hashSecret('admin1234');

    const initialData: StoreData = {
      products: defaultProducts,
      settings: defaultSettings,
      auth: {
        pinSalt,
        pinHash,
        passwordSalt,
        passwordHash,
        isInitialSetup: true
      }
    };

    this.saveDataDirect(initialData);
    return initialData;
  }

  private saveDataDirect(data: StoreData) {
    const { writeDir, writeFile } = this.getStoragePaths();
    try {
      if (!fs.existsSync(writeDir)) {
        fs.mkdirSync(writeDir, { recursive: true });
      }
      const tempFile = `${writeFile}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, writeFile);
    } catch (err) {
      console.warn('Could not persist store data to disk (running with in-memory state):', err);
    }
  }

  private persist() {
    this.saveDataDirect(this.data);
  }

  // Auth operations
  public getAuth() {
    return this.data.auth;
  }

  public verifyPin(pin: string): boolean {
    return verifySecret(pin, this.data.auth.pinSalt, this.data.auth.pinHash);
  }

  public updatePin(newPin: string): void {
    const { salt, hash } = hashSecret(newPin);
    this.data.auth.pinSalt = salt;
    this.data.auth.pinHash = hash;
    this.data.auth.isInitialSetup = false;
    this.persist();
  }

  public verifyPassword(password: string): boolean {
    return verifySecret(password, this.data.auth.passwordSalt, this.data.auth.passwordHash);
  }

  public updatePassword(newPassword: string): void {
    const { salt, hash } = hashSecret(newPassword);
    this.data.auth.passwordSalt = salt;
    this.data.auth.passwordHash = hash;
    this.persist();
  }

  // Settings
  public getSettings(): SiteSettings {
    return this.data.settings;
  }

  public updateSettings(newSettings: Partial<SiteSettings>): SiteSettings {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.persist();
    return this.data.settings;
  }

  // Products
  public getProducts(department?: string, category?: string, subcategory?: string, search?: string, activeOnly: boolean = false): Product[] {
    let list = this.data.products;
    if (activeOnly) {
      list = list.filter(p => p.isActive);
    }
    // Strict department filtering ('men' or 'women')
    if (department && department !== 'all') {
      list = list.filter(p => p.department === department);
    }
    // Category filtering
    if (category && category !== 'all') {
      list = list.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    // Subcategory filtering (e.g. "Men's Shoes", "Women's Shoes")
    if (subcategory && subcategory !== 'all') {
      list = list.filter(p => p.subcategory?.toLowerCase() === subcategory.toLowerCase());
    }
    // Search query
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
        p.sizes.some(s => s.toLowerCase().includes(q)) ||
        p.colors.some(c => c.toLowerCase().includes(q))
      );
    }
    return list;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  public createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    if (product.department !== 'men' && product.department !== 'women') {
      throw new Error("Validation Error: Every product must be strictly assigned to either 'men' or 'women' department.");
    }

    const id = `hmd-${Date.now().toString(36)}`;
    const newProduct: Product = {
      ...product,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.products.unshift(newProduct);
    this.persist();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return null;

    if (updates.department && updates.department !== 'men' && updates.department !== 'women') {
      throw new Error("Validation Error: Every product must be strictly assigned to either 'men' or 'women' department.");
    }

    this.data.products[idx] = {
      ...this.data.products[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.persist();
    return this.data.products[idx];
  }

  public deleteProduct(id: string): boolean {
    const prevLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    if (this.data.products.length !== prevLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // Dashboard Stats
  public getStats(): AdminStats {
    const totalProducts = this.data.products.length;
    const menProductsCount = this.data.products.filter(p => p.department === 'men').length;
    const womenProductsCount = this.data.products.filter(p => p.department === 'women').length;
    const shoesProductsCount = this.data.products.filter(p => p.category.toLowerCase() === 'shoes').length;
    const lowStockCount = this.data.products.filter(p => p.stock <= 10).length;
    const totalStockUnits = this.data.products.reduce((acc, p) => acc + (p.stock || 0), 0);

    return {
      totalProducts,
      menProductsCount,
      womenProductsCount,
      shoesProductsCount,
      lowStockCount,
      totalStockUnits
    };
  }
}

export const store = new StoreManager();
