import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, MessageCircle, AlertCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { CheckoutModal } from './CheckoutModal.tsx';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    deliveryFee,
    cartTotal,
    settings,
    isMixedCart,
    menCartItems,
    womenCartItems
  } = useStore();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (!isCartOpen) return null;

  const menSubtotal = menCartItems.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
  const womenSubtotal = womenCartItems.reduce((acc, i) => acc + i.product.price * i.quantity, 0);

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div
          className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cart Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-extrabold text-zinc-900 tracking-tight">Shopping Bag</h2>
              <span className="text-xs bg-zinc-200 text-zinc-700 font-bold px-2 py-0.5 rounded-full">
                {cart.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            </div>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-zinc-400 hover:text-red-600 font-medium transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-zinc-500 hover:text-black rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center text-zinc-400">
                <ShoppingBag className="w-12 h-12 stroke-1 mb-3 text-zinc-300" />
                <h3 className="text-base font-bold text-zinc-800">Your bag is empty</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                  Browse our Men's and Women's collections and add your favorite clothing or footwear.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-6 px-5 py-2.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                {/* Mixed Cart Notice */}
                {isMixedCart && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Mixed Department Bag</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Your bag includes items from both <strong>Men's</strong> and <strong>Women's</strong> departments.
                      In the next step, your order details will be prepared for each department's dedicated WhatsApp coordinator.
                    </p>
                  </div>
                )}

                {/* Items loop with explicit Department Label */}
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 items-center"
                    >
                      <img
                        src={item.product.images[0] || '/src/assets/images/hero_fashion_models_1792786507434.jpg'}
                        alt={item.product.name}
                        className="w-16 h-20 rounded-lg object-cover bg-white shrink-0 border border-zinc-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        {/* Clear Department Badge (Section 2 Requirement) */}
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className={`text-[10px] font-black uppercase px-1.5 py-0.2 rounded ${
                            item.product.department === 'men'
                              ? 'bg-zinc-900 text-white'
                              : 'bg-red-600 text-white'
                          }`}>
                            {item.product.department === 'men' ? "MEN'S SHOP" : "WOMEN'S SHOP"}
                          </span>
                          <span className="text-[11px] text-zinc-400">· {item.product.subcategory || item.product.category}</span>
                        </div>

                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold text-zinc-900 truncate">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-zinc-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          Size: <span className="font-semibold text-zinc-800">{item.size}</span> · Color: <span className="font-semibold text-zinc-800">{item.color}</span>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-zinc-300 rounded bg-white">
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-bold tabular-nums text-zinc-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <span className="text-xs font-bold text-zinc-900 tabular-nums">
                            {settings.currencySymbol}{(item.product.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-zinc-200 bg-zinc-50 space-y-3">
              {/* Cost summary */}
              <div className="space-y-1.5 text-xs">
                {isMixedCart ? (
                  <>
                    <div className="flex justify-between text-zinc-600">
                      <span>Men's Items Subtotal ({menCartItems.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                      <span className="font-bold text-zinc-900 tabular-nums">
                        {settings.currencySymbol}{menSubtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>Women's Items Subtotal ({womenCartItems.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                      <span className="font-bold text-zinc-900 tabular-nums">
                        {settings.currencySymbol}{womenSubtotal.toFixed(2)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal</span>
                    <span className="font-bold text-zinc-900 tabular-nums">
                      {settings.currencySymbol}{cartSubtotal.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-zinc-600">
                  <span>Delivery (Lebanon)</span>
                  <span className="font-bold text-zinc-900 tabular-nums">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      `${settings.currencySymbol}${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm font-extrabold text-zinc-900 pt-2 border-t border-zinc-200">
                  <span>Estimated Total</span>
                  <span className="text-base text-red-600 tabular-nums">
                    {settings.currencySymbol}{cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Recipient WhatsApp info banner */}
              <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-lg text-[11px] text-emerald-900">
                {!isMixedCart ? (
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      Order will be sent to <strong>{cart[0]?.product.department === 'men' ? "Men's Shop" : "Women's Shop"}</strong> ({cart[0]?.product.department === 'men' ? settings.menWhatsAppNumber : settings.womenWhatsAppNumber})
                    </span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <div className="font-bold flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Separate WhatsApp Routing:</span>
                    </div>
                    <div>• Men's: <strong>{settings.menWhatsAppNumber}</strong></div>
                    <div>• Women's: <strong>{settings.womenWhatsAppNumber}</strong></div>
                  </div>
                )}
              </div>

              {/* Main Checkout Trigger: Opens WhatsApp Order Details Form */}
              <div className="pt-1">
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Order to WhatsApp</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Checkout / Details Collection Modal */}
      {isCheckoutOpen && (
        <CheckoutModal onClose={() => setIsCheckoutOpen(false)} />
      )}
    </>
  );
};
