import React, { useState } from 'react';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { Product } from '../types/index.ts';
import { useStore } from '../context/StoreContext.tsx';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { settings, addToCart, setSelectedProductModal } = useStore();
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);

  const mainImage = product.images[0] || '/src/assets/images/hero_fashion_models_1792786507434.jpg';

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultSize = product.sizes[0] || 'Standard';
    const defaultColor = product.colors[0] || 'Standard';
    addToCart(product, defaultSize, defaultColor, 1);
  };

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div
      onClick={() => setSelectedProductModal(product)}
      className="group relative flex flex-col bg-white rounded-xl overflow-hidden border border-zinc-200/80 hover:border-zinc-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      {/* Product Image Box */}
      <div className="relative aspect-4/5 w-full bg-zinc-100 overflow-hidden">
        {!imageError ? (
          <img
            src={mainImage}
            alt={product.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-400 p-4">
            <ShoppingBag className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs font-medium">HAMDAR Fashion</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {product.isFeatured && (
            <span className="bg-red-600 text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded shadow-xs">
              New
            </span>
          )}
          {hasDiscount && (
            <span className="bg-black text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded shadow-xs">
              Sale
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 backdrop-blur-xs text-zinc-600 hover:text-red-600 hover:bg-white shadow-2xs transition-colors z-10"
          aria-label="Save to wishlist"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-600 text-red-600' : ''}`} />
        </button>

        {/* Quick View / Hover Action Overlay */}
        <div className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1.5 z-10">
          <button
            onClick={handleQuickAdd}
            className="flex-1 py-2 bg-black/90 hover:bg-black text-white text-xs font-semibold rounded-lg backdrop-blur-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Quick Add</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProductModal(product);
            }}
            className="p-2 bg-white/90 hover:bg-white text-zinc-800 text-xs font-semibold rounded-lg backdrop-blur-xs transition-colors shadow-sm"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-bold mb-1 flex items-center gap-1.5">
            <span className={product.department === 'men' ? 'text-zinc-900 font-extrabold' : 'text-zinc-900 font-extrabold'}>
              {product.department === 'men' ? "MEN" : "WOMEN"}
            </span>
            <span className="text-zinc-300">·</span>
            <span>{product.subcategory || product.category}</span>
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-red-600 transition-colors line-clamp-1">
            {product.name}
          </h3>
        </div>

        <div className="mt-2.5 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-zinc-900 tabular-nums">
              {settings.currencySymbol}{product.price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-zinc-400 line-through tabular-nums">
                {settings.currencySymbol}{product.originalPrice?.toFixed(2)}
              </span>
            )}
          </div>

          {product.stock <= 5 && product.stock > 0 && (
            <span className="text-[10px] font-medium text-amber-600">
              Only {product.stock} left
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
