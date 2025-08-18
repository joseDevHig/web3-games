import React from "react";
import { Domino } from "./types";

type DominoValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface DominoTileProps {
  values: [number, number];
  isPlayable?: boolean;
  isClickable?: boolean;
  scale?: number;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  isDragging?: boolean;
  isClicked?: boolean;
  faceDown?: boolean;
  orientation?: "vertical" | "horizontal";
  isInTable?: boolean;
  clickedTile: {
    domino: Domino;
    index: number;
} | null
}

const Dot: React.FC = () => (
  <div className="w-full h-full bg-gray-800 rounded-full dot-inset-shadow"></div>
);

const Dots: React.FC<{ count: number }> = ({ count }) => {
  const dotVisibility: { [key: number]: number[] } = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  const dotsToShow = dotVisibility[count as DominoValue] || [];

  return (
    <div className="w-full h-full p-1 grid grid-cols-3 grid-rows-3 gap-px">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex justify-center items-center p-px">
          {dotsToShow.includes(i) && <Dot />}
        </div>
      ))}
    </div>
  );
};

const DominoTile: React.FC<DominoTileProps> = ({
  values,
  isPlayable,
  isClickable,
  scale = 2.4, // Escala por defecto
  draggable,
  onDragStart,
  onClick,
  isDragging,
  isClicked,
  faceDown,
  orientation = "vertical", // Orientación visual por defecto
  isInTable,
  clickedTile,
}) => {
  // Definimos las dimensiones base en unidades "rem"
  const baseShortDim = 3; // Corresponde a 48px con 1rem=16px
  const baseLongDim = 6; // Corresponde a 96px con 1rem=16px

  // `isDouble` solo afecta si se muestra el punto central, no la orientación base.
  // La orientación la controla la prop `orientation`.
  const isDouble = values[0] === values[1];

  // Las dimensiones de la ficha son dinámicas basadas en la orientación
  const widthRem = orientation === "vertical" ? baseShortDim : baseLongDim;
  const heightRem = orientation === "vertical" ? baseLongDim : baseShortDim;

  const dimensions = {
    width: `${widthRem * scale}rem`,
    height: `${heightRem * scale}rem`,
  };

  if (faceDown) {
    return (
      <div
        style={dimensions}
        className="bg-white rounded-lg domino-tile-3d-shadow flex items-center justify-center overflow-hidden m-2 cursor-pointer"
        onClick={onClick}
      >
        <div className="w-full h-full bg-white/80 flex items-center justify-center">
          <div className="w-1/2 h-1/2 rounded-full bg-gray-300 shadow-inner"></div>
        </div>
      </div>
    );
  }

  const containerClasses = `bg-gray-100 rounded-lg flex overflow-visible relative border border-gray-300 domino-tile-3d-shadow`;
  const flexDirectionClass =
    orientation === "vertical" ? "flex-col" : "flex-row";
  const interactiveClasses = isClickable
    ? "cursor-pointer transition-transform hover:scale-105 hover:-translate-y-1 overflow-visible"
    : "cursor-default";
  const playableBorder = isPlayable
    ? "shadow-[0_0_0_2px_rgba(251,191,36,0.8)]" // Borde amarillo para jugable
    : "";

  // const draggingClasses = isDragging ? "opacity-50" : "opacity-100";
  const clickedClasses = isInTable
    ? "opacity-100"
    : isClicked
    ? "opacity-100"
    : clickedTile
    ? "opacity-50"
    : "opacity-100";

  return (
    <div
      style={dimensions}
      className={`${containerClasses} ${flexDirectionClass} ${interactiveClasses} ${playableBorder}  ${clickedClasses}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
    >
      <div className="w-full h-full flex items-center justify-center">
        <div
          className={
            orientation === "horizontal"
              ? "rotate-90 w-full h-full"
              : "w-full h-full"
          }
        >
          <Dots count={values[0]} />
        </div>
      </div>

      {/* Divisor dinámico */}
      <div
        className={`${
          orientation === "vertical"
            ? "bg-gray-400 w-full h-px"
            : "bg-gray-400 h-full w-px"
        }`}
      />

      <div className="w-full h-full flex items-center justify-center">
        <div
          className={
            orientation === "horizontal"
              ? "rotate-90 w-full h-full"
              : "w-full h-full"
          }
        >
          <Dots count={values[1]} />
        </div>
      </div>

      {isDouble && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-2 h-2 bg-black-600 rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default DominoTile;
