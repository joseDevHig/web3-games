import React from 'react';
import type { Game } from '../types';
import GameCard from './GameCard';

interface GameLobbyProps {
  games: Game[];
  onSelectGame: (gameId: string) => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({ games, onSelectGame }) => {
  return (
    <div className="flex-1 overflow-y-auto">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {games.map((game) => (
          <GameCard key={game.id} game={game} onSelectGame={onSelectGame} />
        ))}
      </div>
    </div>
  );
};

export default GameLobby;