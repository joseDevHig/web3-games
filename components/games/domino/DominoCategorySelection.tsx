import React from 'react';
import type { DominoVariant } from './types';

interface CategoryCardProps {
  title: string;
  description: string;
  variant: DominoVariant;
  onSelect: (variant: DominoVariant) => void;
  disabled?: boolean;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ title, description, variant, onSelect, disabled }) => {
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
          {disabled ? 'Coming Soon' : 'Select'}
        </button>
      </div>
    </div>
  );
};


interface DominoCategorySelectionProps {
    onSelectVariant: (variant: DominoVariant) => void;
}

const DominoCategorySelection: React.FC<DominoCategorySelectionProps> = ({ onSelectVariant }) => {
  const categories = [
    {
      variant: 'internacional' as DominoVariant,
      title: 'Internacional',
      description: 'The classic game. Play to 100 or 150 points with standard rules. The player with the highest double (or heaviest tile) starts the game.'
    },
    {
      variant: 'cubano' as DominoVariant,
      title: 'Cubano',
      description: 'A strategic pairs game played to 150 points. Popular in Cuba, it focuses on teamwork and counting tiles. Highest double doesn\'t guarantee the start.'
    },
    {
      variant: 'dominicano' as DominoVariant,
      title: 'Dominicano',
      description: 'A fast-paced and competitive version from the Dominican Republic, played to 200 points. The double-six always starts the first round.'
    },
    {
      variant: 'mexicano' as DominoVariant,
      title: 'Mexicano',
      description: 'Also known as Mexican Train. A popular social variant where players build their own "trains" off a central hub. (This mode is not yet available).',
      disabled: true
    }
  ];

  return (
    <div className="py-12">
      <h2 className="font-display text-4xl md:text-5xl font-bold text-center text-amber-300 mb-12 drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">
        Choose a Game Style
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
