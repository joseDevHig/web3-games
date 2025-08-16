
export type Domino = [number, number];
export type DominoVariant = 'internacional' | 'cubano' | 'dominicano' | 'mexicano';
export type RoomMode = '1v1' | '2v2' | 'free';

export interface GameState {
  phase: 'waiting' | 'playing' | 'roundOver' | 'gameOver';
  board: BoardTile[];
  boardEnds: [number, number] | [null, null];
  currentPlayerId: string | null;
  playerOrder: string[]; // To maintain turn order
  passes: number;
  teamScores: Record<string, number>;
  roundWinnerInfo: { team: string | null; score: number; method: string } | null;
  matchWinner: string | null;
  matchmakingTimerEnd?: number | null; // Timestamp for when timer ends
  scoreToWin: number;
  payoutProcessed?: boolean;
}

// Represents a single game instance (a table)
export interface Match {
  id: string;
  roomTemplateId: string; // Links to the Room template
  roomName: string;
  type: 'cash' | 'free'; // 'free' matches can also be created for multiplayer
  variant: DominoVariant;
  mode: RoomMode;
  bet?: {
    amount: number;
    currency: 'native' | 'USDT';
  };
  players: Record<string, Player>;
  maxPlayers: number;
  gameState: GameState;
  hands?: Record<string, Domino[]>;
  boneyard?: Domino[];
  desertorsAddress?: string[];
  roomCode?: string;
}

// Represents a lobby entry, a template for creating matches
export interface Room {
  id: string;
  name: string;
  type: 'free' | 'cash';
  privacy: 'public' | 'private';
  accessCode?: string;
  bet?: {
    amount: number;
    currency: 'native' | 'USDT';
  };
  maxPlayers: number;
  variant: DominoVariant;
  mode: RoomMode;
  scoreToWin: number;
  createdBy?: string;
  isDefault?: boolean;
}

export interface Player {
  id: string;
  address: string; // e.g. "0x123...abc" for human, "AI 1" for bot
  isAI: boolean;
  team: string;
  isConnected?: boolean;
  isDesertor?: boolean;
}

export interface BoardTile {
  domino: Domino;
  placement: 'start' | 'left' | 'right';
}

// --- UI-specific types ---

export interface DominoBoardProps {
  match: Match;
  playerHand: Domino[];
 onDrawTile: (tile: Domino) => void;
  onPlayDomino: (domino: Domino, index: number, end: 'left' | 'right') => void;
  onPassTurn: () => void;
  address: string | null;
  turnTimer?: number;
  onLeave: () => void;
  nativeCurrencySymbol: string;
}

export interface PlayerLayoutInfo {
  player: Player;
  handSize: number;
  position: 'bottom' | 'left' | 'top' | 'right';
  isCurrent: boolean;

}