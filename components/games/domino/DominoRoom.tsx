import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import type {
  Room,
  Player,
  Domino,
  BoardTile,
  GameState,
  Match,
  DominoVariant,
  RoomMode,
} from "./types";
import DominoBoard from "./DominoBoard";
import { FiCopy } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import {
  getActivePlayers,
  getActivePlayersCount,
} from "@/components/helpers/PlayerHelper";
import { get } from "http";

// Declare firebase for any;
type Database = any;

// --- GAME CONSTANTS ---
const TURN_DURATION = 30; // seconds
const AI_THINK_TIME = 1500; // ms
const HAND_SIZE = 6;
const MATCHMAKING_TIMEOUT = 30; // seconds
const NEW_ROUND_DELAY = 5000; // 5 seconds
const TREASURY_WALLET = "0x7236A11cFB10f002f60823C12AC6f616A7Ccd4e9";

// --- GAME LOGIC HELPERS ---
const createDominoSet = (): Domino[] => {
  const set: Domino[] = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      set.push([i, j]);
    }
  }
  return set;
};

const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const sumPips = (hand: Domino[]): number => {
  return hand.reduce((acc, domino) => acc + domino[0] + domino[1], 0);
};

const setupNewRound = (
  playersForGame: Player[],
  scoreToWin: number,
  variant: DominoVariant,
  mode: RoomMode,
  existingScores?: Record<string, number>
) => {
  const numPlayers = playersForGame.length;
  const sortedPlayers = [...playersForGame].sort((a, b) =>
    a.id.localeCompare(b.id)
  );

  const hands: { [key: string]: Domino[] } = {};
  const shuffledSet = shuffle(createDominoSet());

  let playerOrder: string[] = sortedPlayers.map((p) => p.id);
  const playersWithTeams: Record<string, Player> = {};
  const teams: Record<string, string> = {};
  const teamScores: Record<string, number> = existingScores || {};

  if (mode === "1v1" && numPlayers === 2) {
    teams[sortedPlayers[0].id] = "A";
    teams[sortedPlayers[1].id] = "B";
    if (!existingScores) {
      teamScores["A"] = 0;
      teamScores["B"] = 0;
    }
  } else if (mode === "2v2" && numPlayers === 4) {
    teams[sortedPlayers[0].id] = "A";
    teams[sortedPlayers[1].id] = "B";
    teams[sortedPlayers[2].id] = "A";
    teams[sortedPlayers[3].id] = "B";
    if (!existingScores) {
      teamScores["A"] = 0;
      teamScores["B"] = 0;
    }
  } else if (mode === "free") {
    sortedPlayers.forEach((p, idx) => {
      const teamId = p.id;
      teams[p.id] = teamId;
      if (!existingScores) {
        teamScores[teamId] = 0;
      }
    });
  }

  sortedPlayers.forEach((p) => {
    hands[p.id] = shuffledSet.slice(
      sortedPlayers.indexOf(p) * HAND_SIZE,
      (sortedPlayers.indexOf(p) + 1) * HAND_SIZE
    );
    playersWithTeams[p.id] = { ...p, team: teams[p.id] };
  });

  const boneyard = shuffledSet.slice(playerOrder.length * HAND_SIZE);

  let startingPlayerId = "",
    bestDouble = -1,
    startingDomino: Domino | null = null;

  // Variant-specific starting rules
  //reglas especificas para el modo dominicano
  if (variant === "dominicano") {
    for (let d_val = 6; d_val >= 0; d_val--) {
      const double: Domino = [d_val, d_val];
      for (const p of sortedPlayers) {
        const playerHand = hands[p.id];
        const foundDomino = playerHand.find(
          (d) => d[0] === double[0] && d[1] === double[1]
        );
        if (foundDomino) {
          startingPlayerId = p.id;
          startingDomino = foundDomino;
          break;
        }
      }
      if (startingPlayerId) break;
    }
  }

  // Fallback for dominicano if no doubles, and default for 'internacional' and 'cubano'
  //sorteo para el modo dominicano si no tiene dobles, y por defecto para 'internacional' y 'cubano'
  if (!startingPlayerId) {
    for (const p of sortedPlayers)
      for (const d of hands[p.id])
        if (d[0] === d[1] && d[0] > bestDouble) {
          bestDouble = d[0];
          startingPlayerId = p.id;
          startingDomino = d;
        }
  }

  // Ultimate fallback: heaviest tile
  if (!startingPlayerId) {
    let heaviest = -1;
    for (const p of sortedPlayers)
      for (const d of hands[p.id])
        if (d[0] + d[1] > heaviest) {
          heaviest = d[0] + d[1];
          startingPlayerId = p.id;
          startingDomino = d;
        }
  }

  let test = true;
  if(test){
    startingDomino = [6, 6];
    for (const playerId in hands) {
      const hand = hands[playerId];
      const dominoIndex = hand.findIndex(d => 
        d[0] === 6 && d[1] === 6
      );
      if (dominoIndex !== -1) {
        hands[playerId] = hand.filter((_, index) => index !== dominoIndex);
        startingPlayerId = playerId;
        break;
      }
    }
  } else {
    hands[startingPlayerId] = hands[startingPlayerId].filter(
      (d) => d !== startingDomino
    );
  }
  
  const startIdx = playerOrder.indexOf(startingPlayerId);
  let board: BoardTile[] = [{ domino: startingDomino!, placement: "start" }];
  let boardEnds: [number, number] = [startingDomino![0], startingDomino![1]];
  
  if(test){
    const leftDominoes: Domino[] = [
      [6, 4], // Se conecta con el 6 del centro
      [4, 2], // Se conecta con el 4 anterior
      [2, 1], // Se conecta con el 2 anterior
      [1, 0], // Se conecta con el 1 anterior
      [0, 3], // Se conecta con el 0 anterior
      [3, 6], // Se conecta con el 3 anterior
      [6, 1], // Se conecta con el 6 anterior
      [1, 5], // Se conecta con el 1 anterior
      [5, 2]  // Se conecta con el 5 anterior
    ];
    
    const rightDominoes: Domino[] = [
      [6, 5], // Se conecta con el 6 del centro
      [5, 4], // Se conecta con el 5 anterior
      [4, 3], // Se conecta con el 4 anterior
      [3, 2], // Se conecta con el 3 anterior
      [2, 0], // Se conecta con el 2 anterior
      [0, 4], // Se conecta con el 0 anterior
      [4, 1], // Se conecta con el 4 anterior
      [1, 3], // Se conecta con el 1 anterior
      [3, 5]  // Se conecta con el 3 anterior
    ];
    
    // Verificar duplicados
    const allTestDominoes = [startingDomino!, ...leftDominoes, ...rightDominoes];
    const dominoStrings = allTestDominoes.map(d => [d[0], d[1]].sort().join(','));
    const hasDuplicates = dominoStrings.length !== new Set(dominoStrings).size;
    console.log('¿Hay fichas duplicadas?', hasDuplicates);
    if (hasDuplicates) {
      const duplicates = dominoStrings.filter((item, index) => dominoStrings.indexOf(item) !== index);
      console.log('Fichas duplicadas:', duplicates);
    }
    
    // Buscar y quitar fichas de la izquierda
    for (const testDomino of leftDominoes) {
      // Buscar en las manos primero
      let found = false;
      for (const playerId in hands) {
        const hand = hands[playerId];
        const dominoIndex = hand.findIndex(d => 
          d.includes(testDomino[0]) && d.includes(testDomino[1])
        );
        if (dominoIndex !== -1) {
          hands[playerId] = hand.filter((_, index) => index !== dominoIndex);
          found = true;
          break;
        }
      }
      // Si no se encontró en las manos, quitarla del boneyard
      if (!found) {
        const boneyardIndex = boneyard.findIndex(d => 
          d.includes(testDomino[0]) && d.includes(testDomino[1])
        );
        if (boneyardIndex !== -1) {
          boneyard.splice(boneyardIndex, 1);
        }
      }
      board.push({ domino: testDomino, placement: "left" });
    }
    
    // Buscar y quitar fichas de la derecha
    for (const testDomino of rightDominoes) {
      // Buscar en las manos primero
      let found = false;
      for (const playerId in hands) {
        const hand = hands[playerId];
        const dominoIndex = hand.findIndex(d => 
          d.includes(testDomino[0]) && d.includes(testDomino[1])
        );
        if (dominoIndex !== -1) {
          hands[playerId] = hand.filter((_, index) => index !== dominoIndex);
          found = true;
          break;
        }
      }
      // Si no se encontró en las manos, quitarla del boneyard
      if (!found) {
        const boneyardIndex = boneyard.findIndex(d => 
          d.includes(testDomino[0]) && d.includes(testDomino[1])
        );
        if (boneyardIndex !== -1) {
          boneyard.splice(boneyardIndex, 1);
        }
      }
      board.push({ domino: testDomino, placement: "right" });
    }
    
    // Actualizar extremos del tablero
    const lastLeftDomino = leftDominoes[leftDominoes.length - 1];
    const lastRightDomino = rightDominoes[rightDominoes.length - 1];
    boardEnds[0] = lastLeftDomino[1]; // Extremo izquierdo libre
    boardEnds[1] = lastRightDomino[1]; // Extremo derecho libre
  }
  const newGameState: GameState = {
    phase: "playing",
    board: board,
    boardEnds: boardEnds,
    currentPlayerId: playerOrder[(startIdx + 1) % playerOrder.length],
    playerOrder,
    passes: 0,
    teamScores,
    roundWinnerInfo: null,
    matchWinner: null,
    scoreToWin,
    matchmakingTimerEnd: null,
  };

  return {
    gameState: newGameState,
    hands,
    boneyard,
    players: playersWithTeams,
  };
};

