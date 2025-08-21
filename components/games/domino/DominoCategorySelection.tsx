import React from 'react';
import type { DominoVariant } from './types';
import useDominoCategories from "@/hooks/useDominoCategories";
import { useTranslation } from "react-i18next";

interface CategoryCardProps {
  title: string;
  description: string;
  variant: DominoVariant;
  onSelect: (variant: DominoVariant) => void;
  disabled?: boolean;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ title, description, variant, onSelect, disabled }) => {
  const { t } = useTranslation();
  return (
    <div 
      className={`group ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} bg-gray-800/50 rounded-lg border-2 border-amber-500/40 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 ${!disabled && 'hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-400/20 transform hover:-translate-y-2'}`}
      onClick={() => !disabled && onSelect(variant)}
    >
      <div className="flex flex-col items-center text-center">
        <h3 className="font-display text-2xl font-bold text-white mt-4">{title}</h3>
        <p className="text-gray-300 mt-2 text-sm h-24">{description}</p>
        <button 
          disabled={disabled}
          className="mt-6 w-full font-display bg-green-700/80 group-hover:bg-green-600/90 text-amber-200 font-bold py-2 px-4 rounded-md shadow-md transition-all duration-300 disabled:bg-gray-600/50 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {disabled ? t('comingSoon') : t('select')}
        </button>
      </div>
    </div>
  );
};


interface DominoCategorySelectionProps {
    onSelectVariant: (variant: DominoVariant) => void;
}

const DominoCategorySelection: React.FC<DominoCategorySelectionProps> = ({ onSelectVariant }) => {
  const { t } = useTranslation();

const categories = useDominoCategories();
  return (
    <div className="py-12">
      <h2 className="font-display text-4xl md:text-5xl font-bold text-center text-amber-300 mb-12 drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">
        {t('chooseGameStyle')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {categories.map((cat) => (
          <CategoryCard 
            key={cat.variant} 
            title={cat.title} 
            description={cat.description} 
            variant={cat.variant} 
            onSelect={onSelectVariant}
            disabled={cat.disabled}
          />
        ))}
      </div>
    </div>
  );
};

export default DominoCategorySelection;
