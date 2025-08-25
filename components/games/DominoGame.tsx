import React, { useState, useMemo, useEffect } from "react";
import DominoLobby from "./domino/DominoLobby";
import DominoRoom from "./domino/DominoRoom";
import type { Room, Match, Player, DominoVariant } from "./domino/types";
import DominoCategorySelection from "./domino/DominoCategorySelection";
import type { Balances } from "../../types";
import { ConfirmModal } from "../Modal";
import { useTranslation } from "react-i18next";
import { getActivePlayersCount } from "../helpers/PlayerHelper";
import { get } from "http";

// Declare firebase for global script
declare const firebase: any;

interface DominoGameProps {
  onGoBack: () => void;
  address: string | null;
  balances: Balances | null;
  sendTransaction: (
    to: string,
    amount: number,
    currency: "native" | "USDT"
  ) => Promise<string>;
  nativeCurrencySymbol: string;
  setBackButtonHandler: (handler: () => void) => void;
  preselectedMatchId?: string | null;
  gamePhaseWaiting?: boolean;
  isSelectVariant?: boolean;
}

const DominoGame: React.FC<
  DominoGameProps & {
    setCurrentScreen: (screen: "home" | "lobby" | "room") => void;
  }
> = ({
  onGoBack,
  address,
  balances,
  sendTransaction,
  nativeCurrencySymbol,
  setBackButtonHandler,
  preselectedMatchId,
  gamePhaseWaiting,
  setCurrentScreen,
}) => {
  const { t } = useTranslation();
  const [localAIRoom, setLocalAIRoom] = useState<Room | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [pendingReconnectMatch, setPendingReconnectMatch] = useState<
    string | null
  >(null);
  const [selectedVariant, setSelectedVariant] = useState<DominoVariant | null>(
    null
  );

  const [isFindingMatch, setIsFindingMatch] = useState(false);
  const [showExitGameModal, setShowExitGameModal] = useState(false);
  const [isWaitingForPlayers, setIsWaitingForPlayers] = useState(false);

  const database = useMemo(() => {
    // IMPORTANT: Replace with your own Firebase project configuration
    const firebaseConfig = {
      apiKey: "AIzaSyCoo8w_k_Im-lC3ISekGoM-wJdbVl6KvGQ",
      authDomain: "web3-games-18aaf.firebaseapp.com",
      projectId: "web3-games-18aaf",
      storageBucket: "web3-games-18aaf.firebasestorage.app",
      messagingSenderId: "12418607349",
      appId: "1:12418607349:web:7d68992ebc426d873bbdbc",
      databaseURL: "https://web3-games-18aaf-default-rtdb.firebaseio.com",
    };

    if (typeof firebase !== "undefined" && !firebase.apps.length) {
      try {
        firebase.initializeApp(firebaseConfig);
        return firebase.database();
      } catch (error) {
        console.error("Firebase initialization error:", error);
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          (error as { code?: string }).code === "app/duplicate-app"
        ) {
          return firebase.app().database();
        }
        if (
          firebaseConfig.apiKey === "AIzaSyCoo8w_k_Im-lC3ISekGoM-wJdbVl6KvGQ"
        ) {
          console.warn(
            "Firebase config is using placeholders. Please replace them in components/games/DominoGame.tsx"
          );
        }
        return null;
      }
    } else if (typeof firebase !== "undefined") {
      return firebase.app().database();
    }
    return null;
  }, []);

  useEffect(() => {
    if (preselectedMatchId || selectedMatchId || localAIRoom) {
      setCurrentScreen("room");
    } else if (selectedVariant) {
      setCurrentScreen("lobby");
    } else {
      setCurrentScreen("home");
    }
  }, [
    preselectedMatchId,
    selectedMatchId,
    localAIRoom,
    selectedVariant,
    setCurrentScreen,
  ]);

  // Effect to manage the Home button's behavior based on the current view
  useEffect(() => {
    const goBackOneStep = () => {
      // From a game room back to the variant's lobby
      if (selectedMatchId || localAIRoom || preselectedMatchId) {
        setShowExitGameModal(true);
        return;
      }
      // From a variant's lobby back to category selection
      if (selectedVariant) {
        setSelectedVariant(null);
        return;
      }
      // From category selection back to the main casino lobby
      onGoBack();
    };

    setBackButtonHandler(() => goBackOneStep);

    // Cleanup function to reset the handler when DominoGame unmounts
    return () => {
      setBackButtonHandler(() => onGoBack);
    };
  }, [localAIRoom, selectedMatchId, selectedVariant]);

  useEffect(() => {
    const checkActiveMatch = async () => {
      if (!address || !database) return;

      try {
        const matchesRef = database.ref("matches");
        const userMatchesQuery = matchesRef
          .orderByChild(`players/${address}/id`)
          .equalTo(address);

        const snapshot = await userMatchesQuery.once("value");
        const activeMatches = snapshot.val();

        if (activeMatches) {
          for (const matchId in activeMatches) {
            const match = activeMatches[matchId];

            const isDeserter =
              Array.isArray(match.desertorsAddress) &&
              match.desertorsAddress.includes(address);

            if (match.gameState?.phase !== "gameOver" && !isDeserter) {
              console.log(`Encontrada partida activa ${matchId}`);
              setPendingReconnectMatch(matchId);

              return;
            }
          }
        }
      } catch (error) {
        console.error("Error comprobando partida activa:", error);
      }
    };

    checkActiveMatch();
  }, [address, database]);

  const handleExitGame = async (matchId: string) => {
    if (!address || !database) return;

    try {
      const matchRef = database.ref(`matches/${matchId}`);
      const snapshot = await matchRef.once("value");

      if (!snapshot.exists()) {
        console.log("No existe un match con ese ID");
        return;
      }

      const matchData = snapshot.val();
      const players = matchData.players || {};
      const playersCount = getActivePlayersCount(players);

      if (matchData.gameState?.phase === "waiting") {
        if (playersCount < 2) {
          // Caso: menos de 2 jugadores → eliminar match (y room si aplica)
          const updates: Record<string, null> = {
            [`matches/${matchId}`]: null,
          };

          if (matchData.roomTemplateId) {
            const roomSnap = await database
              .ref(`rooms/${matchData.roomTemplateId}`)
              .once("value");
            if (roomSnap.exists() && roomSnap.val()?.createdBy === "user") {
              updates[`rooms/${matchData.roomTemplateId}`] = null;
            }
          }

          await database.ref().update(updates);
          console.log(
            "Match eliminada y room asociada (si era creada por usuario)"
          );
        } else {
          console.log(
            `Jugador ${address} marcándose como left en match ${matchId}`
          );

          const playerRef = matchRef.child(`players/${address}`);
          await playerRef.update({
            isConnected: false,
            left: true,
            updatedAt: Date.now(),
          });
          await matchRef.update({
            updatedAt: Date.now(),
          });

          if (getActivePlayersCount(players) < 2) {
            await matchRef.child("gameState").update({
              matchmakingTimerEnd: null,
            });
            return;
          }
          console.log(
            `Jugador ${address} marcado como left y estado refrescado`
          );
        }
      } else if (matchData.gameState?.phase === "playing") {
        const desertorsRef = matchRef.child("desertorsAddress");
        await desertorsRef.transaction((current: string | string[]) => {
          if (current) {
            if (!Array.isArray(current)) return [address];
            if (!current.includes(address)) return [...current, address];
            return current;
          }
          return [address];
        });

        await matchRef.update({
          updatedAt: Date.now(),
        });

        console.log(`Jugador ${address} agregado a desertors`);
      }
    } catch (error) {
      console.error("Error obteniendo o actualizando el match:", error);
    }

    setSelectedVariant(null);
    setSelectedMatchId(null);
    setShowExitGameModal(false);
  };

  const handleFindOrCreateMatch = async (room: Room) => {
    if (!address || !database) return;

    if (room.type === "cash" && room.bet) {
      if (!balances) {
        alert("Could not retrieve your wallet balance. Please try again.");
        return;
      }
      const userBalance = parseFloat(
        room.bet.currency === "native" ? balances.native : balances.USDT
      );
      const currencySymbol =
        room.bet.currency === "native" ? nativeCurrencySymbol : "USDT";

      if (userBalance < room.bet.amount) {
        alert(
          `Insufficient balance. You need at least ${room.bet.amount} ${currencySymbol} to join this room. Please recharge your wallet and try again.`
        );
        return;
      }
    }

    setIsFindingMatch(true);
    const matchesRef = database.ref("matches");

    try {
      if (room.createdBy === "user") {
        const userRoomQuery = matchesRef
          .orderByChild("roomTemplateId")
          .equalTo(room.id);
        const snapshot = await userRoomQuery.once("value");
        const matches = snapshot.val();

        if (matches) {
          const hasActiveMatch = Object.values(matches).some(
            (match: any) => match.gameState?.phase === "playing"
          );

          if (hasActiveMatch) {
            alert(
              "This user-created room is already in progress and can only be used once."
            );
            setIsFindingMatch(false);
            return;
          }
        }
      }

      // --- NEW: RECONNECTION LOGIC ---
      // First, check if the user has an ongoing match for this variant that isn't finished.
      console.log("esta entrando a la lógica de reconexión cuando me salgo");
      const userMatchesQuery = matchesRef
        .orderByChild(`players/${address}/id`)
        .equalTo(address);
      const snapshot = await userMatchesQuery.once("value");
      const activeMatches = snapshot.val();

      if (activeMatches) {
        for (const matchId in activeMatches) {
          const match: Match = activeMatches[matchId];

          const isDeserter =
            Array.isArray(match.desertorsAddress) &&
            match.desertorsAddress.includes(address);

          if (!isDeserter) {
            if (
              match.variant === room.variant &&
              match.gameState.phase !== "gameOver"
            ) {
              console.log(`Found an active match ${matchId}. Reconnecting...`);
              setSelectedMatchId(matchId);
              setIsFindingMatch(false);
              return; // Reconnected, so we stop here.
            }
          }
        }
      }
      // --- END: RECONNECTION LOGIC ---

      // No active match to reconnect to, proceed with normal matchmaking.
      const query = matchesRef.orderByChild("roomTemplateId").equalTo(room.id);

      const openMatchesSnapshot = await query.once("value");
      const openMatches = openMatchesSnapshot.val() || {};

      let joinedMatchId: string | null = null;

      // Try to join an existing match
      for (const matchId in openMatches) {
        const match = openMatches[matchId];
        const playerCount = match.players
          ? getActivePlayersCount(match.players)
          : 0;

        if (
          match.gameState?.phase === "waiting" &&
          playerCount > 0 &&
          playerCount < room.maxPlayers
        ) {
          const matchPlayersRef = database.ref(`matches/${matchId}/players`);
          const { committed } = await matchPlayersRef.transaction(
            (players: {
              [x: string]: {
                id: string;
                address: string;
                isAI: boolean;
                team: string;
                isConnected: boolean;
                left?: boolean;
              };
            }) => {
              if (
                !players ||
                getActivePlayersCount(players) < room.maxPlayers
              ) {
                if (!players) players = {};
                players[address] = {
                  id: address,
                  address,
                  isAI: false,
                  team: "A",
                  isConnected: true,
                  left: false,
                };
                return players;
              }
              return; // Abort if full
            }
          );

          if (committed) {
            joinedMatchId = matchId;
            break;
          }
        }
      }

      if (joinedMatchId) {
        setSelectedMatchId(joinedMatchId);
      } else {
        // No open match found, create a new one
        const newPlayer: Player = {
          id: address,
          address,
          isAI: false,
          team: "A",
          isConnected: true,
        };
        const newMatchData: Omit<Match, "id"> = {
          roomTemplateId: room.id,
          roomName: room.name,
          type: room.type,
          variant: room.variant,
          mode: room.mode,
          bet: room.bet,
          maxPlayers: room.maxPlayers,
          players: { [address]: newPlayer },
          roomCode: room.createdBy === "user" ? room.accessCode : "",
          gameState: {
            phase: "waiting",
            board: [],
            boardEnds: [null, null],
            currentPlayerId: null,
            playerOrder: [],
            passes: 0,
            teamScores: {},
            roundWinnerInfo: null,
            matchWinner: null,
            scoreToWin: room.scoreToWin,
          },
        };
        const newMatchRef = matchesRef.push();
        await newMatchRef.set({ ...newMatchData, id: newMatchRef.key });
        if (newMatchData.gameState.phase === "waiting") {
          setIsWaitingForPlayers(true);
        }
        setSelectedMatchId(newMatchRef.key);
      }
    } catch (error) {
      console.error("Error finding or creating match:", error);
      alert("Error joining game. Please try again.");
    } finally {
      setIsFindingMatch(false);
    }
  };

  const handleJoinRoom = (room: Room) => {
    if (room.type === "free") {
      setLocalAIRoom(room); // Start local AI game
    } else {
      handleFindOrCreateMatch(room);
    }
  };

  const handleLeave = () => {
    setSelectedMatchId(null);
    setLocalAIRoom(null);
    setShowExitGameModal(false);
  };

  if (!database) {
    return (
      <div className="container mx-auto px-4 py-8 text-white text-center">
        <h2 className="font-display text-3xl text-red-400">
          Database Connection Failed
        </h2>
        <p className="mt-4">
          Could not connect to the game server. This might be due to a missing
          or invalid Firebase configuration.
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Please ensure the Firebase SDKs are loaded and the configuration in{" "}
          <strong>DominoGame.tsx</strong> is correct.
        </p>
        <button
          onClick={onGoBack}
          className="mt-8 font-display bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold py-2 px-6 rounded-lg text-lg"
        >
          &larr; Back to Main Lobby
        </button>
      </div>
    );
  }

  const renderContent = () => {
    // If we are in a match or a local AI room, render the room directly to fill space
    if (preselectedMatchId || selectedMatchId) {
      return (
        <DominoRoom
          matchId={preselectedMatchId ?? selectedMatchId ?? undefined}
          onLeave={handleLeave}
          database={database}
          address={address}
          sendTransaction={sendTransaction}
          nativeCurrencySymbol={nativeCurrencySymbol}
          setCurrentScreen={setCurrentScreen}
        />
      );
    }
    if (localAIRoom) {
      return (
        <DominoRoom
          room={localAIRoom}
          onLeave={handleLeave}
          database={database}
          address={address}
          sendTransaction={sendTransaction}
          nativeCurrencySymbol={nativeCurrencySymbol}
          setCurrentScreen={setCurrentScreen}
        />
      );
    }

    // Otherwise, show the selection/lobby flow inside a container for standard layout
    return (
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {!selectedVariant ? (
          <DominoCategorySelection onSelectVariant={setSelectedVariant} />
        ) : (
          <>
            <div className="py-12">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-center text-amber-300 mb-12 drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">
                {`Domino ${
                  selectedVariant.charAt(0).toUpperCase() +
                  selectedVariant.slice(1)
                }`}
              </h2>
            </div>

            <DominoLobby
              onJoinRoom={handleJoinRoom}
              database={database}
              variant={selectedVariant}
              nativeCurrencySymbol={nativeCurrencySymbol}
              userAddress={address}
              setCurrentScreen={setCurrentScreen}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col text-white">
      {showExitGameModal && (
        <ConfirmModal
          title={t("leaveGame")}
          message={
            isWaitingForPlayers || gamePhaseWaiting === true
              ? t("leaveGameWaitingConfirmation")
              : t("leaveGameConfirmation")
          }
          confirmText={t("yes")}
          cancelText={t("no")}
          type="danger"
          onConfirm={() => {
            localAIRoom
              ? handleLeave()
              : handleExitGame(selectedMatchId ?? preselectedMatchId ?? "");
          }}
          onCancel={() => setShowExitGameModal(false)}
        />
      )}
      {isFindingMatch && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
          <div className="w-16 h-16 border-4 border-t-transparent border-amber-400 rounded-full animate-spin"></div>
          <p className="font-display text-2xl mt-4">{t("findingMatch")}</p>
        </div>
      )}

      <div className="flex-grow min-h-0">{renderContent()}</div>
    </div>
  );
};

export default DominoGame;
