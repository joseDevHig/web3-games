import React from 'react';
import type { Game } from './types';
import { DominoIcon } from './components/icons/DominoIcon';

export const GAMES: Game[] = [
  {
    id: 'dominoes',
    name: "classicDomino",
    icon: <DominoIcon />,
    description: "dominoGameDescription",
  },
];
