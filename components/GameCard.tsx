
import React from 'react';
import type { Game } from '../types';

interface GameCardProps {
  game: Game;
  onSelectGame: (gameId: string) => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onSelectGame }) => {
  return (
    <div 
      className="group cursor-pointer bg-gray-800/50 rounded-lg border-2 border-amber-500/40 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-400/20 transform hover:-translate-y-2"
      onClick={() => onSelectGame(game.id)}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 text-amber-300 transition-colors duration-300 group-hover:text-amber-200">
          {game.icon}
        </div>
        <h3 className="font-display text-2xl font-bold text-white mt-4">{game.name}</h3>
        <p className="text-gray-300 mt-2 text-sm h-16">{game.description}</p>
        <button className="mt-6 w-full font-display bg-green-700/80 group-hover:bg-green-600/90 text-amber-200 font-bold py-2 px-4 rounded-md shadow-md transition-all duration-300">
          Play Now
        </button>
      </div>
    </div>
  );
};

export default GameCard;