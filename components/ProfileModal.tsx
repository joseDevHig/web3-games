import { useState } from "react";
import { Player } from "./games/domino/types";
import { Balances } from "@/types";
import { UsdtIcon } from "./icons/UsdtIcon";
import { CameraIcon } from "lucide-react";

function WalletInfoModal({
  address,
  player,
  onUpdatePlayer,
  balances,
  uploadAvatar, // 🔹 función para subir archivo a Firebase Storage y devolver la URL
}: {
  address: string;
  player: Player;
  onUpdatePlayer?: (updated: Partial<Player>) => void;
  balances: Balances;
  uploadAvatar?: (file: File, playerId: string) => Promise<string>;
}) {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(player?.name || "");
  const [editingAvatar, setEditingAvatar] = useState(player?.avatarUrl || "");

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadAvatar) {
      const url = await uploadAvatar(file, player.id);
      setEditingAvatar(url);
      console.log("Avatar subido, URL:", url);
    }
  };

  const handleSave = () => {
    if (onUpdatePlayer) {
      onUpdatePlayer({
        name: editingName.trim() || player.address,
        avatarUrl: editingAvatar.trim(),
      });
    }
    setIsEditing(false);
    setOpen(false);
  };

  return (
    <>
      {address && (
        <div className="w-full flex justify-end order-3">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 text-amber-300 font-mono text-xs bg-gray-900/50 px-2 py-0.5 rounded-md hover:bg-gray-800/70 transition"
          >
            {player?.avatarUrl && (
              <img
                src={player.avatarUrl}
                alt={player.name || "User"}
                className="w-5 h-5 rounded-full object-cover"
              />
            )}

            {player?.name && (
              <span className="font-sans text-white text-xs">
                {player.name}
              </span>
            )}

            <span>{truncateAddress(address)}</span>
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 rounded-2xl shadow-lg w-[90%] max-w-md p-6 relative">
            {/* Botón de cerrar */}
            <button
              onClick={() => {
                setOpen(false);
                setIsEditing(false); // salir cancela edición
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            {/* Header con avatar y nombre */}
            <div className="flex items-center gap-4 mb-6">
              {/* Avatar */}
              <div className="relative w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl text-white overflow-hidden">
                {editingAvatar ? (
                  <img
                    src={editingAvatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {(editingName || player.address).charAt(0).toUpperCase()}
                  </span>
                )}

                {/* Overlay solo en modo edición */}
                {isEditing && (
                  <>
                    {/* Fondo borroso con icono */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      <CameraIcon className="w-6 h-6 text-white" />
                    </div>

                    {/* Input invisible encima */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </>
                )}
              </div>

              <div>
                {/* Editable name */}
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="Nombre del jugador"
                  disabled={!isEditing}
                  className={`px-2 py-1 rounded-md text-sm focus:outline-none ${
                    isEditing
                      ? "bg-gray-800 text-white"
                      : "bg-transparent text-gray-300"
                  }`}
                />
                <p className="text-xs font-mono text-amber-300">
                  {truncateAddress(address)}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
              <Stat
                label="Partidas Totales"
                value={player?.totalMatches ?? 0}
              />
              <Stat
                label="Ganadas"
                value={player?.wins ?? 0}
                color="text-green-400"
              />
              <Stat
                label="Perdidas"
                value={player?.losses ?? 0}
                color="text-red-400"
              />
              <Stat
                label="Ganancias"
                value={`${player?.earnings ?? 0} USDT`}
                color="text-amber-300"
              />
            </div>

            {/* Fondos totales */}
            <div className="mt-6 p-4 rounded-lg bg-gray-800/70 text-center">
              <p className="text-gray-400 text-sm">Fondos en Wallet</p>
              <div className="flex items-center space-x-2 bg-gray-900/50 px-3 py-1 rounded-full border border-white/10">
                <UsdtIcon className="h-5 w-5" />
                <span className="font-bold text-sm sm:text-base text-white">
                  {parseFloat(balances.USDT).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-xs text-gray-400 font-medium">USDT</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-md font-semibold"
                >
                  Guardar
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md font-semibold"
                >
                  Editar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: any;
  color?: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-gray-800/50">
      <p className="text-gray-400">{label}</p>
      <p className={`font-semibold ${color || "text-white"}`}>{value}</p>
    </div>
  );
}

// 🔹 Helper para truncar dirección
function truncateAddress(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export default WalletInfoModal;
