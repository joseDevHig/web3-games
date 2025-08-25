import { useState } from "react";

function WalletInfoModal({ address }: { address: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Botón/campo clickeable */}
      {address && (
        <div className="w-full flex justify-end order-3">
          <button
            onClick={() => setOpen(true)}
            className="text-amber-300 font-mono text-xs bg-gray-900/50 px-2 py-0.5 rounded-md hover:bg-gray-800/70 transition"
          >
            {truncateAddress(address)}
          </button>
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 rounded-2xl shadow-lg w-[90%] max-w-md p-6 relative">
            {/* Botón de cerrar */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            {/* Header con avatar y nombre */}
            <div className="flex items-center gap-4 mb-6">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl text-white">
                {/* Si no hay imagen de perfil, mostrar iniciales */}
                <span>A</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Nombre del jugador
                </h2>
                <p className="text-xs font-mono text-amber-300">
                  {truncateAddress(address)}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
              <div className="p-3 rounded-lg bg-gray-800/50">
                <p className="text-gray-400">Partidas Totales</p>
                <p className="font-semibold text-white">120</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-800/50">
                <p className="text-gray-400">Ganadas</p>
                <p className="font-semibold text-green-400">75</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-800/50">
                <p className="text-gray-400">Perdidas</p>
                <p className="font-semibold text-red-400">45</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-800/50">
                <p className="text-gray-400">Ganancias</p>
                <p className="font-semibold text-amber-300">350 USDT</p>
              </div>
            </div>

            {/* Fondos totales */}
            <div className="mt-6 p-4 rounded-lg bg-gray-800/70 text-center">
              <p className="text-gray-400 text-sm">Fondos en Wallet</p>
              <p className="text-xl font-bold text-amber-400">1200 USDT</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 🔹 Helper para truncar dirección
function truncateAddress(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export default WalletInfoModal;
