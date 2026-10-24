import React, { useState } from 'react';
import { X, ShoppingBag, MessageCircle, Check, ShieldCheck, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { Product } from '../types/index.ts';

interface ProductDetailModalContentProps {
  product: Product;
  onClose: () => void;
}

const ProductDetailModalContent: React.FC<ProductDetailModalContentProps> = ({ product, onClose }) => {
  const { settings, addToCart } = useStore();

  const [selectedImage, setSelectedImage] = useState<string>(product.images[0] || '');
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'Standard');
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0] || 'Standard');
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState(false);

  const isMen = product.department === 'men';
  const targetWhatsApp = isMen ? settings.menWhatsAppNumber : settings.womenWhatsAppNumber;
  const targetCleanPhone = targetWhatsApp.replace(/\D/g, '');

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleDirectWhatsApp = () => {
    const itemSubtotal = product.price * quantity;
    const fee = itemSubtotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryFee;
    const total = itemSubtotal + fee;

    const text = `HAMDAR FASHION WEAR — ${isMen ? "MEN’S ORDER" : "WOMEN’S ORDER"}\n\n` +
      `Customer: Direct Inquiry\n` +
      `Delivery address: Lebanon (Pending Details)\n\n` +
      `Products:\n` +
      `* ${product.name}\n` +
      `  Size: ${selectedSize}\n` +
      `  Color: ${selectedColor}\n` +
      `  Quantity: ${quantity}\n` +
      `  Price: ${settings.currencySymbol}${product.price.toFixed(2)}\n\n` +
      `Subtotal: ${settings.currencySymbol}${itemSubtotal.toFixed(2)}\n` +
      `Delivery fee: ${fee === 0 ? "FREE" : `${settings.currencySymbol}${fee.toFixed(2)}`}\n` +
      `Total: ${settings.currencySymbol}${total.toFixed(2)}\n\n` +
      `Please confirm product availability and delivery details.`;

    const url = `https://wa.me/${targetCleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white/90 hover:bg-white text-zinc-600 hover:text-black rounded-full shadow-md transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Image Gallery */}
        <div className="md:w-1/2 p-4 sm:p-6 bg-zinc-50 flex flex-col items-center justify-center">
          <div className="relative aspect-4/5 w-full rounded-xl overflow-hidden bg-white shadow-inner border border-zinc-200/60">
            <img
              src={selectedImage || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            {product.isFeatured && (
              <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow">
                Featured
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-2 mt-4 overflow-x-auto w-full py-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-16 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    selectedImage === img ? 'border-red-600 shadow' : 'border-zinc-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`${product.name} thumbnail ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Purchase Module */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            {/* Department & Category */}
            <div className="text-xs uppercase font-extrabold tracking-wider text-red-600 mb-1">
              {product.department === 'men' ? "Men's Shop" : product.department === 'women' ? "Women's Shop" : "Shoes"} · {product.category}
            </div>

            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
              {product.name}
            </h2>

            {/* Price Row */}
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-zinc-900 tabular-nums">
                {settings.currencySymbol}{product.price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-base text-zinc-400 line-through tabular-nums">
                  {settings.currencySymbol}{product.originalPrice?.toFixed(2)}
                </span>
              )}
              {hasDiscount && (
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  Save {settings.currencySymbol}{((product.originalPrice || 0) - product.price).toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock indicator */}
            <div className="mt-2 text-xs font-semibold flex items-center gap-1.5">
              {product.stock > 0 ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  In Stock ({product.stock} units available)
                </span>
              ) : (
                <span className="text-red-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  Out of Stock
                </span>
              )}
            </div>

            {/* Description */}
            <p className="mt-4 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-b border-zinc-100 py-3">
              {product.description || "Designed with premium fabrics and modern tailoring for everyday confidence and effortless style."}
            </p>

            {/* Size Selector */}
            {product.sizes.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between items-center text-xs font-bold text-zinc-800 mb-2 uppercase tracking-wide">
                  <span>Select Size</span>
                  <span className="text-zinc-400 font-normal lowercase">selected: {selectedSize}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        selectedSize === s
                          ? 'border-black bg-black text-white shadow-xs'
                          : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between items-center text-xs font-bold text-zinc-800 mb-2 uppercase tracking-wide">
                  <span>Select Color</span>
                  <span className="text-zinc-400 font-normal lowercase">selected: {selectedColor}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        selectedColor === c
                          ? 'border-red-600 bg-red-50 text-red-900 font-bold'
                          : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-4 flex items-center gap-4">
              <span className="text-xs font-bold text-zinc-800 uppercase tracking-wide">Quantity:</span>
              <div className="flex items-center border border-zinc-300 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 text-zinc-600 hover:bg-zinc-100 font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="px-3 py-1 text-xs font-bold tabular-nums text-zinc-900 min-w-8 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                  className="px-3 py-1 text-zinc-600 hover:bg-zinc-100 font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-4">
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer ${
                isAdded
                  ? 'bg-emerald-600 text-white'
                  : product.stock > 0
                  ? 'bg-black text-white hover:bg-zinc-800'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Shopping Cart</span>
                </>
              )}
            </button>

            <button
              onClick={handleDirectWhatsApp}
              className="w-full py-3 px-6 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-all shadow-xs active:scale-98 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Order Directly on WhatsApp ({targetWhatsApp})</span>
            </button>

            {/* Trust Markers */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-500 pt-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <Truck className="w-3.5 h-3.5 text-zinc-400" />
                <span>Fast Delivery Lebanon-wide</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                <span>Cash on Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProductDetailModal: React.FC = () => {
  const { selectedProductModal, setSelectedProductModal } = useStore();

  if (!selectedProductModal) {
    return null;
  }

  return (
    <ProductDetailModalContent
      key={selectedProductModal.id}
      product={selectedProductModal}
      onClose={() => setSelectedProductModal(null)}
    />
  );
};
