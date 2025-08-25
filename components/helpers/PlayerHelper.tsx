import { Player } from "../games/domino/types";

/**
 * Retorna lista de jugadores activos (los que no tienen `left = true`)
 */
export const getActivePlayers = (
  players: Record<string, Player> | undefined | null
): Player[] => {
  if (!players) return [];
  return Object.values(players).filter(p => !p.left);
};

/**
 * Retorna el número de jugadores activos
 */
export const getActivePlayersCount = (
  players: Record<string, Player> | undefined | null
): number => {
  return getActivePlayers(players).length;
};

export function isPlayerActive(players: Record<string, Player> = {}, playerId?: string): boolean {
  if (!playerId) return false;
  return getActivePlayers(players).some((p) => p.id === playerId);
}

/**
 * Retorna true si la cantidad de jugadores activos es al menos la requerida
 */
export const hasMinPlayers = (
  players: Record<string, Player> | undefined | null,
  min: number
): boolean => {
  return getActivePlayersCount(players) >= min;
};
