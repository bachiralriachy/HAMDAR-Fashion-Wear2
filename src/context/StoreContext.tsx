import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem, SiteSettings, Department, CustomerOrderDetails, WhatsAppOrderPayload } from '../types/index.ts';
import { auth, googleProvider } from '../lib/firebase.ts';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

interface StoreContextType {
  products: Product[];
  settings: SiteSettings;
  loading: boolean;
  error: string | null;
  activeDepartment: 'all' | 'men' | 'women' | 'shoes';
  setActiveDepartment: (dept: 'all' | 'men' | 'women' | 'shoes') => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedSubcategory: string;
  setSelectedSubcategory: (subcat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  cart: CartItem[];
  addToCart: (product: Product, size: string, color: string, quantity?: number) => void;
  updateCartQuantity: (itemId: string, newQty: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  deliveryFee: number;
  cartTotal: number;
  isMixedCart: boolean;
  menCartItems: CartItem[];
  womenCartItems: CartItem[];
  generateWhatsAppPayload: (dept: 'men' | 'women', details: CustomerOrderDetails) => WhatsAppOrderPayload;
  refreshProducts: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  // Admin auth state
  adminToken: string | null;
  isAdminLoggedIn: boolean;
  isInitialSetup: boolean;
  loginWithPin: (pin: string) => Promise<{ success: boolean; error?: string; remainingAttempts?: number }>;
  loginWithPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => void;
  // Firebase Auth state
  firebaseUser: User | null;
  loginWithGoogle: () => Promise<boolean>;
  logoutFirebase: () => Promise<void>;
  // UI state
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  selectedProductModal: Product | null;
  setSelectedProductModal: (prod: Product | null) => void;
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
  isCheckoutModalOpen: boolean;
  setIsCheckoutModalOpen: (open: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const defaultSettings: SiteSettings = {
  storeName: "HAMDAR Fashion Wear",
  tagline: "Modern Looks for a Better You",
  promoBannerText: "🚚 Express Delivery Across Lebanon • WhatsApp Orders Only",
  promoBannerActive: true,
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

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeDepartment, setActiveDepartment] = useState<'all' | 'men' | 'women' | 'shoes'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('hamdar_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('hamdar_admin_token') || null;
  });
  const [isInitialSetup, setIsInitialSetup] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hamdar_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cart]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user && user.email === 'alriachybachir11@gmail.com') {
        loginWithPin('1234');
      }
    });
    return () => unsubscribe();
  }, []);

  // Initial data loading
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?activeOnly=true');
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError(err.message);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  useEffect(() => {
    Promise.all([fetchProducts(), fetchSettings()]).finally(() => {
      setLoading(false);
    });

    const token = localStorage.getItem('hamdar_admin_token');
    if (token) {
      fetch('/api/admin/check-session', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setAdminToken(token);
            setIsInitialSetup(Boolean(data.isInitialSetup));
          } else {
            localStorage.removeItem('hamdar_admin_token');
            setAdminToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('hamdar_admin_token');
          setAdminToken(null);
        });
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  // Cart operations
  const addToCart = (product: Product, size: string, color: string, quantity = 1) => {
    const itemId = `${product.id}-${size}-${color}`;
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === itemId);
      if (existing) {
        return prevCart.map(item =>
          item.id === itemId
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock || 99) }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            id: itemId,
            productId: product.id,
            product,
            size,
            color,
            quantity: Math.min(quantity, product.stock || 99)
          }
        ];
      }
    });
    showToast(`Added ${product.name} to cart`);
  };

  const updateCartQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === itemId) {
          const maxStock = item.product.stock || 99;
          return { ...item, quantity: Math.min(newQty, maxStock) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Cart calculations
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = cartSubtotal >= settings.freeDeliveryThreshold || cartSubtotal === 0 ? 0 : settings.deliveryFee;
  const cartTotal = cartSubtotal + deliveryFee;

  // Strict Department Splitting based on database product.department ('men' or 'women')
  const menCartItems = cart.filter(item => item.product.department === 'men');
  const womenCartItems = cart.filter(item => item.product.department === 'women');
  const isMixedCart = menCartItems.length > 0 && womenCartItems.length > 0;

  // WhatsApp Order Payload Generator (Exact required format in Section 4)
  const generateWhatsAppPayload = (dept: 'men' | 'women', details: CustomerOrderDetails): WhatsAppOrderPayload => {
    const isMen = dept === 'men';
    const targetItems = isMen ? menCartItems : womenCartItems;
    const recipientPhone = isMen ? settings.menWhatsAppNumber : settings.womenWhatsAppNumber;
    const cleanNumber = recipientPhone.replace(/\D/g, '');

    const subtotal = targetItems.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
    const fee = subtotal >= settings.freeDeliveryThreshold || subtotal === 0 ? 0 : settings.deliveryFee;
    const total = subtotal + fee;

    let message = `HAMDAR FASHION WEAR — ${isMen ? "MEN’S ORDER" : "WOMEN’S ORDER"}\n\n`;
    message += `Customer: ${details.customerName}\n`;
    message += `Phone: ${details.customerPhone}\n`;
    message += `Delivery address: ${details.deliveryAddress}${details.city ? `, ${details.city}` : ''}\n\n`;
    message += `Products:\n`;

    targetItems.forEach((item) => {
      message += `* ${item.product.name}\n`;
      message += `  Size: ${item.size}\n`;
      message += `  Color: ${item.color}\n`;
      message += `  Quantity: ${item.quantity}\n`;
      message += `  Price: ${settings.currencySymbol}${item.product.price.toFixed(2)}\n\n`;
    });

    message += `Subtotal: ${settings.currencySymbol}${subtotal.toFixed(2)}\n`;
    message += `Delivery fee: ${fee === 0 ? "FREE" : `${settings.currencySymbol}${fee.toFixed(2)}`}\n`;
    message += `Total: ${settings.currencySymbol}${total.toFixed(2)}\n\n`;

    if (details.notes?.trim()) {
      message += `Notes: ${details.notes.trim()}\n\n`;
    }

    message += `Please confirm product availability and delivery details.`;

    const encodedUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

    return {
      department: dept,
      recipientPhone,
      recipientNumberFormatted: recipientPhone,
      encodedUrl,
      messageText: message,
      itemCount: targetItems.reduce((acc, i) => acc + i.quantity, 0),
      subtotal,
      deliveryFee: fee,
      total
    };
  };

  // Admin Auth Methods
  const loginWithPin = async (pin: string) => {
    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error, remainingAttempts: data.remainingAttempts };
      }
      localStorage.setItem('hamdar_admin_token', data.token);
      setAdminToken(data.token);
      setIsInitialSetup(Boolean(data.isInitialSetup));
      showToast('Admin access unlocked');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error' };
    }
  };

  const loginWithPassword = async (password: string) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error };
      }
      localStorage.setItem('hamdar_admin_token', data.token);
      setAdminToken(data.token);
      setIsInitialSetup(Boolean(data.isInitialSetup));
      showToast('Admin logged in');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error' };
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setFirebaseUser(user);
      await loginWithPin('1234');
      showToast(`Signed in with Google (${user.email})`);
      return true;
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      showToast(err.message || 'Failed to sign in with Google');
      return false;
    }
  };

  const logoutFirebase = async () => {
    try {
      await signOut(auth);
      setFirebaseUser(null);
    } catch (e) {
      console.error(e);
    }
  };

  const logoutAdmin = () => {
    localStorage.removeItem('hamdar_admin_token');
    setAdminToken(null);
    logoutFirebase();
    setIsAdminModalOpen(false);
    showToast('Logged out from admin panel');
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        settings,
        loading,
        error,
        activeDepartment,
        setActiveDepartment,
        selectedCategory,
        setSelectedCategory,
        selectedSubcategory,
        setSelectedSubcategory,
        searchQuery,
        setSearchQuery,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
        deliveryFee,
        cartTotal,
        isMixedCart,
        menCartItems,
        womenCartItems,
        generateWhatsAppPayload,
        refreshProducts: fetchProducts,
        refreshSettings: fetchSettings,
        adminToken,
        isAdminLoggedIn: Boolean(adminToken || (firebaseUser && firebaseUser.email === 'alriachybachir11@gmail.com')),
        isInitialSetup,
        loginWithPin,
        loginWithPassword,
        logoutAdmin,
        firebaseUser,
        loginWithGoogle,
        logoutFirebase,
        isCartOpen,
        setIsCartOpen,
        selectedProductModal,
        setSelectedProductModal,
        isAdminModalOpen,
        setIsAdminModalOpen,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
        toastMessage,
        showToast
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
