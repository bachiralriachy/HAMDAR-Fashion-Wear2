import React, { useState } from 'react';
import { X, MessageCircle, AlertCircle, CheckCircle, ArrowRight, MapPin, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';

interface CheckoutModalProps {
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ onClose }) => {
  const {
    cart,
    cartSubtotal,
    deliveryFee,
    cartTotal,
    settings,
    isMixedCart,
    menCartItems,
    womenCartItems,
    generateWhatsAppPayload,
    setIsCartOpen
  } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [city, setCity] = useState('Beirut');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Status tracking
  const [hasOpenedSingleWhatsApp, setHasOpenedSingleWhatsApp] = useState(false);
  const [hasOpenedMenWhatsApp, setHasOpenedMenWhatsApp] = useState(false);
  const [hasOpenedWomenWhatsApp, setHasOpenedWomenWhatsApp] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const customerDetails = {
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    deliveryAddress: deliveryAddress.trim(),
    city: city.trim(),
    notes: notes.trim()
  };

  const validateInputs = (): boolean => {
    setErrorMessage(null);
    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return false;
    }
    if (!customerPhone.trim()) {
      setErrorMessage('Please enter your WhatsApp phone number.');
      return false;
    }
    if (!deliveryAddress.trim()) {
      setErrorMessage('Please enter your delivery address.');
      return false;
    }
    if (cart.length === 0) {
      setErrorMessage('Your shopping bag is empty.');
      return false;
    }
    return true;
  };

  // Generate payloads
  const singleDepartment = !isMixedCart && cart.length > 0 ? cart[0].product.department : null;
  const singlePayload = singleDepartment ? generateWhatsAppPayload(singleDepartment, customerDetails) : null;
  const menPayload = menCartItems.length > 0 ? generateWhatsAppPayload('men', customerDetails) : null;
  const womenPayload = womenCartItems.length > 0 ? generateWhatsAppPayload('women', customerDetails) : null;

  // Single Department Dispatch Handler
  const handleSendSingleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;
    if (!singlePayload) return;

    // Directly open WhatsApp with encoded message
    window.open(singlePayload.encodedUrl, '_blank');
    setHasOpenedSingleWhatsApp(true);
  };

  // Mixed Department Handlers
  const handleSendMenOrder = () => {
    if (!validateInputs()) return;
    if (!menPayload) return;

    window.open(menPayload.encodedUrl, '_blank');
    setHasOpenedMenWhatsApp(true);
  };

  const handleSendWomenOrder = () => {
    if (!validateInputs()) return;
    if (!womenPayload) return;

    window.open(womenPayload.encodedUrl, '_blank');
    setHasOpenedWomenWhatsApp(true);
  };

  const handleDone = () => {
    onClose();
    setIsCartOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">
                Send Order to WhatsApp
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              HAMDAR Fashion Wear orders are finalized by pressing <strong>Send</strong> in WhatsApp.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-black rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Post-Handoff Notification Banner */}
          {(hasOpenedSingleWhatsApp || hasOpenedMenWhatsApp || hasOpenedWomenWhatsApp) && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1.5 animate-in fade-in">
              <div className="font-bold flex items-center gap-1.5 text-emerald-900 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>WhatsApp conversation launched in a new tab!</span>
              </div>
              <p className="leading-relaxed text-emerald-800">
                Please switch to WhatsApp and press <strong>Send</strong> to submit your order directly to our shop coordinator.
                Your order is not complete until you press Send in WhatsApp.
              </p>
              <p className="text-[11px] text-emerald-700 font-medium">
                Note: Your shopping bag remains saved here if you need to review or make changes.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Fields */}
          <form id="whatsapp-order-form" onSubmit={handleSendSingleOrder} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Maya Haddad"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs sm:text-sm focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide mb-1">
                  Phone Number (WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+961 70 123 456"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs sm:text-sm focus:outline-none focus:border-black font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide mb-1">
                  Delivery Address *
                </label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street, building name, floor number"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs sm:text-sm focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide mb-1">
                  City / Region *
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs sm:text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
                >
                  <option value="Beirut">Beirut</option>
                  <option value="Mount Lebanon">Mount Lebanon</option>
                  <option value="Jounieh / Kaslik">Jounieh / Kaslik</option>
                  <option value="Byblos / Jbeil">Byblos / Jbeil</option>
                  <option value="Tripoli">Tripoli</option>
                  <option value="Saida">Saida</option>
                  <option value="Zahle">Zahle</option>
                  <option value="Nabatieh">Nabatieh</option>
                  <option value="Batroun">Batroun</option>
                  <option value="Other Lebanon Area">Other Lebanon Area</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide mb-1">
                Special Delivery Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Directions, preferred delivery hours, or gate code..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs sm:text-sm focus:outline-none focus:border-black"
              />
            </div>
          </form>

          {/* Department Destination & Routing Information */}
          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-2">
            <div className="font-bold text-zinc-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-600" />
                <span>Department Routing Destination:</span>
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                Cash on Delivery
              </span>
            </div>

            {!isMixedCart ? (
              <div className="text-zinc-700 flex items-center justify-between flex-wrap gap-2">
                <span>
                  All items belong to <strong>{singleDepartment === 'men' ? "Men's Shop" : "Women's Shop"}</strong>.
                </span>
                <span className="px-2.5 py-1 bg-white border border-zinc-300 rounded font-mono font-bold text-emerald-800 text-[11px]">
                  WhatsApp: {singleDepartment === 'men' ? settings.menWhatsAppNumber : settings.womenWhatsAppNumber}
                </span>
              </div>
            ) : (
              <div className="space-y-1.5 text-amber-900 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200">
                <div className="font-bold">Mixed Department Order Detected:</div>
                <p className="text-[11px] leading-relaxed">
                  Your bag includes {menCartItems.reduce((a, b) => a + b.quantity, 0)} Men's item(s) and {womenCartItems.reduce((a, b) => a + b.quantity, 0)} Women's item(s).
                  Because our departments operate with dedicated specialists, please use the two buttons below to send both order messages.
                </p>
                <div className="flex flex-wrap gap-3 pt-1 text-[11px] font-mono">
                  <span>• Men's: <strong>{settings.menWhatsAppNumber}</strong></span>
                  <span>• Women's: <strong>{settings.womenWhatsAppNumber}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Message Preview */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="w-full p-3 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-between text-zinc-700 font-semibold cursor-pointer transition-colors"
            >
              <span>Preview Prefilled WhatsApp Message</span>
              {showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showPreview && (
              <div className="p-3 bg-zinc-100/60 border-t border-zinc-200 space-y-3">
                {!isMixedCart && singlePayload && (
                  <pre className="p-3 bg-white rounded-lg border border-zinc-200 text-[11px] text-zinc-800 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                    {singlePayload.messageText}
                  </pre>
                )}

                {isMixedCart && (
                  <div className="space-y-3">
                    {menPayload && (
                      <div>
                        <div className="font-bold text-[11px] text-zinc-600 mb-1">Men's Message:</div>
                        <pre className="p-3 bg-white rounded-lg border border-zinc-200 text-[11px] text-zinc-800 whitespace-pre-wrap font-mono leading-relaxed max-h-36 overflow-y-auto">
                          {menPayload.messageText}
                        </pre>
                      </div>
                    )}
                    {womenPayload && (
                      <div>
                        <div className="font-bold text-[11px] text-zinc-600 mb-1">Women's Message:</div>
                        <pre className="p-3 bg-white rounded-lg border border-zinc-200 text-[11px] text-zinc-800 whitespace-pre-wrap font-mono leading-relaxed max-h-36 overflow-y-auto">
                          {womenPayload.messageText}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing Totals Bar */}
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex justify-between items-baseline">
            <div className="text-xs text-zinc-600">
              <span>Subtotal: {settings.currencySymbol}{cartSubtotal.toFixed(2)}</span>
              <span className="mx-2">·</span>
              <span>Delivery: {deliveryFee === 0 ? "FREE" : `${settings.currencySymbol}${deliveryFee.toFixed(2)}`}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-zinc-500 mr-2">Total:</span>
              <span className="text-lg font-black text-red-600 tabular-nums">
                {settings.currencySymbol}{cartTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer / Dispatch Actions */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 bg-zinc-50 shrink-0">
          {!isMixedCart ? (
            /* Single Department: One Primary Action Button */
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-zinc-600 hover:text-black cursor-pointer"
              >
                Back to Shopping Bag
              </button>

              <button
                type="submit"
                form="whatsapp-order-form"
                className="w-full sm:w-auto px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {hasOpenedSingleWhatsApp ? "Re-Open Order in WhatsApp" : "Send Order to WhatsApp"}
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          ) : (
            /* Mixed Department: Two Explicit Action Buttons */
            <div className="space-y-3">
              <div className="text-xs text-zinc-600 font-semibold text-center">
                Mixed Order: Send both messages to finalize with each department.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleSendMenOrder}
                  className={`py-3 px-3.5 font-bold text-xs rounded-xl transition-all shadow flex items-center justify-center gap-2 cursor-pointer ${
                    hasOpenedMenWhatsApp
                      ? "bg-zinc-800 text-white hover:bg-black"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {hasOpenedMenWhatsApp ? "✓ Men's Opened (Re-send)" : "Send Men's Order"}
                  </span>
                  <span className="text-[11px] opacity-80 shrink-0">({settings.menWhatsAppNumber})</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendWomenOrder}
                  className={`py-3 px-3.5 font-bold text-xs rounded-xl transition-all shadow flex items-center justify-center gap-2 cursor-pointer ${
                    hasOpenedWomenWhatsApp
                      ? "bg-zinc-800 text-white hover:bg-black"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {hasOpenedWomenWhatsApp ? "✓ Women's Opened (Re-send)" : "Send Women's Order"}
                  </span>
                  <span className="text-[11px] opacity-80 shrink-0">({settings.womenWhatsAppNumber})</span>
                </button>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-zinc-500 hover:text-black font-semibold cursor-pointer"
                >
                  Back to Bag
                </button>
                <button
                  type="button"
                  onClick={handleDone}
                  className="px-4 py-1.5 text-xs font-bold text-zinc-700 hover:text-black cursor-pointer"
                >
                  Done / Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
