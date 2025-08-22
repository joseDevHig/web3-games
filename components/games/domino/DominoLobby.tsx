import React, { useState, useEffect, useRef } from "react";
import { BnbIcon } from "../../icons/BnbIcon";
import { UsdtIcon } from "../../icons/UsdtIcon";
import type { Room, DominoVariant, RoomMode, Match } from "./types";
import { defaultCashRoomData } from "../../../data/defaultRooms";
import CreateRoomModal from "./CreateRoomModal";
import JoinWithCodeModal from "./JoinWithCodeModal";
import { useTranslation } from "react-i18next";

// Declare firebase for global script
declare const firebase: any;
type Database = any;

interface DominoLobbyProps {
  onJoinRoom: (room: Room) => void;
  database: Database;
  variant: DominoVariant;
  nativeCurrencySymbol: string;
  userAddress: string | null;
}

const freeRoomsData: Omit<Room, "id" | "privacy" | "accessCode">[] = [
  // Internacional
  {
    name: "Player vs IA",
    type: "free",
    maxPlayers: 2,
    variant: "internacional",
    scoreToWin: 100,
    mode: "1v1",
  },
  {
    name: "Player - IA vs IA - IA",
    type: "free",
    maxPlayers: 4,
    variant: "internacional",
    scoreToWin: 100,
    mode: "2v2",
  },
  {
    name: "Mesa Libre Internacional",
    type: "free",
    maxPlayers: 4,
    variant: "internacional",
    scoreToWin: 100,
    mode: "free",
  },

  // Cubano
  {
    name: "Player vs IA",
    type: "free",
    maxPlayers: 2,
    variant: "cubano",
    scoreToWin: 150,
    mode: "1v1",
  },
  {
    name: "Player - IA vs IA - IA",
    type: "free",
    maxPlayers: 4,
    variant: "cubano",
    scoreToWin: 150,
    mode: "2v2",
  },
  {
    name: "Mesa Libre Cubana",
    type: "free",
    maxPlayers: 4,
    variant: "cubano",
    scoreToWin: 150,
    mode: "free",
  },

  // Dominicano
  {
    name: "Player vs IA",
    type: "free",
    maxPlayers: 2,
    variant: "dominicano",
    scoreToWin: 200,
    mode: "1v1",
  },
  {
    name: "Player - IA vs IA - IA",
    type: "free",
    maxPlayers: 4,
    variant: "dominicano",
    scoreToWin: 200,
    mode: "2v2",
  },
  {
    name: "Mesa Libre Dominicana",
    type: "free",
    maxPlayers: 4,
    variant: "dominicano",
    scoreToWin: 200,
    mode: "free",
  },
];

