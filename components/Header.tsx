import React from "react";
import { BnbIcon } from "./icons/BnbIcon";
import { UsdtIcon } from "./icons/UsdtIcon";
import type { Balances } from "../types";
import type { NetworkName } from "../hooks/useWeb3";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";
import WalletInfoModal from "./ProfileModal";
import { Player } from "./games/domino/types";

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

interface HeaderProps {
  address: string | null;
  balances: Balances | null;
  player?: Player;
  disconnectWallet: () => void;
  networkName: NetworkName;
  setCurrentNetwork: (name: NetworkName) => void;
  availableNetworks: object;
  nativeCurrencySymbol: string;
  isSelectedGame: boolean;
  onBack?: () => void; 
  onUpdatePlayer?: (updated: Partial<Player>) => void;
  uploadAvatar?: (file: File, playerId: string) => Promise<string>;
}

const Header: React.FC<HeaderProps> = ({
  address,
  balances,
  player,
  disconnectWallet,
  networkName,
  setCurrentNetwork,
  availableNetworks,
  nativeCurrencySymbol,
  isSelectedGame,
  onBack,
  onUpdatePlayer,
}) => {
  const { t } = useTranslation();

  return (
    <header className="bg-black/10 shadow-lg px-2 sm:px-4 lg:px-6 py-3 flex-shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-y-4">
        {/* Logo o botón Home */}
        <div className="flex-shrink-0 h-16 sm:h-20 flex items-center">
          {isSelectedGame ? (
            <button
              onClick={onBack}
              className="bg-black/40 p-2 rounded-full text-white hover:bg-black/60 transition-colors"
            >
              <HomeIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          ) : (
            <img
              src="/logo.png"
              alt="Lobby Logo"
              className="h-full w-auto object-contain"
            />
          )}
        </div>

        {/* Balances, red y disconnect */}
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-3">
          {balances && (
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 order-2 md:order-1">
              <div className="flex items-center space-x-2 bg-gray-900/50 px-3 py-1 rounded-full border border-white/10">
                <BnbIcon className="h-5 w-5 text-yellow-400" />
                <span className="font-bold text-sm sm:text-base text-white">
                  {parseFloat(balances.native).toLocaleString("en-US", {
                    minimumFractionDigits: 4,
                    maximumFractionDigits: 4,
                  })}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  {nativeCurrencySymbol}
                </span>
              </div>
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
          )}

          <div className="flex items-center space-x-2 order-1 md:order-2">
            <div className="relative">
              <select
                value={networkName}
                onChange={(e) =>
                  setCurrentNetwork(e.target.value as NetworkName)
                }
                className="bg-gray-800/80 border border-amber-600/30 text-white font-semibold py-2 pl-3 pr-8 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500 hover:bg-gray-700/80 cursor-pointer text-xs sm:text-sm"
              >
                {Object.entries(availableNetworks).map(
                  ([key, value]: [string, any]) => (
                    <option
                      key={key}
                      value={key}
                      className="bg-gray-800 text-white"
                    >
                      {value.chainName}
                    </option>
                  )
                )}
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-300">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>

            <div>
              <LanguageSelector />
            </div>

            <button
              onClick={disconnectWallet}
              className="bg-red-700/80 hover:bg-red-600/80 text-white font-semibold py-2 px-3 rounded-md shadow-sm transition-colors duration-200 text-xs sm:text-sm"
            >
              {t("disconnect")}
            </button>
          </div>

          {address && player && (
            <div className="w-full flex justify-end order-3">
              <WalletInfoModal
                address={address}
                player={player}
                balances={balances ?? { native: "", USDT: "" }}
                onUpdatePlayer={onUpdatePlayer}
              />
              {/* <span className="text-amber-300 font-mono text-xs bg-gray-900/50 px-2 py-0.5 rounded-md">
                {truncateAddress(address)}
              </span> */}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
