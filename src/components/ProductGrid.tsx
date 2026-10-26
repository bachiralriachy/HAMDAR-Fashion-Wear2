import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Filter, Sparkles, MessageCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { ProductCard } from './ProductCard.tsx';

export const ProductGrid: React.FC = () => {
  const {
    products,
    loading,
    activeDepartment,
    setActiveDepartment,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    searchQuery,
    setSearchQuery,
    settings
  } = useStore();

  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');

  // Extract unique categories for current department
  const categories = useMemo(() => {
    let relevant = products;
    if (activeDepartment === 'men') {
      relevant = products.filter(p => p.department === 'men');
    } else if (activeDepartment === 'women') {
      relevant = products.filter(p => p.department === 'women');
    } else if (activeDepartment === 'shoes') {
      relevant = products.filter(p => p.category.toLowerCase() === 'shoes');
    }
    const set = new Set<string>();
    relevant.forEach(p => {
      if (p.category && p.category.toLowerCase() !== 'shoes') set.add(p.category);
      if (p.subcategory && !p.subcategory.includes('Shoes')) set.add(p.subcategory);
    });
    return Array.from(set);
  }, [products, activeDepartment]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Department filtering
    if (activeDepartment === 'men') {
      list = list.filter(p => p.department === 'men');
    } else if (activeDepartment === 'women') {
      list = list.filter(p => p.department === 'women');
    } else if (activeDepartment === 'shoes') {
      list = list.filter(p => p.category.toLowerCase() === 'shoes');
      if (selectedSubcategory === "Men's Shoes") {
        list = list.filter(p => p.department === 'men');
      } else if (selectedSubcategory === "Women's Shoes") {
        list = list.filter(p => p.department === 'women');
      }
    }

    // Category filter (when not in Shoes view)
    if (activeDepartment !== 'shoes' && selectedCategory !== 'all') {
      list = list.filter(
        p => p.category.toLowerCase() === selectedCategory.toLowerCase() ||
             p.subcategory?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        p => p.name.toLowerCase().includes(q) ||
             p.description.toLowerCase().includes(q) ||
             p.category.toLowerCase().includes(q) ||
             (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
             p.sizes.some(s => s.toLowerCase().includes(q)) ||
             p.colors.some(c => c.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else {
      list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return list;
  }, [products, activeDepartment, selectedCategory, selectedSubcategory, searchQuery, sortBy]);

  return (
    <section id="collection-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Department Banner if viewing specific department */}
      {activeDepartment !== 'all' && (
        <div className="mb-8 p-6 bg-zinc-900 text-white rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-red-500 font-bold mb-1">
              {activeDepartment === 'men' && "MEN'S SHOP"}
              {activeDepartment === 'women' && "WOMEN'S SHOP"}
              {activeDepartment === 'shoes' && "SHOES CATEGORY"}
            </div>
            <h2 className="text-2xl font-black">
              {activeDepartment === 'men' && "Men's Apparel & Shoes"}
              {activeDepartment === 'women' && "Women's Elegance & Footwear"}
              {activeDepartment === 'shoes' && "Footwear: Men's Shoes & Women's Shoes"}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-xl">
              {activeDepartment === 'men'
                ? "Men's clothing, footwear, and accessories. Direct WhatsApp ordering via " + settings.menWhatsAppNumber
                : activeDepartment === 'women'
                ? "Women's knit sets, dresses, footwear, and accessories. Direct WhatsApp ordering via " + settings.womenWhatsAppNumber
                : "Select Men's Shoes or Women's Shoes below. Orders automatically route to the corresponding department WhatsApp specialist."}
            </p>
          </div>

          {/* Department Contact Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {activeDepartment === 'men' && (
              <>
                <a
                  href={`https://wa.me/${settings.menWhatsAppNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp: {settings.menWhatsAppNumber}</span>
                </a>
                <a
                  href={settings.menFacebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Men's Facebook</span>
                </a>
              </>
            )}

            {activeDepartment === 'women' && (
              <>
                <a
                  href={`https://wa.me/${settings.womenWhatsAppNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp: {settings.womenWhatsAppNumber}</span>
                </a>
                <a
                  href={settings.womenFacebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Women's Facebook</span>
                </a>
              </>
            )}

            {activeDepartment === 'shoes' && (
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={`https://wa.me/${settings.menWhatsAppNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Men's: {settings.menWhatsAppNumber}</span>
                </a>
                <a
                  href={`https://wa.me/${settings.womenWhatsAppNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Women's: {settings.womenWhatsAppNumber}</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collection Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Catalog</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            {activeDepartment === 'all'
              ? 'Featured Collection'
              : activeDepartment === 'men'
              ? "Men's Collection"
              : activeDepartment === 'women'
              ? "Women's Collection"
              : 'Shoes Collection'}
          </h2>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Department Quick Tabs */}
          <div className="flex items-center p-1 bg-zinc-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => { setActiveDepartment('all'); setSelectedCategory('all'); setSelectedSubcategory('all'); }}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${activeDepartment === 'all' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-black'}`}
            >
              All
            </button>
            <button
              onClick={() => { setActiveDepartment('men'); setSelectedCategory('all'); setSelectedSubcategory('all'); }}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${activeDepartment === 'men' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-black'}`}
            >
              Men
            </button>
            <button
              onClick={() => { setActiveDepartment('women'); setSelectedCategory('all'); setSelectedSubcategory('all'); }}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${activeDepartment === 'women' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-black'}`}
            >
              Women
            </button>
            <button
              onClick={() => { setActiveDepartment('shoes'); setSelectedCategory('Shoes'); setSelectedSubcategory('all'); }}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${activeDepartment === 'shoes' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-black'}`}
            >
              Shoes
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 bg-zinc-100 px-3 py-2 rounded-lg">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none text-xs font-medium text-zinc-900 focus:outline-none cursor-pointer"
            >
              <option value="featured">Featured First</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shoes Subcategory Specific Choice Tabs (Section 3 Requirement) */}
      {activeDepartment === 'shoes' && (
        <div className="py-4 bg-zinc-50 border border-zinc-200/80 rounded-xl p-4 my-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-bold text-zinc-900 uppercase tracking-wide">Shoes Subcategories:</span>
            <span className="text-zinc-500 ml-2">Choose between Men's Shoes and Women's Shoes</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedSubcategory('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedSubcategory === 'all'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-400'
              }`}
            >
              All Shoes
            </button>
            <button
              onClick={() => setSelectedSubcategory("Men's Shoes")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedSubcategory === "Men's Shoes"
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-400'
              }`}
            >
              👞 Men's Shoes (MEN)
            </button>
            <button
              onClick={() => setSelectedSubcategory("Women's Shoes")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedSubcategory === "Women's Shoes"
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-400'
              }`}
            >
              👠 Women's Shoes (WOMEN)
            </button>
          </div>
        </div>
      )}

      {/* Category Pills / Sub-Filters for Clothing/General collections */}
      {activeDepartment !== 'shoes' && categories.length > 0 && (
        <div className="flex items-center gap-2 py-4 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Search Result Notification */}
      {searchQuery && (
        <div className="mb-6 flex items-center justify-between bg-zinc-100 px-4 py-2 rounded-lg text-xs text-zinc-700">
          <span>Search results for: <strong>"{searchQuery}"</strong> ({filteredProducts.length} items found)</span>
          <button
            onClick={() => setSearchQuery('')}
            className="text-red-600 hover:underline font-medium cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Product Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
          <RefreshCw className="w-8 h-8 animate-spin text-zinc-600 mb-3" />
          <span className="text-sm font-medium">Loading fashion catalog...</span>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-zinc-50 rounded-2xl border border-zinc-200 p-8">
          <Filter className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-800">No products found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Try adjusting your department, search keywords, or category filter to view available items.
          </p>
          <button
            onClick={() => {
              setActiveDepartment('all');
              setSelectedCategory('all');
              setSelectedSubcategory('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </section>
  );
};