interface DominoRoomProps {
  room?: Room; // For local AI game
  matchId?: string; // For Firebase multiplayer match
  onLeave: () => void;
  database: Database;
  address: string | null;
  sendTransaction: (
    to: string,
    amount: number,
    currency: "native" | "USDT"
  ) => Promise<string>;
  nativeCurrencySymbol: string;
}

const DominoRoom: React.FC<
  DominoRoomProps & {
    setCurrentScreen: (screen: "home" | "lobby" | "room") => void;
  }
> = ({
  room,
  matchId,
  onLeave,
  database,
  address,
  sendTransaction,
  nativeCurrencySymbol,
  setCurrentScreen,
}) => {
  const { t } = useTranslation();
  const [matchState, setMatchState] = useState<Match | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [matchmakingTimer, setMatchmakingTimer] = useState<number | null>(null);
  const [turnTimer, setTurnTimer] = useState<number>(TURN_DURATION);
  const [copied, setCopied] = useState(false);
  const isLocalGame = useMemo(() => !!room && !matchId, [room, matchId]);
  const matchRef = useMemo(
    () => (matchId ? database.ref("matches/" + matchId) : null),
    [database, matchId]
  );
  const playerRef = useMemo(
    () =>
      address && matchId
        ? database.ref(`matches/${matchId}/players/${address}`)
        : null,
    [matchId, address, database]
  );

  const playerIds = useMemo(
    () => (matchState?.players ? Object.keys(matchState.players).sort() : []),
    [matchState?.players]
  );

  const hostId = useMemo(() => {
    if (!matchState?.players) return null;
    // The host is the first player in the sorted list who is currently connected.
    // This allows for simple host migration if the original host disconnects.
    const connectedPlayerIds = playerIds.filter(
      (pid) => matchState.players[pid]?.isConnected
    );
    return connectedPlayerIds.length > 0 ? connectedPlayerIds[0] : null;
  }, [playerIds, matchState?.players]);

  const isHost = address === hostId;

  const addLog = useCallback((message: string) => {
    console.log(message);
    setLog((prev) =>
      [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 50)
    );
  }, []);

  const updateMatchState = useCallback(
    (updates: Partial<Match> | ((prevState: Match) => Match)) => {
      if (isLocalGame) {
        setMatchState((prevState) => {
          if (!prevState) return null;
          if (typeof updates === "function") {
            return updates(prevState);
          }

          return { ...prevState, ...updates };
        });
      } else if (matchRef) {
        if (typeof updates === "function") {
          console.error(
            "Functional updates not supported for Firebase match state"
          );
          return;
        }

        matchRef.update(updates);
      }
    },
    [isLocalGame, matchRef]
  );

  const startNewRound = useCallback(
    (
      playersForGame: Player[],
      scoreToWin: number,
      variant: DominoVariant,
      mode: RoomMode,
      existingScores?: Record<string, number>
    ) => {
      const { gameState, hands, boneyard, players } = setupNewRound(
        playersForGame,
        scoreToWin,
        variant,
        mode,
        existingScores
      );
      const updates: any = { gameState, hands, boneyard, players };
      updateMatchState(updates);
    },
    [updateMatchState]
  );

  // --- ROUND & MATCH ENDING LOGIC (HOST or LOCAL) ---
  const endRound = useCallback(
    async (method: "domino" | "blocked", winningPlayerId?: string) => {
      addLog("hostId " + hostId);
      if (!isHost && !isLocalGame) {
        console.error("Only the host can end a round");
        return;
      }

      let currentMatch = matchState;
      if (matchRef) {
        const snapshot = await matchRef.once("value");
        currentMatch = snapshot.val();
      }
      if (!currentMatch || currentMatch.gameState.phase !== "playing") return;

      const { hands, players, gameState, variant, mode, type, bet } =
        currentMatch;
      let roundScore = 0;
      let winningTeam: string | null = null;
      const numPlayers = Object.keys(players).length;

      if (mode === "free" && numPlayers === 3) {
        // 3-Player Free-for-all logic
        if (method === "domino" && winningPlayerId) {
          winningTeam = players[winningPlayerId].team;
          for (const pid in hands) {
            if (pid !== winningPlayerId) {
              roundScore += sumPips(hands[pid]);
            }
          }
          addLog(
            `Round won by Player ${winningTeam} by domino! They get ${roundScore} points.`
          );
        } else if (method === "blocked") {
          const playerPips = Object.keys(hands!).map((pid) => ({
            pid,
            pips: sumPips(hands![pid]),
          }));
          playerPips.sort((a, b) => a.pips - b.pips);
          const winner = players[playerPips[0].pid];
          winningTeam = winner.team;
          roundScore = playerPips.slice(1).reduce((acc, p) => acc + p.pips, 0);
          addLog(
            `Round blocked! Player ${winningTeam} wins with ${playerPips[0].pips} pips, getting ${roundScore} points.`
          );
        }
      } else {
        // Team logic (1v1, 2v2)
        if (method === "domino" && winningPlayerId) {
          winningTeam = players[winningPlayerId].team;
          for (const pid in hands) {
            if (players[pid].team !== winningTeam) {
              roundScore += sumPips(hands[pid]);
            }
          }
          addLog(
            `Round won by Team ${winningTeam} by domino! They get ${roundScore} points.`
          );
        } else if (method === "blocked") {
          const teamPips: Record<string, number> = { A: 0, B: 0 };
          for (const pid in hands) {
            teamPips[players[pid].team] += sumPips(hands[pid]);
          }

          if (teamPips.A <= teamPips.B) {
            // Team A wins on tie
            winningTeam = "A";
            roundScore = teamPips.B;
          } else {
            winningTeam = "B";
            roundScore = teamPips.A;
          }
          addLog(
            `Round blocked! Team A pips: ${teamPips.A}, Team B pips: ${teamPips.B}. Team ${winningTeam} wins ${roundScore} points.`
          );
        }
      }

      const newTeamScores = { ...gameState.teamScores };
      if (winningTeam) {
        newTeamScores[winningTeam] =
          (newTeamScores[winningTeam] || 0) + roundScore;
      }

      const newGameStateUpdate: Partial<GameState> = {
        phase: "roundOver",
        roundWinnerInfo: { team: winningTeam, score: roundScore, method },
        teamScores: newTeamScores,
      };

      if (winningTeam && newTeamScores[winningTeam] >= gameState.scoreToWin) {
        newGameStateUpdate.phase = "gameOver";
        newGameStateUpdate.matchWinner = winningTeam;
        addLog(`Match over! Team ${winningTeam} wins!`);

        if (type === "cash" && bet) {
          const totalPot = bet.amount * Object.keys(players).length;
          try {
            addLog(`Sending ${totalPot} ${bet.currency} to treasury...`);
            // The winner (host) sends the full pot to the treasury
            const txHash = await sendTransaction(
              TREASURY_WALLET,
              totalPot,
              bet.currency
            );
            addLog(`Payout successful! Tx: ${txHash.substring(0, 10)}...`);
            newGameStateUpdate.payoutProcessed = true;
          } catch (error: any) {
            console.error("Payout transaction failed:", error);
            addLog(`Error: Payout transaction failed. Code: ${error.code}`);
          }
        }
      } else {
        addLog(
          `Round over. Starting new round in ${NEW_ROUND_DELAY / 1000}s...`
        );
        setTimeout(() => {
          startNewRound(
            Object.values(players),
            gameState.scoreToWin,
            variant,
            mode,
            newTeamScores
          );
        }, NEW_ROUND_DELAY);
      }

      updateMatchState({ gameState: { ...gameState, ...newGameStateUpdate } });
    },
    [
      isHost,
      isLocalGame,
      matchRef,
      addLog,
      updateMatchState,
      matchState,
      startNewRound,
      sendTransaction,
    ]
  );

  // --- CORE GAME ACTIONS ---
  const handlePlayDomino = useCallback(
    (
      domino: Domino,
      index: number,
      end: "left" | "right",
      playerId: string
    ) => {
      if (!matchState) return;
      const { gameState, hands } = matchState;
      if (
        gameState.phase !== "playing" ||
        gameState.currentPlayerId !== playerId
      ) {
        addLog("Not the right turn or game not in progress.");
        return;
      }

      const [leftEnd, rightEnd] = gameState.boardEnds;
      const endValue = end === "left" ? leftEnd : rightEnd;
      if (!domino.includes(endValue!)) {
        addLog("Invalid move: Domino doesn't match the board end.");
        return;
      }

      const newHand = [...hands![playerId]];
      newHand.splice(index, 1);

      const newBoard = [...gameState.board, { domino, placement: end }];
      const newHands = { ...hands, [playerId]: newHand };

      if (newHand.length === 0) {
        const finalUpdate = {
          hands: newHands,
          gameState: { ...gameState, board: newBoard },
        };
        updateMatchState(finalUpdate);
        if (isHost || isLocalGame) {
          endRound("domino", playerId);
        } else {
          matchRef?.child("endRoundRequest").set({
            method: "domino",
            winningPlayerId: playerId,
          });
        }
        return;
      }

      const otherValue = domino[0] === endValue ? domino[1] : domino[0];
      const newBoardEnds: [number, number] =
        end === "left" ? [otherValue, rightEnd!] : [leftEnd!, otherValue];

      const currentPlayerIndex = gameState.playerOrder.indexOf(playerId);
      const nextPlayerId =
        gameState.playerOrder[
          (currentPlayerIndex + 1) % gameState.playerOrder.length
        ];

      const updates = {
        hands: newHands,
        gameState: {
          ...gameState,
          board: newBoard,
          boardEnds: newBoardEnds,
          currentPlayerId: nextPlayerId,
          passes: 0,
        },
      };
      updateMatchState(updates);
    },
    [matchState, updateMatchState, addLog, endRound]
  );

  const handlePassTurn = useCallback(
    (playerId: string) => {
      if (!matchState) return;
      const { gameState, players } = matchState;
      if (
        gameState.phase !== "playing" ||
        gameState.currentPlayerId !== playerId
      )
        return;

      const newPasses = gameState.passes + 1;

      if (newPasses >= Object.keys(players).length) {
        if (isHost || isLocalGame) {
          endRound("blocked");
        } else {
          matchRef?.child("endRoundRequest").set({ method: "blocked" });
        }
        return;
      }

      const currentPlayerIndex = gameState.playerOrder.indexOf(playerId);
      const nextPlayerId =
        gameState.playerOrder[
          (currentPlayerIndex + 1) % gameState.playerOrder.length
        ];

      updateMatchState({
        gameState: {
          ...gameState,
          passes: newPasses,
          currentPlayerId: nextPlayerId,
        },
      });
    },
    [matchState, endRound, updateMatchState]
  );

  useEffect(() => {
    setCurrentScreen("room");
  }, [setCurrentScreen]);

  //agrego esto nuevo para validar cualquier jugador que gane
  useEffect(() => {
    if (!matchRef || !isHost) return;

    const listener = matchRef
      .child("endRoundRequest")
      .on("value", (snapshot: { val: () => any }) => {
        const data = snapshot.val();
        if (!data) return;

        const { method, winningPlayerId } = data;
        endRound(method, winningPlayerId);

        matchRef.child("endRoundRequest").remove();
      });

    return () => {
      matchRef.child("endRoundRequest").off("value", listener);
    };
  }, [matchRef, isHost, endRound]);

  // --- FIREBASE SYNC & LIFECYCLE ---
  useEffect(() => {
    if (isLocalGame || !address || !playerRef || !matchRef) return;

    // Set connected status on entering the room
    playerRef.once("value").then((snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        // Si estaba marcado como left, lo reactivamos
        if (data.left === true) {
          console.log("Reingresando jugador que había salido", data);
          playerRef.update({ isConnected: true, left: false });
        }
        // Si nunca estuvo como left, solo aseguras conexión
        else {
          console.log("Jugador ya estaba en partida, reconectando", data);
          playerRef.update({ isConnected: true });
        }
      }
    });

    const onMatchValueChange = (snapshot: any) => {
      const data = snapshot.val() as Match;
      if (data) {
        setMatchState(data);
      } else {
        addLog("Match deleted. Returning to lobby.");
        matchRef.child("players").remove();
        onLeave();
      }
    };
    matchRef.on("value", onMatchValueChange);

    // On disconnect, mark as not connected instead of removing
    playerRef.onDisconnect().update({ isConnected: false });

    addLog(`Connected to match: ${matchId}`);

    return () => {
      matchRef.off("value", onMatchValueChange);
      playerRef.onDisconnect().cancel();
      // On graceful leave, also mark as not connected
      if (playerRef) {
        playerRef.update({ isConnected: false });
      }
    };
  }, [matchId, address, matchRef, playerRef, onLeave, addLog, isLocalGame]);

  // --- LOCAL AI GAME INIT ---
  useEffect(() => {
    if (!isLocalGame || matchState) return;

    const humanPlayer: Player = {
      id: address!,
      address: address!,
      isAI: false,
      team: "A",
      isConnected: true,
    };

    let players: Player[] = [];

    if (room!.mode === "1v1") {
      // Solo jugador humano y 1 IA
      const aiPlayer: Player = {
        id: "AI_1",
        address: "AI Opponent",
        isAI: true,
        team: "B",
      };
      players = [humanPlayer, aiPlayer];
    } else if (room!.mode === "2v2") {
      // Humano + IA aliado vs 2 IAs rivales
      const aiPlayer1: Player = {
        id: "AI_1",
        address: "AI Opponent 1",
        isAI: true,
        team: "B",
      };
      const aiPlayer2: Player = {
        id: "AI_2",
        address: "AI Partner",
        isAI: true,
        team: "A",
      };
      const aiPlayer3: Player = {
        id: "AI_3",
        address: "AI Opponent 2",
        isAI: true,
        team: "B",
      };
      players = [humanPlayer, aiPlayer1, aiPlayer2, aiPlayer3];
    } else if (room!.mode === "free") {
      // 👤 Humano + 🤖 3 IAs (todos contra todos)
      const aiPlayer1: Player = {
        id: "AI_1",
        address: "AI Opponent 1",
        isAI: true,
        team: "B",
      };
      const aiPlayer2: Player = {
        id: "AI_2",
        address: "AI Opponent 2",
        isAI: true,
        team: "C",
      };
      const aiPlayer3: Player = {
        id: "AI_3",
        address: "AI Opponent 3",
        isAI: true,
        team: "D",
      };
      players = [humanPlayer, aiPlayer1, aiPlayer2, aiPlayer3];
    }

    const {
      gameState,
      hands,
      boneyard,
      players: playersWithTeams,
    } = setupNewRound(players, room!.scoreToWin, room!.variant, room!.mode);

    const initialMatch: Match = {
      id: `local_${Date.now()}`,
      roomTemplateId: room!.id,
      roomName: room!.name,
      type: "free",
      variant: room!.variant,
      mode: room!.mode,
      maxPlayers: room!.maxPlayers,
      players: playersWithTeams,
      gameState,
      hands,
      boneyard,
    };

    setMatchState(initialMatch);
    addLog(`Local AI game started in mode: ${room!.mode}`);
  }, [isLocalGame, matchState, address, room, addLog]);

  // --- HOSTING & MATCHMAKING LOGIC ---
  const matchmakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  useEffect(() => {
    if (isLocalGame || !isHost || !matchState || !matchRef) return;
    const players = getActivePlayers(matchState.players || {});
    const playerCount = players.length;
    const { gameState, variant, mode, maxPlayers } = matchState;

    if (gameState?.phase === "waiting") {
      const connectedPlayers = players.filter((p) => p.isConnected);
      if (connectedPlayers.length === 0) {
        // If all players leave during waiting, delete the match
        matchRef.remove();
        return;
      }

      // Priority 1: If the room is full, start the game immediately.
      if (playerCount === maxPlayers) {
        // This check prevents a race condition where a matchmaking timeout could also try to start the game.
        if (matchmakingTimeoutRef.current) {
          clearTimeout(matchmakingTimeoutRef.current);
        }
        startNewRound(players, gameState.scoreToWin, variant, mode);
        return; // Important to exit after starting.
      }

      // Priority 2: If we have enough players but are not full, start a countdown timer.
      if (
        mode === "free" &&
        playerCount >= 2 &&
        !gameState.matchmakingTimerEnd
      ) {
        matchRef.child("gameState").update({
          matchmakingTimerEnd: Date.now() + MATCHMAKING_TIMEOUT * 1000,
        });
      }
    }
  }, [isHost, matchState, matchRef, startNewRound, addLog, isLocalGame]);

  // --- HOST: MATCHMAKING TIMEOUT HANDLER ---
  useEffect(() => {
    if (isLocalGame) return;
    if (matchmakingTimeoutRef.current !== null)
      clearTimeout(matchmakingTimeoutRef.current);
    if (!isHost || !matchState?.gameState?.matchmakingTimerEnd) return;

    const handleTimeout = async () => {
      const snapshot = await matchRef.once("value");
      const currentMatch = snapshot.val() as Match;
      if (!currentMatch || currentMatch.gameState?.phase !== "waiting") return;

      const players = getActivePlayers(currentMatch.players);

      if (players.length < 2) {
        await matchRef.child("gameState").update({
          matchmakingTimerEnd: null,
        });
        return;
      }

      startNewRound(
        players,
        currentMatch.gameState.scoreToWin,
        currentMatch.variant,
        currentMatch.mode
      );
    };

    const timeoutDuration =
      matchState.gameState.matchmakingTimerEnd - Date.now();

    matchmakingTimeoutRef.current = setTimeout(
      handleTimeout,
      Math.max(0, timeoutDuration)
    );

    return () => {
      if (matchmakingTimeoutRef.current)
        clearTimeout(matchmakingTimeoutRef.current);
    };
  }, [
    isHost,
    matchState?.gameState?.matchmakingTimerEnd,
    matchRef,
    startNewRound,
    isLocalGame,
  ]);

  // --- DRAW TILE LOGIC ---
  const areTilesEqual = (a: Domino, b: Domino) =>
    (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]);
  const handleDrawTile = (tile: Domino, playerAddress: string) => {
    if (!matchState) return;

    const newHands = { ...matchState.hands };
    const prevHand = newHands[playerAddress] || [];
    newHands[playerAddress] = [...prevHand, tile];

    const updatedBoneyard =
      matchState.boneyard?.filter((t) => !areTilesEqual(t, tile)) || [];

    const audio = new Audio("/stealSound.ogg");
    audio.play().catch((e) => console.error("Error playing sound:", e));

    setTimeout(() => {
      updateMatchState({
        hands: newHands,
        boneyard: updatedBoneyard,
      });
    }, 300);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500); // mensaje temporal
  };

  // --- AI TURN LOGIC ---
  useEffect(() => {
    // AI logic is handled by the host in multiplayer games, or client-side in local games.
    if (
      (!isHost && !isLocalGame) ||
      !matchState ||
      matchState.gameState.phase !== "playing"
    )
      return;

    const currentPlayerId = matchState.gameState.currentPlayerId;
    if (!currentPlayerId) return;

    const currentPlayer = matchState.players[currentPlayerId];
    if (!currentPlayer) return;

    // An AI needs to play if it's a designated AI player OR a human who has disconnected.
    const isAIControlled =
      currentPlayer.isAI || currentPlayer.isConnected === false;

    if (!isAIControlled) return;

    const aiTurnTimeout = setTimeout(() => {
      const aiHand = matchState.hands![currentPlayer.id];
      const [leftEnd, rightEnd] = matchState.gameState.boardEnds;

      let bestMove: {
        domino: Domino;
        index: number;
        end: "left" | "right";
      } | null = null;

      for (let i = 0; i < aiHand.length; i++) {
        const domino = aiHand[i];
        if (leftEnd !== null && domino.includes(leftEnd)) {
          bestMove = { domino, index: i, end: "left" };
          break;
        }
        if (
          rightEnd !== null &&
          rightEnd !== leftEnd &&
          domino.includes(rightEnd)
        ) {
          bestMove = { domino, index: i, end: "right" };
          break;
        }
      }
      if (bestMove) {
        addLog(
          `AI plays [${bestMove.domino.join("|")}] for ${currentPlayer.address}`
        );
        handlePlayDomino(
          bestMove.domino,
          bestMove.index,
          bestMove.end,
          currentPlayer.id
        );
        const audio = new Audio("/place.ogg");
        audio.play().catch((e) => console.error("Error playing sound:", e));
      } else {
        const boneyard = matchState.boneyard ?? [];
        if (boneyard.length > 0) {
          const tile = boneyard[Math.floor(Math.random() * boneyard.length)];
          addLog(
            `AI draws a tile from the boneyard for ${currentPlayer.address}`
          );
          handleDrawTile(tile, currentPlayer.id);
        } else {
          addLog(`AI passes turn for ${currentPlayer.address}.`);
          handlePassTurn(currentPlayer.id);
        }
      }
    }, AI_THINK_TIME);

    return () => clearTimeout(aiTurnTimeout);
  }, [
    isHost,
    isLocalGame,
    matchState,
    handlePlayDomino,
    handlePassTurn,
    addLog,
  ]);

  // --- UI: TIMERS ---
  useEffect(() => {
    const matchmakingTimerEnd = matchState?.gameState?.matchmakingTimerEnd;
    if (
      !matchmakingTimerEnd ||
      matchState?.gameState?.phase !== "waiting" ||
      (matchState.players && getActivePlayersCount(matchState.players) < 2)
    ) {
      setMatchmakingTimer(null);
      return;
    }
    const intervalId = setInterval(() => {
      const timeLeft = Math.round((matchmakingTimerEnd - Date.now()) / 1000);
      setMatchmakingTimer(Math.max(0, timeLeft));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [
    matchState?.gameState?.matchmakingTimerEnd,
    matchState?.gameState?.phase,
    matchState?.players,
  ]);

  useEffect(() => {
    if (matchState?.gameState.phase !== "playing") return;

    setTurnTimer(TURN_DURATION); // Reset timer on turn change
    const interval = setInterval(() => {
      setTurnTimer((prev) => {
        if (prev <= 1) {
          // Only the current player's client should trigger an auto-pass on timeout.
          // AI turns for disconnected players are handled exclusively by the host's AI logic.
          if (matchState.gameState.currentPlayerId === address) {
            handlePassTurn(address!);
          }
          return TURN_DURATION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    matchState?.gameState.currentPlayerId,
    address,
    handlePassTurn,
    matchState?.gameState.phase,
  ]);

  // --- RENDER LOGIC ---
  if (!matchState) {
    return (
      <div className="text-white text-2xl animate-pulse flex items-center justify-center h-full">
        Loading match...
      </div>
    );
  }

  const {
    gameState,
    hands,
    players: playerMap,
    maxPlayers,
    bet,
    roomCode,
  } = matchState;
  const players = getActivePlayers(playerMap) as Player[];

  if (
    gameState?.phase === "playing" ||
    gameState.phase === "roundOver" ||
    gameState.phase === "gameOver"
  ) {
    const playerHand = hands?.[address!] || [];

    return (
      <div className="h-full flex flex-col">
        <DominoBoard
          match={matchState}
          playerHand={playerHand}
          onDrawTile={(tile) => handleDrawTile(tile, address!)}
          onPlayDomino={(domino, index, end) =>
            handlePlayDomino(domino, index, end, address!)
          }
          onPassTurn={() => handlePassTurn(address!)}
          address={address}
          turnTimer={turnTimer}
          onLeave={onLeave}
          nativeCurrencySymbol={nativeCurrencySymbol}
        />
      </div>
    );
  }

  // WAITING ROOM UI (Multiplayer only)
  return (
    <div className="relative w-full h-full bg-green-900/50 rounded-lg border-2 border-dashed border-amber-500/30 flex flex-col items-center justify-center text-white p-4">
      {matchState.roomCode && (
        <p className="font-display text-2xl sm:text-3xl flex flex-col sm:flex-row gap-2 sm:gap-6 items-center">
          <span className="bg-amber-500/20 border border-amber-400 text-amber-300 px-4 py-1 rounded-lg shadow-md">
            {"💰" + t("bet")} :{" "}
            <span className="font-bold">{bet?.amount ?? 0}</span>{" "}
            {bet?.currency ?? ""}
          </span>

          <span
            onClick={handleCopy}
            className="bg-green-500/20 border border-green-400 text-green-300 px-4 py-1 rounded-lg shadow-md cursor-pointer hover:bg-green-500/30 transition select-none flex items-center gap-2"
          >
            🔑 {t("code")} : <span className="font-mono">{roomCode}</span>
            <FiCopy className="text-green-300 hover:text-green-200" size={18} />
            {copied && (
              <span className="ml-2 text-xs text-green-400">{t("copied")}</span>
            )}
          </span>
        </p>
      )}

      <h3 className="font-display text-2xl sm:text-3xl">
        {t("waitingForPlayers")}
      </h3>
      <p className="mt-4 text-amber-300 font-mono text-4xl sm:text-5xl">
        {getActivePlayersCount(playerMap)} / {maxPlayers}
      </p>

      <div className="h-12 mt-4 text-center">
        {matchmakingTimer !== null ? (
          <p className="text-base sm:text-lg animate-pulse">
            {t("waitingForMorePlayers")}{" "}
            <span className="font-bold text-xl">{matchmakingTimer}</span>s
          </p>
        ) : getActivePlayersCount(playerMap) < 2 ? (
          <p className="text-base sm:text-lg animate-pulse">
            {t("waitingForAnOpponent")}
          </p>
        ) : (
          <p className="text-base sm:text-lg">{t("preparingMatch")}</p>
        )}
      </div>

      <div className="mt-8 w-full max-w-2xl bg-black/30 p-4 rounded-lg">
        <h4 className="font-display text-amber-200 text-lg mb-2">
          {t("playersInMatch")}
        </h4>
        <div className="space-y-2">
          {players
            .filter((p) => p && p.address)
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((p) => (
              <div
                key={p.id}
                className={`p-2 rounded flex justify-between items-center ${
                  p.id === address ? "bg-amber-500/30" : "bg-gray-700/50"
                }`}
              >
                <span className="text-sm truncate">
                  {p.address.substring(0, 12)}... {p.id === address && t("you")}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    p.isConnected
                      ? "bg-green-500/70 text-green-100"
                      : "bg-red-500/70 text-red-100"
                  }`}
                >
                  {p.isConnected ? "Online" : "Offline"}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default DominoRoom;
