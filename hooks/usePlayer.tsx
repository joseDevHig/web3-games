
import { Player } from "@/components/games/domino/types";
import { useEffect, useState } from "react";

export function usePlayer(address?: string, database?: any) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address || !database) {
      setPlayer(null);
      return;
    }

    setLoading(true);
    const playerRef = database.ref(`players/${address}`);

    // Listener en tiempo real
    const handleSnapshot = async (snapshot: any) => {
      if (snapshot.exists()) {
        setPlayer(snapshot.val());
      } else {
        const newPlayer: Player = {
          id: address,
          address: address,
          isAI: false,
          team: "",
          name: "",
          avatarUrl: "",
          totalMatches: 0,
          wins: 0,
          losses: 0,
          earnings: 0,
        };

        await playerRef.set(newPlayer);
        setPlayer(newPlayer);
      }
      setLoading(false);
    };

    playerRef.on("value", handleSnapshot);

    // cleanup
    return () => {
      playerRef.off("value", handleSnapshot);
    };
  }, [address, database]);

  // 🔹 Aquí está el return que faltaba
  return { player, loading };
}