const RoomItem: React.FC<{
  room: Room;
  onJoin: () => void;
  nativeCurrencySymbol: string;
  match: Match | null;
}> = ({ room, onJoin, nativeCurrencySymbol, match }) => {
  const { t } = useTranslation();
  const playersCount = match?.players ? Object.keys(match.players).length : 0;
  return (
    <div className="bg-gray-800/80 p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between shadow-lg border border-amber-600/30 hover:bg-gray-700/80 hover:border-amber-500/50 transition-all duration-300 gap-3">
      <div className="flex-grow">
        <h4 className="font-bold text-base sm:text-lg text-white">
          {room.name}
        </h4>
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-300">
          <span>{t("to")} {room.scoreToWin} pts</span>
          {room.type === "cash" && room.bet ? (
            <div className="flex items-center space-x-2">
              {room.bet.currency === "native" ? (
                <BnbIcon className="w-4 h-4 text-yellow-400" />
              ) : (
                <UsdtIcon className="w-4 h-4" />
              )}
              <span>
                {room.bet.amount}{" "}
                {room.bet.currency === "native"
                  ? nativeCurrencySymbol
                  : room.bet.currency}
              </span>
            </div>
          ) : (
            <span>{t("solitaireVsIA")}</span>
          )}
        </div>
        {room.createdBy && (
          <div className="flex items-center space-x-2 mt-2">
            {Array.from({ length: room.maxPlayers }).map((_, index) => {
              const isFilled = index < playersCount;
              console.log("playersCount", playersCount);
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 transition-colors duration-300 ${
                    isFilled
                      ? "bg-green-500 border-green-500"
                      : "bg-red-500 border-red-500"
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
      <div className="flex-shrink-0">
        <button
          onClick={onJoin}
          className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-md transition-colors transform hover:scale-105 text-sm sm:text-base"
        >
          {room.type === "cash" ? t("join") : t("start")}
        </button>
      </div>
    </div>
  );
};

const TabButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`font-display px-4 sm:px-6 py-2 rounded-t-lg text-base sm:text-lg transition-colors ${
      isActive
        ? "bg-amber-500/30 text-amber-200 border-b-2 border-amber-300"
        : "bg-black/30 text-gray-300 hover:bg-black/50"
    }`}
  >
    {label}
  </button>
);

type RoomCategory = Record<RoomMode, Room[]>;

const DominoLobby: React.FC<
  DominoLobbyProps & {
    setCurrentScreen: (screen: "home" | "lobby" | "room") => void;
  }
> = ({
  onJoinRoom,
  database,
  variant,
  nativeCurrencySymbol,
  setCurrentScreen,
}) => {
  const [cashRooms, setCashRooms] = useState<
    Record<RoomMode, Room[]> & { ai: RoomCategory }
  >({
    "1v1": [],
    "2v2": [],
    free: [],
    ai: { "1v1": [], "2v2": [], free: [] },
  });
  const { t } = useTranslation();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setJoinModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RoomMode | "ai">("2v2");
  const [activeAITab, setActiveAITab] = useState<RoomMode>("2v2");
  const [matchesByRoom, setMatchesByRoom] = useState<
    Record<string, Match | null>
  >({});
  const matchSubsRef = useRef<
    Record<string, { query: any; cb: (s: any) => void }>
  >({});

  const defaultScores: Record<DominoVariant, number> = {
    internacional: 100,
    cubano: 150,
    dominicano: 200,
    mexicano: 0, // Not implemented
  };
  useEffect(() => {
    setCurrentScreen("lobby");
  }, [setCurrentScreen]);

  useEffect(() => {
    const roomsRef = database.ref("rooms");
    const matchesRef = database.ref("matches");

    const seedDatabase = () => {
      roomsRef.once("value", (snapshot: { exists: () => any }) => {
        if (!snapshot.exists()) {
          const updates: { [key: string]: Omit<Room, "id" | "accessCode"> } =
            {};
          defaultCashRoomData.forEach((roomData) => {
            const newRoomRef = roomsRef.push();
            if (newRoomRef.key) updates[newRoomRef.key] = roomData;
          });
          roomsRef.update(updates).catch(console.error);
        }
      });
    };

    seedDatabase();

    const buildCategorized = (
      roomsData: Record<string, any>,
      matchesByRoom: Record<string, Match | null>
    ) => {
      const categorized: typeof cashRooms = {
        "1v1": [],
        "2v2": [],
        free: [],
        ai: { "1v1": [], "2v2": [], free: [] },
      };

      // Rooms IA
      freeRoomsData
        .filter((r) => r.variant === variant)
        .forEach((r, i) => {
          categorized.ai[r.mode].push({
            ...r,
            id: `ai_${variant}_${r.mode}_${i}`,
            privacy: "public" as const,
          } as Room);
        });

      // Rooms reales
      Object.entries(roomsData || {}).forEach(
        ([roomId, room]: [string, any]) => {
          if (
            room.variant === variant &&
            room.privacy === "public" &&
            categorized[room.mode as RoomMode]
          ) {
            const match = matchesByRoom[roomId] || null;

            // 👇 Filtro: si es creada por user y su match está en playing/gameOver → no la mostramos
            if (
              room.createdBy === "user" &&
              (match?.gameState?.phase === "playing" ||
                match?.gameState?.phase === "gameOver")
            ) {
              return; // se oculta
            }

            // si pasa el filtro se agrega
            categorized[room.mode as RoomMode].push({ id: roomId, ...room });
          }
        }
      );

      return categorized;
    };

    const handleRoomsValue = (snapshot: any) => {
      const roomsData = snapshot.val() || {};

      
      const userRoomIds = Object.entries(roomsData)
        .filter(([, r]: any) => r?.createdBy === "user")
        .map(([id]) => id);

     
      Object.keys(matchSubsRef.current).forEach((roomId) => {
        if (!userRoomIds.includes(roomId)) {
          const { query, cb } = matchSubsRef.current[roomId];
          query.off("value", cb);
          delete matchSubsRef.current[roomId];
          setMatchesByRoom((prev) => {
            const next = { ...prev };
            delete next[roomId];
            return next;
          });
        }
      });

      
      userRoomIds.forEach((roomId) => {
        if (!matchSubsRef.current[roomId]) {
          const query = matchesRef
            .orderByChild("roomTemplateId")
            .equalTo(roomId);

          const cb = (msnap: any) => {
            const obj = msnap.val() || null;
            const match: Match | null = obj
              ? (Object.values(obj)[0] as Match)
              : null;

            setMatchesByRoom((prev) => {
              const next = { ...prev, [roomId]: match };

            
              const categorized = buildCategorized(roomsData, next);
              setCashRooms(categorized);
              setIsLoading(false);

              return next;
            });
          };

          query.on("value", cb);
          matchSubsRef.current[roomId] = { query, cb };
        }
      });

      
      setMatchesByRoom((prev) => {
        const categorized = buildCategorized(roomsData, prev);
        setCashRooms(categorized);
        setIsLoading(false);
        return prev;
      });
    };

    roomsRef.on("value", handleRoomsValue);

    return () => {
      roomsRef.off("value", handleRoomsValue);
      // limpiar todas las suscripciones de matches
      Object.values(matchSubsRef.current).forEach(({ query, cb }) =>
        query.off("value", cb)
      );
      matchSubsRef.current = {};
    };
  }, [database, variant]);

  const handleCreateRoom = (roomDetails: Omit<Room, "id">): Promise<void> => {
    const newRoomRef = database.ref("rooms").push();
    const roomId = newRoomRef.key as string;

    const fullRoom: Room = {
      id: roomId,
      ...roomDetails,
    };

    console.log("New room created:", fullRoom);

    onJoinRoom(fullRoom);

    return newRoomRef.set(fullRoom);
  };

  const handleJoinPrivateRoom = (room: Room) => {
    setJoinModalOpen(false);
    onJoinRoom(room);
  };

  const renderRoomList = (rooms: Room[]) => {
    if (isLoading) {
      return (
        <div className="text-center text-gray-300 py-8">{t("loadingRooms")}</div>
      );
    }
    if (rooms.length > 0) {
      return (
        <div className="space-y-4">
          {rooms.map((room) => (
            <RoomItem
              key={room.id}
              room={room}
              onJoin={() => onJoinRoom(room)}
              nativeCurrencySymbol={nativeCurrencySymbol}
              match={matchesByRoom[room.id] ?? null}
            />
          ))}
        </div>
      );
    }
    return (
      <div className="text-center text-gray-400 py-8">
        {t("noRoomsAvailable")}
      </div>
    );
  };

  return (
    <>
      {isCreateModalOpen && (
        <CreateRoomModal
          onCreate={handleCreateRoom}
          onClose={() => setCreateModalOpen(false)}
          variant={variant}
          defaultScore={defaultScores[variant]}
          nativeCurrencySymbol={nativeCurrencySymbol}
        />
      )}
      {isJoinModalOpen && (
        <JoinWithCodeModal
          isOpen={isJoinModalOpen}
          onClose={() => setJoinModalOpen(false)}
          onJoinRoom={handleJoinPrivateRoom}
          database={database}
          variant={variant}
        />
      )}

      <div className="flex justify-end space-x-4 pt-4 pb-4">
        <button
          onClick={() => setCreateModalOpen(true)}
          className="font-display bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg text-lg transition-all duration-300 shadow-lg hover:shadow-blue-500/40 transform hover:scale-105"
        >
          {t("createRoom")}
        </button>
        <button
          onClick={() => setJoinModalOpen(true)}
          className="font-display bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-lg text-lg transition-all duration-300 shadow-lg hover:shadow-gray-500/40"
        >
          {t("joinWithCode")}
        </button>
      </div>

      <div className="bg-black/20 backdrop-blur-sm border-2 border-amber-500/30 rounded-lg shadow-2xl shadow-amber-500/10">
        <div className="border-b-2 border-amber-500/30 px-2 sm:px-6 flex flex-wrap">
          <TabButton
            label="1 vs 1"
            isActive={activeTab === "1v1"}
            onClick={() => setActiveTab("1v1")}
          />
          <TabButton
            label="2 vs 2"
            isActive={activeTab === "2v2"}
            onClick={() => setActiveTab("2v2")}
          />
          <TabButton
            label={t("freeMode")}
            isActive={activeTab === "free"}
            onClick={() => setActiveTab("free")}
          />
          <TabButton
            label="IA"
            isActive={activeTab === "ai"}
            onClick={() => setActiveTab("ai")}
          />
        </div>
        <div className="p-3 sm:p-6">
          <h3 className="font-display text-2xl sm:text-3xl text-amber-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] mb-4 sm:mb-6">
            {activeTab === "ai" ? t("SingleplayerMode") : t("MultiplayerMode")}
          </h3>

          {activeTab === "ai" && (
            <div className="flex space-x-2 mb-4">
              <TabButton
                label="1 vs 1"
                isActive={activeAITab === "1v1"}
                onClick={() => setActiveAITab("1v1")}
              />
              <TabButton
                label="2 vs 2"
                isActive={activeAITab === "2v2"}
                onClick={() => setActiveAITab("2v2")}
              />
              <TabButton
                label="Libre"
                isActive={activeAITab === "free"}
                onClick={() => setActiveAITab("free")}
              />
            </div>
          )}

          {activeTab === "ai"
            ? renderRoomList(cashRooms.ai[activeAITab])
            : renderRoomList(cashRooms[activeTab])}
        </div>
      </div>
    </>
  );
};

export default DominoLobby;
