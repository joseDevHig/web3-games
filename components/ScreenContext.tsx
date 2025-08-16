import React, { createContext, useContext, useState } from "react";

type ScreenType = "home" | "lobby" | "room" | "other";

interface ScreenContextType {
  currentScreen: ScreenType;
  setCurrentScreen: (screen: ScreenType) => void;
}

const ScreenContext = createContext<ScreenContextType | undefined>(undefined);

export const ScreenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("home");

  return (
    <ScreenContext.Provider value={{ currentScreen, setCurrentScreen }}>
      {children}
    </ScreenContext.Provider>
  );
};

export const useScreen = () => {
  const context = useContext(ScreenContext);
  if (!context) {
    throw new Error("useScreen debe usarse dentro de un ScreenProvider");
  }
  return context;
};
