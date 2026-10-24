import React from 'react';
import { ArrowRight, MessageCircle, ExternalLink } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';

export const Hero: React.FC = () => {
  const { settings, setActiveDepartment } = useStore();

  const handleShopMen = () => {
    setActiveDepartment('men');
    const el = document.getElementById('collection-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleShopWomen = () => {
    setActiveDepartment('women');
    const el = document.getElementById('collection-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative bg-zinc-50 border-b border-zinc-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-zinc-500">
                {settings.heroTag || "STYLE FOR EVERYDAY"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-black tracking-tight leading-[1.1] text-balance">
              {settings.heroTitle || "Modern Looks for a Better You"}
            </h1>

            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-lg">
              {settings.heroSubtitle || "Premium clothing for men and women. Comfort, quality and timeless style."}
            </p>

            {/* Shop Buttons (Matching Uploaded Mockup) */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleShopMen}
                className="px-6 py-3.5 bg-red-600 text-white rounded-md font-bold text-sm hover:bg-red-700 transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-2 group cursor-pointer"
              >
                <span>Shop Men</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                onClick={handleShopWomen}
                className="px-6 py-3.5 bg-white text-zinc-900 border border-zinc-300 rounded-md font-bold text-sm hover:bg-zinc-100 hover:border-zinc-400 transition-all shadow-sm active:scale-95 flex items-center gap-2 group cursor-pointer"
              >
                <span>Shop Women</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Quick Department Contact Strips */}
            <div className="pt-4 border-t border-zinc-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <a
                href={`https://wa.me/${settings.menWhatsAppNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors shadow-2xs group"
              >
                <div>
                  <div className="font-semibold text-zinc-900">Men's WhatsApp Order</div>
                  <div className="text-zinc-500 text-[11px]">{settings.menWhatsAppNumber}</div>
                </div>
                <MessageCircle className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              </a>

              <a
                href={`https://wa.me/${settings.womenWhatsAppNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors shadow-2xs group"
              >
                <div>
                  <div className="font-semibold text-zinc-900">Women's WhatsApp Order</div>
                  <div className="text-zinc-500 text-[11px]">{settings.womenWhatsAppNumber}</div>
                </div>
                <MessageCircle className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>

          {/* Right Image Showcase Column */}
          <div className="lg:col-span-7 relative">
            <div className="relative rounded-2xl overflow-hidden aspect-16/10 sm:aspect-16/9 bg-zinc-200 shadow-xl border border-zinc-200">
              <img
                src={settings.heroImageUrl || "/src/assets/images/hero_fashion_models_1792786507434.jpg"}
                alt="HAMDAR Fashion Wear modern models"
                className="w-full h-full object-cover object-top hover:scale-[1.02] transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs drop-shadow">
                <span className="font-medium bg-black/60 backdrop-blur-md px-3 py-1 rounded-full">
                  New Season Collection 2026
                </span>
                <span className="hidden sm:inline font-mono text-[11px] bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full">
                  HAMDAR Official
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
