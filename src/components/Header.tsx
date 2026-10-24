import React, { useState } from 'react';
import { Search, ShoppingBag, Lock, Menu, X, Phone, ChevronDown } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';

export const Header: React.FC = () => {
  const {
    settings,
    activeDepartment,
    setActiveDepartment,
    setSelectedCategory,
    setSelectedSubcategory,
    cartCount,
    setIsCartOpen,
    searchQuery,
    setSearchQuery,
    isAdminLoggedIn,
    setIsAdminModalOpen
  } = useStore();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShoesDropdownOpen, setIsShoesDropdownOpen] = useState(false);

  const handleNavClick = (dept: 'all' | 'men' | 'women' | 'shoes') => {
    setActiveDepartment(dept);
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setIsShoesDropdownOpen(false);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShoesChoice = (choice: 'all' | 'men' | 'women') => {
    setActiveDepartment('shoes');
    setSelectedCategory('Shoes');
    if (choice === 'men') {
      setSelectedSubcategory("Men's Shoes");
    } else if (choice === 'women') {
      setSelectedSubcategory("Women's Shoes");
    } else {
      setSelectedSubcategory('all');
    }
    setIsShoesDropdownOpen(false);
    setIsMobileMenuOpen(false);
    const el = document.getElementById('collection-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200">
      {/* Top Promotional Announcement Bar */}
      {settings.promoBannerActive && (
        <div className="bg-zinc-900 text-zinc-100 text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-4">
          <span>{settings.promoBannerText}</span>
          <span className="hidden md:inline text-zinc-400">|</span>
          <span className="hidden md:inline text-zinc-300">
            Men's WhatsApp: <strong className="text-white">{settings.menWhatsAppNumber}</strong> • Women's: <strong className="text-white">{settings.womenWhatsAppNumber}</strong>
          </span>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 -ml-2 text-zinc-700 hover:text-black focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo Zone */}
          <div className="flex items-center">
            <button
              onClick={() => handleNavClick('all')}
              className="group flex items-baseline tracking-widest text-2xl sm:text-3xl font-extrabold text-black cursor-pointer uppercase select-none transition-transform active:scale-95"
            >
              {settings.logoText === 'HAMDAR' ? (
                <>
                  <span>HAMD</span>
                  <span className="text-red-600 transition-colors group-hover:text-red-700">A</span>
                  <span>R</span>
                </>
              ) : (
                <span>{settings.logoText || 'HAMDAR'}</span>
              )}
              <span className="ml-2 hidden sm:inline-block text-[10px] tracking-normal font-medium text-zinc-400 uppercase py-0.5 px-1.5 border border-zinc-200 rounded">
                Fashion Wear
              </span>
            </button>
          </div>

          {/* Center Navigation Links (Clean Single-Line Typography) */}
          <nav className="hidden lg:flex items-center space-x-8 text-sm font-semibold tracking-wide uppercase">
            <button
              onClick={() => handleNavClick('all')}
              className={`py-2 transition-colors relative cursor-pointer ${
                activeDepartment === 'all'
                  ? 'text-black font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-red-600'
                  : 'text-zinc-500 hover:text-black'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleNavClick('men')}
              className={`py-2 transition-colors relative cursor-pointer ${
                activeDepartment === 'men'
                  ? 'text-black font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-red-600'
                  : 'text-zinc-500 hover:text-black'
              }`}
            >
              Men's Shop
            </button>
            <button
              onClick={() => handleNavClick('women')}
              className={`py-2 transition-colors relative cursor-pointer ${
                activeDepartment === 'women'
                  ? 'text-black font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-red-600'
                  : 'text-zinc-500 hover:text-black'
              }`}
            >
              Women's Shop
            </button>

            {/* Shoes Category with Dropdown for Men's Shoes & Women's Shoes */}
            <div
              className="relative"
              onMouseEnter={() => setIsShoesDropdownOpen(true)}
              onMouseLeave={() => setIsShoesDropdownOpen(false)}
            >
              <button
                onClick={() => setIsShoesDropdownOpen(!isShoesDropdownOpen)}
                className={`py-2 flex items-center gap-1 transition-colors relative cursor-pointer ${
                  activeDepartment === 'shoes'
                    ? 'text-black font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-red-600'
                    : 'text-zinc-500 hover:text-black'
                }`}
              >
                <span>Shoes</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Shoes choices dropdown */}
              {isShoesDropdownOpen && (
                <div className="absolute top-full left-0 w-48 bg-white border border-zinc-200 shadow-xl rounded-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => handleShoesChoice('men')}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-zinc-800 hover:bg-zinc-50 hover:text-red-600 flex items-center justify-between"
                  >
                    <span>Men's Shoes</span>
                    <span className="text-[10px] text-zinc-400 font-normal">MEN</span>
                  </button>
                  <button
                    onClick={() => handleShoesChoice('women')}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-zinc-800 hover:bg-zinc-50 hover:text-red-600 flex items-center justify-between"
                  >
                    <span>Women's Shoes</span>
                    <span className="text-[10px] text-zinc-400 font-normal">WOMEN</span>
                  </button>
                  <div className="border-t border-zinc-100 my-1" />
                  <button
                    onClick={() => handleShoesChoice('all')}
                    className="w-full text-left px-4 py-2 text-[11px] font-semibold text-zinc-500 hover:bg-zinc-50 hover:text-black"
                  >
                    All Footwear
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Icons Zone */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Bar / Trigger */}
            <div className="relative">
              {isSearchOpen ? (
                <div className="flex items-center bg-zinc-100 rounded-full px-3 py-1.5 border border-zinc-200 w-44 sm:w-64 transition-all">
                  <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search styles, shoes, sizes..."
                    className="w-full bg-transparent border-none text-xs sm:text-sm pl-2 focus:outline-none text-zinc-900"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="text-zinc-400 hover:text-zinc-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
                  title="Search products"
                  aria-label="Search products"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Admin Dashboard / Lock button */}
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className={`p-2 rounded-full transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                isAdminLoggedIn
                  ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3'
                  : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              }`}
              title={isAdminLoggedIn ? "Admin Panel Active" : "Admin Login"}
              aria-label="Admin Login"
            >
              <Lock className="w-4 h-4" />
              {isAdminLoggedIn && <span className="hidden sm:inline">Admin</span>}
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-black text-white rounded-full hover:bg-zinc-800 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
              aria-label={`Shopping bag with ${cartCount} items`}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-in fade-in">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center text-sm font-semibold">
            <button
              onClick={() => handleNavClick('all')}
              className={`p-2.5 rounded-lg border ${activeDepartment === 'all' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 text-zinc-700 border-zinc-200'}`}
            >
              All Items
            </button>
            <button
              onClick={() => handleNavClick('men')}
              className={`p-2.5 rounded-lg border ${activeDepartment === 'men' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 text-zinc-700 border-zinc-200'}`}
            >
              Men's Shop
            </button>
            <button
              onClick={() => handleNavClick('women')}
              className={`p-2.5 rounded-lg border ${activeDepartment === 'women' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 text-zinc-700 border-zinc-200'}`}
            >
              Women's Shop
            </button>
            <button
              onClick={() => handleShoesChoice('all')}
              className={`p-2.5 rounded-lg border ${activeDepartment === 'shoes' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 text-zinc-700 border-zinc-200'}`}
            >
              Shoes
            </button>
          </div>

          {/* Shoes Sub-choices in Mobile Drawer */}
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1.5">
            <div className="text-[11px] font-extrabold uppercase text-zinc-400">Shoes Categories:</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleShoesChoice('men')}
                className="py-1.5 px-3 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-800 hover:text-red-600 text-left"
              >
                👞 Men's Shoes
              </button>
              <button
                onClick={() => handleShoesChoice('women')}
                className="py-1.5 px-3 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-800 hover:text-red-600 text-left"
              >
                👠 Women's Shoes
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100 flex flex-col gap-2 text-xs text-zinc-600">
            <a
              href={`https://wa.me/${settings.menWhatsAppNumber.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-2 rounded bg-zinc-50 hover:bg-zinc-100"
            >
              <span>Men's WhatsApp: <strong>{settings.menWhatsAppNumber}</strong></span>
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
            </a>
            <a
              href={`https://wa.me/${settings.womenWhatsAppNumber.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-2 rounded bg-zinc-50 hover:bg-zinc-100"
            >
              <span>Women's WhatsApp: <strong>{settings.womenWhatsAppNumber}</strong></span>
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
