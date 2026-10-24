import React from 'react';
import { Phone, MessageCircle, Facebook, MapPin, ShieldCheck, Truck, Lock } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { Department } from '../types/index.ts';

export const Footer: React.FC = () => {
  const { settings, setActiveDepartment, setSelectedCategory, setIsAdminModalOpen } = useStore();

  const handleNav = (dept: Department | 'all', cat: string = 'All') => {
    setActiveDepartment(dept);
    setSelectedCategory(cat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-zinc-950 text-white border-t border-zinc-800">
      {/* Trust Feature Strip */}
      <div className="border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Express Delivery</h4>
              <p className="text-xs text-zinc-400 mt-0.5">Reliable dispatch across all regions of Lebanon</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Cash on Delivery</h4>
              <p className="text-xs text-zinc-400 mt-0.5">Inspect your package upon arrival before payment</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-500 shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Instant WhatsApp Ordering</h4>
              <p className="text-xs text-zinc-400 mt-0.5">Direct chat with department shopping specialists</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-baseline tracking-widest text-2xl font-black uppercase text-white">
              {settings.logoText === 'HAMDAR' ? (
                <>
                  <span>HAMD</span>
                  <span className="text-red-600">A</span>
                  <span>R</span>
                </>
              ) : (
                <span>{settings.logoText || 'HAMDAR'}</span>
              )}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              HAMDAR Fashion Wear offers timeless essentials and modern streetwear for men and women. Comfort, premium materials, and standout tailoring.
            </p>
            <div className="pt-2 text-xs text-zinc-400 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500 shrink-0" />
              <span>Lebanon · Nationwide Service</span>
            </div>
          </div>

          {/* Col 2: Men's Department */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-red-500">
              Men's Department
            </h4>
            <p className="text-xs text-zinc-400">
              Jackets, hoodies, tailored trousers, knitwear, and sneakers.
            </p>
            <div className="space-y-2 pt-1 text-xs">
              <a
                href={`https://wa.me/${settings.menWhatsAppNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>WhatsApp: {settings.menWhatsAppNumber}</span>
              </a>
              <a
                href={settings.menFacebookUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
              >
                <Facebook className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Men's Facebook Official</span>
              </a>
            </div>
          </div>

          {/* Col 3: Women's Department */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-red-500">
              Women's Department
            </h4>
            <p className="text-xs text-zinc-400">
              Chic knit co-ords, trench coats, striped tops, and accessories.
            </p>
            <div className="space-y-2 pt-1 text-xs">
              <a
                href={`https://wa.me/${settings.womenWhatsAppNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>WhatsApp: {settings.womenWhatsAppNumber}</span>
              </a>
              <a
                href={settings.womenFacebookUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
              >
                <Facebook className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Women's Facebook Official</span>
              </a>
            </div>
          </div>

          {/* Col 4: Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-300">
              Store Navigation
            </h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>
                <button onClick={() => handleNav('all')} className="hover:text-white transition-colors">
                  All Collections
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('men')} className="hover:text-white transition-colors">
                  Men's Shop
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('women')} className="hover:text-white transition-colors">
                  Women's Shop
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('all', 'Shoes')} className="hover:text-white transition-colors">
                  All Shoes
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('men', 'Shoes')} className="hover:text-white transition-colors">
                  Men's Shoes
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('women', 'Shoes')} className="hover:text-white transition-colors">
                  Women's Shoes
                </button>
              </li>
              <li className="pt-2">
                <button
                  onClick={() => setIsAdminModalOpen(true)}
                  className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Portal</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <div>
            © {new Date().getFullYear()} HAMDAR Fashion Wear. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Cash on Delivery</span>
            <span>·</span>
            <span>WhatsApp Dispatch</span>
            <span>·</span>
            <span>Lebanon</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
