import React, { useState, useEffect, useMemo } from "react";
import Header from "./components/Header";
import GameLobby from "./components/GameLobby";
import { useWeb3 } from "./hooks/useWeb3";
import { GAMES } from "./constants";
import DominoGame from "./components/games/DominoGame";
import { ConfirmModal } from "./components/Modal";

declare const firebase: any;

// Ícono para volver

const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const App: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    connectWallet,
    address,
    balances,
    disconnectWallet,
    sendTransaction,
    networkName,
    setCurrentNetwork,
    nativeCurrencySymbol,
    availableNetworks,
  } = useWeb3();

  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  // Estados para reconexión
  const [pendingReconnectMatch, setPendingReconnectMatch] = useState<
    string | null
  >(null);
  const [pendingReconnectGame, setPendingReconnectGame] = useState<
    string | null
  >(null);
  const [showReconnectModal, setShowReconnectModal] = useState(false);
  const [isWaitingForPlayers, setIsWaitingForPlayers] = useState(false);
  const [inGame, setInGame] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<"home" | "lobby" | "room">(
    "home"
  );

  console.log("Current screen:", currentScreen);

  // Firebase
  const database = useMemo(() => {
    const firebaseConfig = {
      apiKey: "AIzaSyCoo8w_k_Im-lC3ISekGoM-wJdbVl6KvGQ",
      authDomain: "web3-games-18aaf.firebaseapp.com",
      projectId: "web3-games-18aaf",
      storageBucket: "web3-games-18aaf.firebasestorage.app",
      messagingSenderId: "12418607349",
      appId: "1:12418607349:web:7d68992ebc426d873bbdbc",
      databaseURL: "https://web3-games-18aaf-default-rtdb.firebaseio.com",
    };

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    return firebase.database();
  }, []);

  // Verificar si hay partida activa al entrar
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
              if (match.gameState?.phase === "waiting") {
                setIsWaitingForPlayers(true);
              }
              console.log(`Encontrada partida activa ${matchId}`);
              setPendingReconnectMatch(matchId);
              setPendingReconnectGame(match.game || "dominoes");
              setShowReconnectModal(true);
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

  // Botones del modal
  const handleReconnect = () => {
    if (pendingReconnectMatch && pendingReconnectGame) {
      setSelectedGame(pendingReconnectGame);
      setSelectedMatchId(pendingReconnectMatch);
      setInGame(true);
    }
    setShowReconnectModal(false);
  };

  const handleCancelReconnect = async () => {
    try {
      if (pendingReconnectMatch && address) {
        const desertersRef = database.ref(
          `matches/${pendingReconnectMatch}/desertorsAddress`
        );

        await desertersRef.transaction((current: string | string[]) => {
          if (current) {
            if (!Array.isArray(current)) {
              return [address];
            }
            if (!current.includes(address)) {
              return [...current, address];
            }
            return current;
          }
          return [address];
        });
      }
    } catch (error) {
      console.error("Error adding deserter address:", error);
    }

    setPendingReconnectMatch(null);
    setPendingReconnectGame(null);
    setShowReconnectModal(false);
    setInGame(false);
  };

  // Control del botón atrás
  const handleGoToLobby = () => setSelectedGame(null);
  const [backButtonHandler, setBackButtonHandler] = useState<() => void>(
    () => handleGoToLobby
  );

  const handleSelectGame = (gameId: string) => {
    setSelectedGame(gameId);
    setBackButtonHandler(() => handleGoToLobby);
  };
  // Renderizado de juegos
  const renderGame = () => {
    switch (selectedGame) {
      case "dominoes":
        return (
          <DominoGame
            onGoBack={handleGoToLobby}
            address={address}
            balances={balances}
            sendTransaction={sendTransaction}
            nativeCurrencySymbol={nativeCurrencySymbol}
            setBackButtonHandler={setBackButtonHandler}
            preselectedMatchId={selectedMatchId}
            gamePhaseWaiting={isWaitingForPlayers}
            setCurrentScreen={setCurrentScreen}
          />
        );
      default:
        handleGoToLobby();
        return null;
    }
  };

  const backgroundUrl = `url('/assets/casino-background2.jpeg')`;

  return (
    <div
      className="h-full w-full bg-cover bg-center"
      style={{ backgroundImage: backgroundUrl }}
    >
      <div className="h-full w-full bg-green-900/20 text-white flex flex-col overflow-hidden">
        {/* Modal de reconexión */}
        {showReconnectModal && (
          <ConfirmModal
            title="Ongoing Game"
            message={`You have an active ${pendingReconnectGame} game. Do you want to reconnect and continue playing?`}
            confirmText="Yes, reconnect"
            cancelText="No, exit"
            type="warning"
            onConfirm={handleReconnect}
            onCancel={handleCancelReconnect}
          />
        )}

        {isConnected && address && balances ? (
          <div className="flex flex-col h-full">
            {currentScreen !== "room" && (
              <Header
                address={address}
                balances={balances}
                disconnectWallet={disconnectWallet}
                networkName={networkName}
                setCurrentNetwork={setCurrentNetwork}
                availableNetworks={availableNetworks}
                nativeCurrencySymbol={nativeCurrencySymbol}
                isSelectedGame={!!selectedGame}
                onBack={backButtonHandler}
              />
            )}

            <main
              className={`flex-grow min-h-0 relative overflow-y-auto ${
                selectedGame ? "" : "container mx-auto px-4 py-4 sm:py-8"
              }`}
            >
              {currentScreen === "room" && (
                <button
                  onClick={backButtonHandler}
                  aria-label="Go back"
                  className="absolute top-2 left-2 sm:top-4 sm:left-4 z-50 bg-black/40 p-2 rounded-full text-white hover:bg-black/60 transition-colors"
                >
                  <HomeIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              )}
              {selectedGame ? (
                renderGame()
              ) : (
                <GameLobby games={GAMES} onSelectGame={handleSelectGame} />
              )}
            </main>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center overflow-y-auto">
            <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-bold text-amber-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              The Casino
            </h1>
            <p className="mt-4 mb-12 text-gray-300 text-base sm:text-lg">
              Connect your wallet to enter the lobby.
            </p>
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="font-display bg-amber-400 hover:bg-amber-300 disabled:bg-amber-600 disabled:cursor-not-allowed text-gray-900 font-bold py-3 px-8 sm:py-4 sm:px-12 rounded-lg text-xl sm:text-2xl shadow-lg shadow-amber-400/20 hover:shadow-amber-300/40 transition-all duration-300 transform hover:scale-105"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
