
import React from 'react';
import { DominoPiece } from './components/games/domino/BoardLogic';

export interface Game {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

export interface Balances {
  native: string;
  USDT: string;
}

export interface Domino {
  domino: [number, number];
  placement: 'left' | 'right';
  orientation?: 'horizontal' | 'vertical'; 
}
export interface Position extends Array<number> {
  0: number;
  1: number;
}

export interface BoardState {
  placedPieces: {
    piece: DominoPiece;
    position: Position;
    orientation: 'horizontal' | 'vertical';
  }[];
  headPosition: Position;
  tailPosition: Position;
  headValue: number | null;
  tailValue: number | null;
}

export interface BoardLayout {
  tiles: {
    piece: DominoPiece;
    x: number;
    y: number;
    orientation: 'horizontal' | 'vertical';
  }[];
  leftEndPos: { x: number; y: number };
  rightEndPos: { x: number; y: number };
  tileScale: number;
}