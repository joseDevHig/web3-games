import React from 'react';
import type { Game } from './types';
import { DominoIcon } from './components/icons/DominoIcon';

export const GAMES: Game[] = [
  {
    id: 'dominoes',
    name: 'Classic Dominoes',
    icon: <DominoIcon />,
    description: 'Match tiles with the same number of pips. The first to empty their hand wins.',
  },
];
