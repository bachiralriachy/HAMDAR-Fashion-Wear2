import React, { useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext.tsx';
import { Header } from './components/Header.tsx';
import { Hero } from './components/Hero.tsx';
import { CategoryBanners } from './components/CategoryBanners.tsx';
import { ProductGrid } from './components/ProductGrid.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { AdminLockModal } from './components/AdminLockModal.tsx';
import { Footer } from './components/Footer.tsx';
import { Check } from 'lucide-react';

function MainStoreContent() {
  const { toastMessage, setIsAdminModalOpen, settings } = useStore();

  useEffect(() => {
    // Check if user navigated to /admin or #admin
    if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      setIsAdminModalOpen(true);
    }
  }, [setIsAdminModalOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 font-sans selection:bg-red-600 selection:text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-60 bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom duration-300 border border-zinc-800">
          <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Storefront Flow */}
      <Header />
      <main className="flex-1">
        {settings.showHero && <Hero />}
        {settings.showCategoryBanners && <CategoryBanners />}
        <ProductGrid />
      </main>
      <Footer />

      {/* Modals & Overlays */}
      <ProductDetailModal />
      <CartDrawer />
      <AdminLockModal />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <MainStoreContent />
    </StoreProvider>
  );
}
