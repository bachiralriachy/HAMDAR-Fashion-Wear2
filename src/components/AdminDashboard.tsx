import React, { useState, useEffect } from 'react';
import {
  X, LayoutDashboard, Package, Boxes, Settings, ShieldCheck,
  LogOut, Plus, Search, Edit3, Trash2, AlertTriangle, RefreshCw, Upload,
  Save, Phone, Facebook, MessageCircle, ExternalLink, CheckCircle2,
  Loader2, Image as ImageIcon
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { Product, SiteSettings, AdminStats } from '../types/index.ts';
import { uploadImageToFirebase } from '../lib/firebase.ts';

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const {
    adminToken,
    logoutAdmin,
    settings,
    refreshSettings,
    refreshProducts,
    showToast,
    firebaseUser
  } = useStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'inventory' | 'routing' | 'settings' | 'security'>('dashboard');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Product management modal
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productDeptFilter, setProductDeptFilter] = useState<string>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');

  // Image upload state & immediate preview
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Website Settings form
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(settings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Security form (PIN & Password)
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMessage, setPinMessage] = useState<{ text: string; error: boolean } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; error: boolean } | null>(null);

  // Load all admin data
  const loadAdminData = async () => {
    if (!adminToken) return;
    setLoadingData(true);
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };
      const [statsRes, productsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/products?activeOnly=false')
      ]);

      const statsCt = statsRes.headers.get('content-type') || '';
      if (statsRes.ok && statsCt.includes('application/json')) {
        setStats(await statsRes.json());
      }
      const prodCt = productsRes.headers.get('content-type') || '';
      if (productsRes.ok && prodCt.includes('application/json')) {
        setAllProducts(await productsRes.json());
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    setSettingsForm(settings);
  }, [adminToken]);

  // Product Actions
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || editingProduct?.price === undefined || !editingProduct?.department) {
      alert('Please fill in product name, price, and select either MEN or WOMEN department.');
      return;
    }

    if (editingProduct.department !== 'men' && editingProduct.department !== 'women') {
      alert("Validation Error: Every product must be strictly assigned to MEN or WOMEN department.");
      return;
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      };

      if (editingProduct.id) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(editingProduct)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to update product');
        }
        showToast('Product updated successfully');
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers,
          body: JSON.stringify(editingProduct)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to create product');
        }
        showToast('New product created successfully');
      }

      setIsProductModalOpen(false);
      setEditingProduct(null);
      setImagePreviewUrl(null);
      setImageUploadError(null);
      await loadAdminData();
      await refreshProducts();
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('Product removed');
      await loadAdminData();
      await refreshProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleToggleProductActive = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ isActive: !product.isActive })
      });
      if (res.ok) {
        showToast(`Product ${!product.isActive ? 'published' : 'hidden'}`);
        await loadAdminData();
        await refreshProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploadError(null);
    // Clear input value so selecting the same file again triggers onChange
    e.target.value = '';

    // Validate type and size (max 10MB)
    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please select a valid image file (JPEG, PNG, WEBP, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageUploadError('Image size exceeds 10MB limit. Please choose a smaller photo.');
      return;
    }

    // Immediate preview for instant visual feedback on both mobile (iPhone Safari) and desktop
    const localPreview = URL.createObjectURL(file);
    setImagePreviewUrl(localPreview);
    setIsUploadingImage(true);

    try {
      let uploadedUrl: string | null = null;
      let usedFirebase = false;

      // 1. Attempt upload to Firebase Storage (primary persistent storage)
      try {
        const fbResult = await uploadImageToFirebase(file);
        if (fbResult.url) {
          uploadedUrl = fbResult.url;
          usedFirebase = true;
        } else if (fbResult.error) {
          console.warn('Firebase Storage upload notice (will use persistent store):', fbResult.error);
        }
      } catch (fbErr: any) {
        console.warn('Firebase Storage error (will use persistent store):', fbErr);
      }

      // 2. Fallback to server persistent store via /api/upload if Firebase Storage is not activated yet
      if (!uploadedUrl) {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify({ dataUrl: base64Data, filename: file.name })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server returned error status ${res.status}`);
        }

        const data = await res.json();
        if (!data.url) {
          throw new Error('Server did not return a valid image URL');
        }
        uploadedUrl = data.url;
      }

      // Save the resulting permanent, publicly readable image URL in product record
      setEditingProduct(prev => ({
        ...prev,
        images: [uploadedUrl!, ...(prev?.images?.filter(img => img !== uploadedUrl) || [])]
      }));

      // Update preview to the permanent uploaded URL
      setImagePreviewUrl(uploadedUrl);

      if (usedFirebase) {
        showToast('Photo uploaded permanently to Firebase Storage');
      } else {
        showToast('Photo uploaded permanently to server store');
      }
    } catch (err: any) {
      const msg = err?.message || 'Image upload failed. Please try again.';
      console.error('Image upload failed:', err);
      setImageUploadError(msg);
      showToast('Image upload failed: ' + msg);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Website Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(settingsForm)
      });
      if (!res.ok) throw new Error('Failed to update settings');
      await refreshSettings();
      showToast('Store settings updated and live');
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Change PIN
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage(null);
    if (!/^\d{4}$/.test(newPin)) {
      setPinMessage({ text: 'New PIN must be exactly 4 numeric digits.', error: true });
      return;
    }
    if (newPin !== confirmPin) {
      setPinMessage({ text: 'New PIN and confirmation do not match.', error: true });
      return;
    }

    try {
      const res = await fetch('/api/admin/change-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ currentPin, newPin, confirmPin })
      });
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : null;
      if (!res.ok) {
        setPinMessage({ text: data?.error || `Failed to change PIN (${res.status})`, error: true });
      } else {
        setPinMessage({ text: 'PIN successfully changed! Please remember your new PIN.', error: false });
        if (data?.token) {
          localStorage.setItem('hamdar_admin_token', data.token);
        }
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
      }
    } catch (err: any) {
      setPinMessage({ text: err.message || 'Connection error', error: true });
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'Password must be at least 6 characters.', error: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'Passwords do not match.', error: true });
      return;
    }

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : null;
      if (!res.ok) {
        setPasswordMessage({ text: data?.error || `Failed to change password (${res.status})`, error: true });
      } else {
        setPasswordMessage({ text: 'Password successfully updated!', error: false });
        if (data?.token) {
          localStorage.setItem('hamdar_admin_token', data.token);
        }
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordMessage({ text: err.message || 'Connection error', error: true });
    }
  };

  const filteredAdminProducts = allProducts.filter(p => {
    const matchDept = productDeptFilter === 'all' || p.department === productDeptFilter;
    const matchCat = productCategoryFilter === 'all' || p.category === productCategoryFilter || p.subcategory === productCategoryFilter;
    const matchSearch = !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(productSearch.toLowerCase()));
    return matchDept && matchCat && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex bg-zinc-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full h-full bg-white flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 px-6 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-baseline tracking-widest text-xl font-black uppercase">
              {settings.logoText === 'HAMDAR' ? (
                <>
                  <span>HAMD</span>
                  <span className="text-red-600">A</span>
                  <span>R</span>
                </>
              ) : (
                <span>{settings.logoText || 'HAMDAR'}</span>
              )}
              <span className="ml-2 text-xs text-zinc-400 font-normal">Admin Suite</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-zinc-800 text-[11px] text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>WhatsApp-Only Store</span>
              {firebaseUser?.email && (
                <span className="text-zinc-400">({firebaseUser.email})</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAdminData}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
            </button>
            <div className="h-4 w-px bg-zinc-800" />
            <button
              onClick={logoutAdmin}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-red-950/80 hover:text-red-400 text-zinc-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-zinc-800 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Close admin dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Layout: Sidebar + Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside className="w-60 bg-zinc-50 border-r border-zinc-200 p-4 flex flex-col justify-between shrink-0 hidden md:flex">
            <nav className="space-y-1.5">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'products'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Products & Shoes</span>
                <span className="ml-auto text-[10px] bg-black/10 px-1.5 py-0.5 rounded font-mono">
                  {allProducts.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('inventory')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'inventory'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900'
                }`}
              >
                <Boxes className="w-4 h-4" />
                <span>Inventory & Stock</span>
              </button>

              <button
                onClick={() => setActiveTab('routing')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'routing'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Routing</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Website Content</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'security'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>PIN & Security</span>
              </button>
            </nav>

            <div className="p-3 bg-zinc-100 rounded-xl text-[11px] text-zinc-500 border border-zinc-200">
              <div className="font-semibold text-zinc-800">HAMDAR Fashion Wear</div>
              <div className="mt-0.5 text-zinc-400">All Orders Routed via WhatsApp</div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-zinc-100/50">
            {/* Mobile Tab Pill Bar */}
            <div className="flex md:hidden overflow-x-auto gap-2 pb-4 mb-4 border-b border-zinc-200">
              {(['dashboard', 'products', 'inventory', 'routing', 'settings', 'security'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap capitalize cursor-pointer ${
                    activeTab === tab ? 'bg-red-600 text-white' : 'bg-white text-zinc-700 border border-zinc-200'
                  }`}
                >
                  {tab === 'products' ? 'Products & Shoes' : tab === 'routing' ? 'WhatsApp' : tab}
                </button>
              ))}
            </div>

            {/* TAB 1: DASHBOARD OVERVIEW */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8 max-w-6xl mx-auto">
                <div>
                  <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Dashboard Overview</h1>
                  <p className="text-xs text-zinc-500 mt-1">Catalog status, department distribution, and WhatsApp order routing.</p>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {/* Total Products */}
                  <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Products</span>
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center font-bold">
                        <Package className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-zinc-900 tabular-nums">
                      {allProducts.length}
                    </div>
                  </div>

                  {/* Men's Products */}
                  <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Men's Department</span>
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-xs font-bold">
                        MEN
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-zinc-900 tabular-nums">
                      {allProducts.filter(p => p.department === 'men').length}
                    </div>
                  </div>

                  {/* Women's Products */}
                  <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Women's Department</span>
                      <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center text-xs font-bold">
                        WOMEN
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-zinc-900 tabular-nums">
                      {allProducts.filter(p => p.department === 'women').length}
                    </div>
                  </div>

                  {/* Shoes Category */}
                  <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Shoes Catalog</span>
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-xs font-bold">
                        👟
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-700 tabular-nums">
                      {allProducts.filter(p => p.category.toLowerCase() === 'shoes').length}
                    </div>
                  </div>
                </div>

                {/* WhatsApp Dispatch Rules Card */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h2 className="text-base font-bold text-zinc-900">WhatsApp-Only Order Dispatch Active</h2>
                      <p className="text-xs text-zinc-500">Orders are generated on the website and sent directly to your two department phone numbers.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                      <div className="font-bold text-zinc-900 text-sm">Men's Shop WhatsApp</div>
                      <div className="text-zinc-600">Receives: Men's Clothing, Men's Shoes, Men's Accessories</div>
                      <div className="font-mono font-bold text-emerald-700">{settings.menWhatsAppNumber}</div>
                      <a
                        href={`https://wa.me/${settings.menWhatsAppNumber.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline font-bold pt-1"
                      >
                        <span>Test WhatsApp Chat</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                      <div className="font-bold text-zinc-900 text-sm">Women's Shop WhatsApp</div>
                      <div className="text-zinc-600">Receives: Women's Knitwear, Women's Shoes, Bags, Sets</div>
                      <div className="font-mono font-bold text-emerald-700">{settings.womenWhatsAppNumber}</div>
                      <a
                        href={`https://wa.me/${settings.womenWhatsAppNumber.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline font-bold pt-1"
                      >
                        <span>Test WhatsApp Chat</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PRODUCTS & SHOES MANAGEMENT */}
            {activeTab === 'products' && (
              <div className="space-y-6 max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Product & Shoes Management</h1>
                    <p className="text-xs text-zinc-500 mt-0.5">Every product is assigned to MEN or WOMEN. Manage Shoes with dedicated subcategories.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingProduct({
                        name: '',
                        department: 'women',
                        category: 'Clothing',
                        subcategory: 'Knitwear',
                        description: '',
                        price: 29.00,
                        originalPrice: 38.00,
                        images: [],
                        sizes: ['S', 'M', 'L'],
                        colors: ['Black', 'White'],
                        stock: 20,
                        isFeatured: true,
                        isActive: true
                      });
                      setImagePreviewUrl(null);
                      setImageUploadError(null);
                      setIsProductModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Product</span>
                  </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search product name, category, or shoes..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-black"
                    />
                  </div>

                  <select
                    value={productDeptFilter}
                    onChange={(e) => setProductDeptFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 cursor-pointer focus:outline-none"
                  >
                    <option value="all">All Departments</option>
                    <option value="men">MEN Only</option>
                    <option value="women">WOMEN Only</option>
                  </select>

                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 cursor-pointer focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    <option value="Shoes">Shoes Category</option>
                    <option value="Men's Shoes">Men's Shoes</option>
                    <option value="Women's Shoes">Women's Shoes</option>
                    <option value="Clothing">Clothing</option>
                  </select>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 text-zinc-500 uppercase font-semibold border-b border-zinc-200">
                        <tr>
                          <th className="py-3 px-4">Product</th>
                          <th className="py-3 px-4">Department</th>
                          <th className="py-3 px-4">Category / Subcategory</th>
                          <th className="py-3 px-4">Price</th>
                          <th className="py-3 px-4">Stock</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredAdminProducts.map((prod) => (
                          <tr key={prod.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="py-3 px-4 flex items-center gap-3">
                              <img
                                src={prod.images[0] || '/src/assets/images/hero_fashion_models_1792786507434.jpg'}
                                alt={prod.name}
                                className="w-12 h-14 rounded-lg object-cover bg-zinc-100 border border-zinc-200 shrink-0"
                              />
                              <div>
                                <div className="font-bold text-zinc-900">{prod.name}</div>
                                <div className="text-[11px] text-zinc-400">ID: {prod.id}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-bold uppercase">
                              <span className={`px-2 py-0.5 rounded text-[11px] ${prod.department === 'men' ? 'bg-zinc-900 text-white' : 'bg-red-600 text-white'}`}>
                                {prod.department === 'men' ? "MEN" : "WOMEN"}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium text-zinc-700">
                              <div>{prod.category}</div>
                              {prod.subcategory && <div className="text-[11px] text-zinc-400">{prod.subcategory}</div>}
                            </td>
                            <td className="py-3 px-4 font-bold text-zinc-900 tabular-nums">
                              {settings.currencySymbol}{prod.price.toFixed(2)}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`font-semibold tabular-nums ${prod.stock <= 5 ? 'text-red-600' : 'text-zinc-700'}`}>
                                {prod.stock} units
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleToggleProductActive(prod)}
                                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                                  prod.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-400'
                                }`}
                              >
                                {prod.isActive ? 'Published' : 'Hidden'}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right space-x-1">
                              <button
                                onClick={() => {
                                  setEditingProduct(prod);
                                  setImagePreviewUrl(prod.images?.[0] || null);
                                  setImageUploadError(null);
                                  setIsProductModalOpen(true);
                                }}
                                className="p-1.5 text-zinc-500 hover:text-black rounded hover:bg-zinc-100 transition-colors cursor-pointer"
                                title="Edit Product"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                className="p-1.5 text-zinc-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: INVENTORY */}
            {activeTab === 'inventory' && (
              <div className="space-y-6 max-w-6xl mx-auto">
                <div>
                  <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Stock & Inventory Management</h1>
                  <p className="text-xs text-zinc-500 mt-0.5">Real-time inventory levels, low-stock alerts, and inline count updates.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allProducts.map((p) => (
                    <div key={p.id} className="bg-white p-4 rounded-xl border border-zinc-200 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={p.images[0] || '/src/assets/images/hero_fashion_models_1792786507434.jpg'}
                          alt={p.name}
                          className="w-12 h-14 rounded-lg object-cover bg-zinc-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-zinc-900 truncate">{p.name}</h4>
                          <div className="text-[10px] text-zinc-400 uppercase">{p.department} · {p.subcategory || p.category}</div>
                          <span className={`text-[11px] font-semibold ${p.stock <= 5 ? 'text-red-600' : 'text-emerald-700'}`}>
                            {p.stock <= 5 ? 'Low Stock Warning' : 'In Stock'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min="0"
                          defaultValue={p.stock}
                          onBlur={async (e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 0) {
                              await fetch(`/api/products/${p.id}`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${adminToken}`
                                },
                                body: JSON.stringify({ stock: val })
                              });
                              showToast(`Stock updated for ${p.name}`);
                              loadAdminData();
                            }
                          }}
                          className="w-16 px-2 py-1 text-xs font-bold text-center border border-zinc-300 rounded-lg focus:outline-none focus:border-black"
                        />
                        <span className="text-xs text-zinc-400">units</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: WHATSAPP ROUTING GUIDE */}
            {activeTab === 'routing' && (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div>
                  <h1 className="text-2xl font-black text-zinc-900 tracking-tight">WhatsApp Routing Configuration</h1>
                  <p className="text-xs text-zinc-500 mt-0.5">Understand and test how customer orders are dispatched to Men's and Women's specialists.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Men's Routing Panel */}
                    <div className="p-5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm uppercase text-zinc-900">Men's Shop Routing</span>
                        <span className="text-xs font-bold bg-zinc-900 text-white px-2 py-0.5 rounded">MEN</span>
                      </div>
                      <div className="text-xs text-zinc-600">
                        All products assigned to the <strong>MEN</strong> department (including Men's Shoes) are routed here.
                      </div>
                      <div className="text-sm font-bold text-emerald-700 font-mono">
                        {settings.menWhatsAppNumber}
                      </div>
                      <div className="pt-2 flex flex-col gap-2">
                        <a
                          href={`https://wa.me/${settings.menWhatsAppNumber.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Open Men's WhatsApp Chat</span>
                        </a>
                        <a
                          href={settings.menFacebookUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
                        >
                          <Facebook className="w-4 h-4" />
                          <span>Men's Facebook Official</span>
                        </a>
                      </div>
                    </div>

                    {/* Women's Routing Panel */}
                    <div className="p-5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm uppercase text-zinc-900">Women's Shop Routing</span>
                        <span className="text-xs font-bold bg-red-600 text-white px-2 py-0.5 rounded">WOMEN</span>
                      </div>
                      <div className="text-xs text-zinc-600">
                        All products assigned to the <strong>WOMEN</strong> department (including Women's Shoes) are routed here.
                      </div>
                      <div className="text-sm font-bold text-emerald-700 font-mono">
                        {settings.womenWhatsAppNumber}
                      </div>
                      <div className="pt-2 flex flex-col gap-2">
                        <a
                          href={`https://wa.me/${settings.womenWhatsAppNumber.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Open Women's WhatsApp Chat</span>
                        </a>
                        <a
                          href={settings.womenFacebookUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
                        >
                          <Facebook className="w-4 h-4" />
                          <span>Women's Facebook Official</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>Automatic Mixed-Cart Splitting</span>
                    </div>
                    <p className="leading-relaxed">
                      When a customer buys items from both departments, the checkout modal automatically prepares two distinct messages
                      with exact itemized costs and gives the customer two direct buttons: "Send Men's Order" and "Send Women's Order".
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: WEBSITE CONTENT MANAGEMENT */}
            {activeTab === 'settings' && (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div>
                  <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Website Content Management</h1>
                  <p className="text-xs text-zinc-500 mt-0.5">Update store branding, promotional banners, hero messages, and WhatsApp numbers.</p>
                </div>

                <form onSubmit={handleSaveSettings} className="bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200 shadow-2xs space-y-6">
                  {/* Branding & Announcements */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2">Store Branding</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Store Name</label>
                        <input
                          type="text"
                          value={settingsForm.storeName}
                          onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Website Logo Text</label>
                        <input
                          type="text"
                          value={settingsForm.logoText || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, logoText: e.target.value })}
                          placeholder="e.g. HAMDAR"
                          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Tagline</label>
                        <input
                          type="text"
                          value={settingsForm.tagline}
                          onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Top Announcement Bar Text</label>
                      <input
                        type="text"
                        value={settingsForm.promoBannerText}
                        onChange={(e) => setSettingsForm({ ...settingsForm, promoBannerText: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs"
                      />
                    </div>

                    {/* Section Visibility Toggles */}
                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
                      <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Homepage Section Visibility</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!settingsForm.promoBannerActive}
                            onChange={(e) => setSettingsForm({ ...settingsForm, promoBannerActive: e.target.checked })}
                            className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                          />
                          <span>Top Announcement Bar</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!settingsForm.showHero}
                            onChange={(e) => setSettingsForm({ ...settingsForm, showHero: e.target.checked })}
                            className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                          />
                          <span>Hero Showcase Banner</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!settingsForm.showCategoryBanners}
                            onChange={(e) => setSettingsForm({ ...settingsForm, showCategoryBanners: e.target.checked })}
                            className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                          />
                          <span>Category Banners</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Hero Headlines */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2">Hero Showcase Section</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Kicker Tag</label>
                        <input
                          type="text"
                          value={settingsForm.heroTag}
                          onChange={(e) => setSettingsForm({ ...settingsForm, heroTag: e.target.value })}
                          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Hero Title</label>
                        <input
                          type="text"
                          value={settingsForm.heroTitle}
                          onChange={(e) => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })}
                          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Hero Subtitle</label>
                      <textarea
                        rows={2}
                        value={settingsForm.heroSubtitle}
                        onChange={(e) => setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Hero Banner Image URL / Path</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={settingsForm.heroImageUrl || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, heroImageUrl: e.target.value })}
                          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs"
                          placeholder="/src/assets/images/hero_fashion_models_1792786507434.jpg"
                        />
                        <label className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-lg cursor-pointer text-xs font-semibold shrink-0 flex items-center gap-1">
                          <Upload className="w-3.5 h-3.5 text-zinc-600" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = async () => {
                                const dataUrl = reader.result as string;
                                try {
                                  const res = await fetch('/api/upload', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${adminToken}`
                                    },
                                    body: JSON.stringify({ dataUrl, filename: file.name })
                                  });
                                  const data = await res.json();
                                  if (data.url) {
                                    setSettingsForm(prev => ({ ...prev, heroImageUrl: data.url }));
                                    showToast('Hero image uploaded');
                                  }
                                } catch {
                                  alert('Upload failed');
                                }
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp & Facebook Config */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2">Department WhatsApp & Facebook Numbers</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
                        <div className="font-bold text-xs text-zinc-900">Men's Department Routing</div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 mb-1">WhatsApp Phone Number</label>
                          <input
                            type="text"
                            value={settingsForm.menWhatsAppNumber}
                            onChange={(e) => setSettingsForm({ ...settingsForm, menWhatsAppNumber: e.target.value })}
                            className="w-full px-3 py-1.5 border border-zinc-300 rounded bg-white text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Men's Facebook URL</label>
                          <input
                            type="text"
                            value={settingsForm.menFacebookUrl}
                            onChange={(e) => setSettingsForm({ ...settingsForm, menFacebookUrl: e.target.value })}
                            className="w-full px-3 py-1.5 border border-zinc-300 rounded bg-white text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
                        <div className="font-bold text-xs text-zinc-900">Women's Department Routing</div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 mb-1">WhatsApp Phone Number</label>
                          <input
                            type="text"
                            value={settingsForm.womenWhatsAppNumber}
                            onChange={(e) => setSettingsForm({ ...settingsForm, womenWhatsAppNumber: e.target.value })}
                            className="w-full px-3 py-1.5 border border-zinc-300 rounded bg-white text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Women's Facebook URL</label>
                          <input
                            type="text"
                            value={settingsForm.womenFacebookUrl}
                            onChange={(e) => setSettingsForm({ ...settingsForm, womenFacebookUrl: e.target.value })}
                            className="w-full px-3 py-1.5 border border-zinc-300 rounded bg-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Currency & Delivery */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2">Pricing & Delivery Thresholds</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Currency Symbol</label>
                        <input
                          type="text"
                          value={settingsForm.currencySymbol}
                          onChange={(e) => setSettingsForm({ ...settingsForm, currencySymbol: e.target.value })}
                          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Standard Delivery Fee</label>
                        <input
                          type="number"
                          step="0.5"
                          value={settingsForm.deliveryFee}
                          onChange={(e) => setSettingsForm({ ...settingsForm, deliveryFee: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Free Delivery Above ($)</label>
                        <input
                          type="number"
                          step="1"
                          value={settingsForm.freeDeliveryThreshold}
                          onChange={(e) => setSettingsForm({ ...settingsForm, freeDeliveryThreshold: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-zinc-200">
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="px-6 py-2.5 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingSettings ? 'Saving...' : 'Save Settings Live'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 6: SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-8 max-w-2xl mx-auto">
                <div>
                  <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Security Credentials</h1>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Update your 4-digit PIN challenge and account password. Credentials are cryptographically salted and hashed.
                  </p>
                </div>

                {/* Change PIN Box */}
                <form onSubmit={handleChangePin} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
                  <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-red-600" />
                    <span>Change 4-Digit Administrator PIN</span>
                  </h3>

                  {pinMessage && (
                    <div className={`p-3 rounded-lg text-xs ${pinMessage.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                      {pinMessage.text}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Current 4-Digit PIN</label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={currentPin}
                        onChange={(e) => setCurrentPin(e.target.value)}
                        placeholder="••••"
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono tracking-widest text-center"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">New 4-Digit PIN</label>
                        <input
                          type="password"
                          maxLength={4}
                          required
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value)}
                          placeholder="••••"
                          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono tracking-widest text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Confirm New PIN</label>
                        <input
                          type="password"
                          maxLength={4}
                          required
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value)}
                          placeholder="••••"
                          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono tracking-widest text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Update 4-Digit PIN
                    </button>
                  </div>
                </form>

                {/* Change Password Box */}
                <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
                  <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-zinc-600" />
                    <span>Change Account Password</span>
                  </h3>

                  {passwordMessage && (
                    <div className={`p-3 rounded-lg text-xs ${passwordMessage.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                      {passwordMessage.text}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Current Password</label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Current password"
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">New Password</label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-zinc-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Product Add/Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-base font-black text-zinc-900">
                {editingProduct?.id ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => {
                  setIsProductModalOpen(false);
                  setEditingProduct(null);
                  setImagePreviewUrl(null);
                  setImageUploadError(null);
                }}
                className="p-1 text-zinc-400 hover:text-black rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct?.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Department (Mandatory: MEN or WOMEN) *</label>
                  <select
                    value={editingProduct?.department || 'women'}
                    onChange={(e) => {
                      const dept = e.target.value as 'men' | 'women';
                      const updates: any = { department: dept };
                      if (editingProduct?.category === 'Shoes') {
                        updates.subcategory = dept === 'men' ? "Men's Shoes" : "Women's Shoes";
                      }
                      setEditingProduct({ ...editingProduct, ...updates });
                    }}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white cursor-pointer font-bold"
                  >
                    <option value="men">MEN'S SHOP (Routes to +961 76 320 279)</option>
                    <option value="women">WOMEN'S SHOP (Routes to +961 81 612 154)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={editingProduct?.price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Original Price ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingProduct?.originalPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={editingProduct?.stock || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Category *</label>
                  <select
                    value={editingProduct?.category || 'Clothing'}
                    onChange={(e) => {
                      const cat = e.target.value;
                      let sub = editingProduct?.subcategory || '';
                      if (cat === 'Shoes') {
                        sub = editingProduct?.department === 'men' ? "Men's Shoes" : "Women's Shoes";
                      }
                      setEditingProduct({ ...editingProduct, category: cat, subcategory: sub });
                    }}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white cursor-pointer font-semibold"
                  >
                    <option value="Clothing">Clothing</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Subcategory</label>
                  {editingProduct?.category === 'Shoes' ? (
                    <select
                      value={editingProduct?.subcategory || (editingProduct?.department === 'men' ? "Men's Shoes" : "Women's Shoes")}
                      onChange={(e) => {
                        const sub = e.target.value;
                        const dept = sub === "Men's Shoes" ? 'men' : 'women';
                        setEditingProduct({ ...editingProduct, subcategory: sub, department: dept });
                      }}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white cursor-pointer font-semibold"
                    >
                      <option value="Men's Shoes">Men's Shoes (MEN)</option>
                      <option value="Women's Shoes">Women's Shoes (WOMEN)</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={editingProduct?.subcategory || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, subcategory: e.target.value })}
                      placeholder="e.g. Knitwear, Hoodies..."
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct?.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                />
              </div>

              {/* Sizes and Colors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Sizes (comma separated)</label>
                  <input
                    type="text"
                    value={editingProduct?.sizes?.join(', ') || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sizes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    placeholder={editingProduct?.category === 'Shoes' ? "40, 41, 42, 43, 44" : "S, M, L, XL"}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Colors (comma separated)</label>
                  <input
                    type="text"
                    value={editingProduct?.colors?.join(', ') || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, colors: e.target.value.split(',').map(c => c.trim()).filter(Boolean) })}
                    placeholder="Black, Beige, Grey"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Product Photos & Immediate Preview */}
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block font-bold text-xs text-zinc-800 uppercase tracking-wider">
                      Product Photo
                    </label>
                    <p className="text-[11px] text-zinc-500">
                      Upload from iPhone / Android photo library or desktop. Photos persist permanently.
                    </p>
                  </div>

                  {/* Cross-browser & iPhone Safari reliable Upload Button */}
                  <div className="relative inline-flex items-center overflow-hidden shrink-0">
                    <button
                      type="button"
                      disabled={isUploadingImage}
                      className="px-3.5 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-white" />
                          <span>Upload Image File</span>
                        </>
                      )}
                    </button>
                    <input
                      id="product-photo-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      aria-label="Upload Product Image File"
                    />
                  </div>
                </div>

                {/* Upload Error Banner */}
                {imageUploadError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{imageUploadError}</p>
                      <p className="text-[11px] text-red-600/80 mt-0.5">
                        Ensure image size is under 10MB. You can also paste a permanent image URL below.
                      </p>
                    </div>
                  </div>
                )}

                {/* Immediate Visual Thumbnail Preview */}
                {(imagePreviewUrl || editingProduct?.images?.[0]) ? (
                  <div className="flex items-center gap-3.5 p-3 bg-white rounded-xl border border-zinc-200">
                    <div className="relative w-20 h-24 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 shrink-0">
                      <img
                        src={imagePreviewUrl || editingProduct?.images?.[0]}
                        alt="Product Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/src/assets/images/hero_fashion_models_1792786507434.jpg';
                        }}
                      />
                      {isUploadingImage && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 text-white text-[10px] font-bold p-1 text-center">
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                          <span>Saving...</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        {isUploadingImage ? (
                          <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Uploading to permanent storage...
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Permanent photo ready
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-zinc-500 truncate" title={imagePreviewUrl || editingProduct?.images?.[0]}>
                        {imagePreviewUrl || editingProduct?.images?.[0]}
                      </p>
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreviewUrl(null);
                            setEditingProduct(prev => ({
                              ...prev,
                              images: prev?.images ? prev.images.slice(1) : []
                            }));
                          }}
                          className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove Photo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-white rounded-xl border border-dashed border-zinc-300 text-center">
                    <ImageIcon className="w-6 h-6 text-zinc-400 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-zinc-600">No product photo selected</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Click "Upload Image File" above to pick from device or enter URL below.</p>
                  </div>
                )}

                {/* Permanent Public Image URL input */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                    Permanent Public Image URL
                  </label>
                  <input
                    type="text"
                    value={editingProduct?.images?.[0] || ''}
                    onChange={(e) => {
                      const url = e.target.value;
                      setEditingProduct({ ...editingProduct, images: url ? [url] : [] });
                      setImagePreviewUrl(url || null);
                    }}
                    placeholder="https://firebasestorage.googleapis.com/... or /api/images/..."
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white text-xs font-mono"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Saved image URL persists permanently on your site and works across page refreshes, devices, and deployments.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={editingProduct?.isFeatured || false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                    className="rounded text-red-600"
                  />
                  <span>Show as Featured Collection Item</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={editingProduct?.isActive !== false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isActive: e.target.checked })}
                    className="rounded text-red-600"
                  />
                  <span>Visible on Public Storefront</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsProductModalOpen(false);
                    setEditingProduct(null);
                    setImagePreviewUrl(null);
                    setImageUploadError(null);
                  }}
                  className="px-4 py-2 text-zinc-600 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
