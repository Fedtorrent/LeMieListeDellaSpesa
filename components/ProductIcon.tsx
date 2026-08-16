import React from 'react';

interface ProductIconProps {
  emoji: string;
  category: string;
  customColorClass?: string;
}

export const getCategoryColor = (category: string): string => {
  if (!category) return 'bg-gray-100 text-gray-600';

  const standardColors: Record<string, string> = {
    'Ortofrutta': 'bg-green-100 text-green-600',
    'Carne e Pesce': 'bg-red-100 text-red-600',
    'Latticini e Uova': 'bg-yellow-100 text-yellow-600',
    'Dispensa': 'bg-orange-100 text-orange-600',
    'Surgelati': 'bg-blue-100 text-blue-600',
    'Bevande': 'bg-cyan-100 text-cyan-600',
    'Casa e Pulizia': 'bg-purple-100 text-purple-600',
    'Altro': 'bg-gray-100 text-gray-600'
  };

  if (standardColors[category]) {
    return standardColors[category];
  }

  // Custom colors - intentionally kept bright for both modes
  const dynamicColors = [
    'bg-pink-100 text-pink-600',
    'bg-indigo-100 text-indigo-600',
    'bg-teal-100 text-teal-600',
    'bg-amber-100 text-amber-600',
    'bg-lime-100 text-lime-600',
    'bg-fuchsia-100 text-fuchsia-600',
    'bg-rose-100 text-rose-600',
    'bg-violet-100 text-violet-600',
    'bg-emerald-100 text-emerald-600',
    'bg-sky-100 text-sky-600'
  ];

  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }

  return dynamicColors[Math.abs(hash) % dynamicColors.length];
};

export const ProductIcon: React.FC<ProductIconProps> = ({ emoji, category, customColorClass }) => {
  const colorClass = customColorClass || getCategoryColor(category);
  
  return (
    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 ${colorClass}`}>
      {emoji}
    </div>
  );
};