
import type { Room } from '../components/games/domino/types';

// This data is used to seed the database if it's empty.
export const defaultCashRoomData: Omit<Room, 'id' | 'accessCode'>[] = [
  { name: '1v1 Quick Match', type: 'cash', bet: { amount: 0.05, currency: 'USDT' }, maxPlayers: 2, variant: 'internacional', scoreToWin: 100, privacy: 'public', mode: '1v1', isDefault: true },
  { name: 'Team Up 2v2', type: 'cash', bet: { amount: 0.030, currency: 'USDT' }, maxPlayers: 4, variant: 'internacional', scoreToWin: 150, privacy: 'public', mode: '2v2', isDefault: true },
  { name: 'Native Champions 2v2', type: 'cash', bet: { amount: 0.005, currency: 'native' }, maxPlayers: 4, variant: 'internacional', scoreToWin: 150, privacy: 'public', mode: '2v2', isDefault: true },
  { name: 'Flexible Table', type: 'cash', bet: { amount: 0.030, currency: 'USDT' }, maxPlayers: 4, variant: 'internacional', scoreToWin: 100, privacy: 'public', mode: 'free', isDefault: true },
  
  { name: '1v1 Rápido', type: 'cash', bet: { amount: 5, currency: 'USDT' }, maxPlayers: 2, variant: 'dominicano', scoreToWin: 200, privacy: 'public', mode: '1v1', isDefault: true },
  { name: 'Dominican Pride 2v2', type: 'cash', bet: { amount: 0.080, currency: 'USDT' }, maxPlayers: 4, variant: 'dominicano', scoreToWin: 200, privacy: 'public', mode: '2v2', isDefault: true },
  { name: 'Native Dominicano 2v2', type: 'cash', bet: { amount: 0.01, currency: 'native' }, maxPlayers: 4, variant: 'dominicano', scoreToWin: 200, privacy: 'public', mode: '2v2', isDefault: true },
  { name: 'Mesa Libre (Dom.)', type: 'cash', bet: { amount: 0.15, currency: 'USDT' }, maxPlayers: 4, variant: 'dominicano', scoreToWin: 200, privacy: 'public', mode: 'free', isDefault: true },

  { name: 'Havana Nights 2v2', type: 'cash', bet: { amount: 0.15, currency: 'USDT' }, maxPlayers: 4, variant: 'cubano', scoreToWin: 150, privacy: 'public', mode: '2v2', isDefault: true },
  { name: 'Club de Native 2v2 (Cub.)', type: 'cash', bet: { amount: 0.02, currency: 'native' }, maxPlayers: 4, variant: 'cubano', scoreToWin: 150, privacy: 'public', mode: '2v2', isDefault: true },
  { name: 'High Roller 1v1 (Cub.)', type: 'cash', bet: { amount: 0.10, currency: 'USDT' }, maxPlayers: 2, variant: 'cubano', scoreToWin: 100, privacy: 'public', mode: '1v1', isDefault: true },
  { name: 'Entrada Libre (Cub.)', type: 'cash', bet: { amount: 0.025, currency: 'USDT' }, maxPlayers: 4, variant: 'cubano', scoreToWin: 150, privacy: 'public', mode: 'free', isDefault: true },
];
