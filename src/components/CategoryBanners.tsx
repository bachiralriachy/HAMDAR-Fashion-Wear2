import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { Department } from '../types/index.ts';

export const CategoryBanners: React.FC = () => {
  const { setActiveDepartment } = useStore();

  const handleSelect = (dept: Department) => {
    setActiveDepartment(dept);
    const el = document.getElementById('collection-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const categories = [
    {
      id: 'women' as Department,
      title: 'Women',
      subtitle: 'Chic. Comfortable. You.',
      buttonText: 'Shop Now',
      image: '/src/assets/images/product_striped_knit_top_1792786508889.jpg',
      bgClass: 'bg-zinc-900',
    },
    {
      id: 'men' as Department,
      title: 'Men',
      subtitle: 'Modern Essentials',
      buttonText: 'Shop Now',
      image: '/src/assets/images/product_hoodie_beige_1792786509010.jpg',
      bgClass: 'bg-zinc-800',
    },
    {
      id: 'shoes' as Department,
      title: 'Shoes',
      subtitle: 'Step Up Your Style',
      buttonText: 'Shop Now',
      image: '/src/assets/images/product_sneakers_retro_1792786510224.jpg',
      bgClass: 'bg-zinc-700',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => handleSelect(cat.id)}
            className="group relative h-64 sm:h-72 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
          >
            {/* Background Image */}
            <img
              src={cat.image}
              alt={cat.title}
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            {/* Dark Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent transition-opacity" />

            {/* Content Overlay */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
              <h3 className="text-2xl font-bold tracking-tight">{cat.title}</h3>
              <p className="text-sm text-zinc-300 mt-1 mb-4">{cat.subtitle}</p>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white group-hover:text-red-400 transition-colors">
                <span>{cat.buttonText}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
