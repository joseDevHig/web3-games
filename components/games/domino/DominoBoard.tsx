import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { BoardLogic, DominoPiece } from "./BoardLogic";
import type {
  Domino,
  DominoBoardProps,
  Player,
  PlayerLayoutInfo,
} from "./types";
import DominoTile from "./DominoTile";
import { Position } from "@/types";
import { useIsMobile } from "@/hooks/useIsMobil";

const getPlayerLayout = (
  players: Player[],
  playerOrder: string[],
  address: string | null,
  hands: Record<string, Domino[]> | undefined
): PlayerLayoutInfo[] => {
  if (!address || playerOrder.length === 0) return [];

  const myIndex = playerOrder.indexOf(address);
  if (myIndex === -1) return [];

  const layout: ("bottom" | "left" | "top" | "right")[] = [
    "bottom",
    "left",
    "top",
    "right",
  ];
  const playerCount = playerOrder.length;

  return playerOrder
    .map((pid, index) => {
      const relativeIndex = (index - myIndex + playerCount) % playerCount;
      let position: "bottom" | "left" | "top" | "right";

      if (playerCount <= 2) {
        position = relativeIndex === 0 ? "bottom" : "top";
      } else if (playerCount === 3) {
        position = (["bottom", "left", "right"] as const)[relativeIndex];
      } else {
        // 4 players
        position = layout[relativeIndex];
      }

      return {
        player: players.find((p) => p.id === pid)!,
        handSize: hands?.[pid]?.length || 0,
        position,
        isCurrent: false, // This will be set later
      };
    })
    .filter((p) => p.player);
};

const DominoBoard: React.FC<DominoBoardProps> = ({
  match,
  playerHand,
  onDrawTile,
  onPlayDomino,
  onPassTurn,
  address,
  turnTimer,
  onLeave,
  nativeCurrencySymbol,
}) => {
  const {
    gameState,
    players: playerMap,
    hands,
    boneyard,
    desertorsAddress,
  } = match;
  const { board, boardEnds, currentPlayerId, playerOrder } = gameState;
  const [draggedDomino, setDraggedDomino] = useState<{
    domino: Domino;
    index: number;
  } | null>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [boardDimensions, setBoardDimensions] = useState({
    width: 0,
    height: 0,
  });

  const [clickedTile, setClickedTile] = useState<{
    domino: Domino;
    index: number;
  } | null>(null);
  const [isInTable, setIsInTable] = useState(false);

  const [isDealing, setIsDealing] = useState(false);
  const [isAutoPassing, setIsAutoPassing] = useState(false);

  const prevBoardLength = useRef(board.length);

  useEffect(() => {
    // A new round starts when the board goes from many tiles (or 0) to exactly one.

    if (board.length === 1) {
      setIsDealing(true);
      const audio = new Audio("/repartir.ogg");
      audio.play().catch((e) => console.error("Error playing sound:", e));

      // Reset after animation is done (should match CSS transition duration)
      setTimeout(() => setIsDealing(false), 1500);
    }
    prevBoardLength.current = board.length;
  }, [board.length]);

  useEffect(() => {
    const container = boardContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      setBoardDimensions({
        width: container.offsetWidth,
        height: container.offsetHeight,
      });
    });

    resizeObserver.observe(container);
    setBoardDimensions({
      width: container.offsetWidth,
      height: container.offsetHeight,
    });

    return () => resizeObserver.disconnect();
  }, []);

  const boardLogic = useMemo(() => {
    const { width, height } = boardDimensions;
    if (!width || !height) return null;

    const LOGICAL_UNIT_PX = 24;
    const MAX_CELLS_W = 40;
    const MAX_CELLS_H = 30;

    const cellWidth = Math.min(
      MAX_CELLS_W,
      Math.max(8, Math.floor(width / LOGICAL_UNIT_PX))
    );
    const cellHeight = Math.min(
      MAX_CELLS_H,
      Math.max(6, Math.floor(height / LOGICAL_UNIT_PX))
    );

    const logic = new BoardLogic(cellWidth, cellHeight);
    if (match.gameState.board.length > 0) {
      match.gameState.board.forEach((tile, index) => {
        if (!tile) return;
        const piece = new DominoPiece(tile.domino[0], tile.domino[1]);
        const isHead = tile.placement === "right";

        if (index === 0) {
          logic.startGame(piece);
        } else {
          try {
            logic.placePiece(piece, isHead);
          } catch (e) {
            console.error(`Error placing piece ${index}:`, e);
          }
        }
      });
    }
    return logic;
  }, [match.gameState.board, boardDimensions]);

  const isMobile = useIsMobile();

  const boardLayout = useMemo(() => {
    let { width, height } = boardDimensions;
    if (
      !width ||
      !height ||
      !boardLogic ||
      match.gameState.board.length === 0
    ) {
      return {
        tiles: [],
        leftEndPos: { x: 0, y: 0, orientation: "vertical" },
        rightEndPos: { x: 0, y: 0, orientation: "vertical" },
        tileScale: 1,
        tileLong: 0,
        tileShort: 0,
      };
    }

    const boardState = boardLogic.getBoardState();
    const { placedPieces, boardMeta } = generarFichasDesdeStringsV2({
      // center: "6-6",
      left: [
        // "4-4",
        // "6-4",
        // "6-2",
        // "2-1",
        // "1-6",
        // "6-3",
        // "3-1",
        // "0-5",
        // "5-4",
        // "4-0",
        // "0-2",
        // "2-2",
        // "2-6",
        // "6-4",
        // "4-4",
        // "4-2",
        // "2-1",
        // "1-2",
        // "3-5",
        // "5-6",
      ].reverse(),
      // right: [
      //   "6-4",
      //   "4-2",
      //   "2-0",
      //   "0-5",
      //   "5-1",
      //   "1-2",
      // "1-4",
      // "4-3",
      // "3-1",
      // "1-5",
      // "5-3",
      // "3-6",
      // "6-1",
      // "1-1",
      // "1-2",
      // "2-5",
      // "5-0",
      // ],
    });

    let TILE_SCALE = isMobile ? 0.6 : 1;

    const piezasLeft = [];
    const piezasRight = [];

    if (placedPieces.length == 0) {
      for (let i = 0; i < boardState.placedPieces.length; i++) {
        const currentPiece = boardState.placedPieces[i];
        const placement = match.gameState.board[i].placement;

        if (placement === "left") {
          piezasLeft.push(currentPiece);
        } else if (placement === "right") {
          piezasRight.push(currentPiece);
        }
      }
    } else {
      for (let i = 0; i < placedPieces.length; i++) {
        const currentPiece = placedPieces[i];
        const placement = boardMeta[i].placement;

        if (placement === "left") {
          piezasLeft.push(currentPiece);
        } else if (placement === "right") {
          piezasRight.push(currentPiece);
        }
      }
    }

    if (piezasLeft.length > 8 || piezasRight.length > 8) {
      if (!isMobile) {
        TILE_SCALE = TILE_SCALE - 0.1;
      }
    }
    if (piezasLeft.length > 14 || piezasRight.length > 14) {
      if (!isMobile) {
        TILE_SCALE = TILE_SCALE - 0.1;
      }
    }

    let TILE_SHORT = 3 * 16 * TILE_SCALE;
    let TILE_LONG = 6 * 16 * TILE_SCALE;
    const TILE_GAP = 2 * TILE_SCALE;

    const tiles: {
      piece: DominoPiece;
      position: Position;
      orientation: "horizontal" | "vertical";
      x: number;
      y: number;
      rotation: number;
      tipoDibujado: string;
    }[] = [];
    //DIBIZV1 Significa que estoy dibujando de derecha a izquierda
    //DIBIZV2 Significa que estoy dibujando de arriba hacia abajo
    //DIBIZV3 Significa que estoy dibujando de izquierda a derecha
    //DIBIZV4 Significa que estoy dibujando de abajo hacia arriba
    //DIBDRV1 Significa que estoy dibujando de izquierda a derecha
    //DIBDRV2 Significa que estoy dibujando de abajo hacia arriba
    //DIBDRV3 Significa que estoy dibujando de derecha a izquierda
    //DIBDRV4 Significa que estoy dibujando de arriba hacia abajo
    let headLeft: any = null;
    let headRight: any = null;
    let dibujandoIzquierda = "DIBIZV1";
    let dibujandoDerecha = "DIBDRV1";
    /*if (isMobile) {
      width = height;
      height = width;
    }*/

    type PositionTypeTemp = [number, number];
    interface FichaInput {
      center?: string;
      left?: string[];
      right?: string[];
    }

    function generarFichasDesdeStringsV2(data: FichaInput): {
      placedPieces: {
        piece: DominoPiece;
        position: PositionTypeTemp;
        orientation: "horizontal" | "vertical";
      }[];
      boardMeta: { placement: "left" | "right" | "start" }[];
    } {
      const placedPieces: {
        piece: DominoPiece;
        position: PositionTypeTemp;
        orientation: "horizontal" | "vertical";
      }[] = [];
      const boardMeta: { placement: "left" | "right" | "start" }[] = [];

      // Primero: ficha central si existe
      if (data.center) {
        const [left, right] = data.center.split("-").map(Number);
        const piece = new DominoPiece(left, right);
        placedPieces.push({
          piece,
          position: [0, 0],
          orientation: piece.isDouble() ? "vertical" : "horizontal",
        });
        boardMeta.push({ placement: "start" });
      }

      // Segundo: fichas a la izquierda
      for (const ficha of data.left ?? []) {
        const [left, right] = ficha.split("-").map(Number);
        const piece = new DominoPiece(left, right);
        placedPieces.push({
          piece,
          position: [0, 0],
          orientation: piece.isDouble() ? "vertical" : "horizontal",
        });
        boardMeta.push({ placement: "left" });
      }

      // Tercero: fichas a la derecha
      for (const ficha of data.right ?? []) {
        const [left, right] = ficha.split("-").map(Number);
        const piece = new DominoPiece(left, right);
        placedPieces.push({
          piece,
          position: [0, 0],
          orientation: piece.isDouble() ? "vertical" : "horizontal",
        });
        boardMeta.push({ placement: "right" });
      }

      return { placedPieces, boardMeta };
    }

    let pieces =
      placedPieces.length > 0 ? placedPieces : boardState.placedPieces;

    let paddingDesktop = isMobile ? 0 : 16;
    const cuartoFicha = TILE_SHORT / 2;
    let widthPlayer = isMobile ? 50 : 70;
    let heightOponentTop = isMobile ? 50 : 70;
    if (pieces.length > 0) {
      const indexOfCenter =
        placedPieces.length > 0
          ? boardMeta.findIndex((meta) => meta.placement === "start")
          : match.gameState.board.findIndex(
              (meta) => meta.placement === "start"
            );
      let firstPieceDetails = pieces[indexOfCenter];

      let firstTile = {
        ...firstPieceDetails,
        x: width / 2 - TILE_SHORT / 2, // Start at origin, will be centered later
        y: height / 2 - TILE_LONG / 2,
        rotation: 0,
        tipoDibujado: "DIBV0",
      };
      if (isMobile) {
        firstPieceDetails.orientation = "horizontal";
        dibujandoIzquierda = "DIBIZV2";
        dibujandoDerecha = "DIBDRV2";
        firstTile = {
          ...firstPieceDetails,
          x: width / 2 - TILE_LONG / 2, // Start at origin, will be centered later
          y: height / 2 - TILE_SHORT / 2,
          rotation: 0,
          tipoDibujado: "DIBV0",
        };
      }

      tiles.push(firstTile);
      headLeft = firstTile;
      headRight = firstTile;
      //let bottomPlayer = isMobile ? 80 : 112;

      for (let i = 0; i < piezasLeft.length; i++) {
        const currentDetails = piezasLeft[i];
        const ultimoTileDibujado = tiles.find(
          (t) =>
            t.piece.left === headLeft.piece.left &&
            t.piece.right === headLeft.piece.right
        );
        const siguienteFicha =
          i + 1 < piezasLeft.length ? piezasLeft[i + 1] : null;
        let siguienteFichaIsDoble = siguienteFicha?.piece.isDouble() ?? false;
        let x = 0;
        let y = 0;
        if (ultimoTileDibujado) {
          //ESTA FICHA SE DEBE DIBUJAR A LA IZQUIERDA
          if (dibujandoIzquierda == "DIBIZV1") {
            if (currentDetails.orientation === "horizontal") {
              //aqui la ficha se va a dibujar horizontalmente
              x = ultimoTileDibujado.x - TILE_LONG - TILE_GAP;
              if (ultimoTileDibujado.orientation === "vertical") {
                y = ultimoTileDibujado.y + TILE_SHORT / 2;
              } else {
                //si la ultima ficha esta echada, el y se mantiene igual
                y = ultimoTileDibujado.y;
              }
            } else {
              //aqui la ficha se tiene que dibujar verticalmente
              x = ultimoTileDibujado.x - TILE_SHORT - TILE_GAP;
              y = ultimoTileDibujado.y - TILE_SHORT / 2;
            }
            const tile = {
              ...currentDetails,
              x: x, // Start at origin, will be centered later
              y: y,
              rotation: 0,
              tipoDibujado: dibujandoIzquierda,
            };
            const spacingNeededLeft = siguienteFichaIsDoble ? TILE_SHORT : 0;
            const limiteIzquierdo =
              widthPlayer + paddingDesktop + spacingNeededLeft + 4;
            if (currentDetails.piece.isDouble()) {
              tiles.push(tile);
              headLeft = tile;
              if (x <= limiteIzquierdo) {
                dibujandoIzquierda = "DIBIZV2";
                continue;
              }
            } else {
              if (x <= limiteIzquierdo) {
                // currentDetails.piece.inverted();
                dibujandoIzquierda = "DIBIZV2";
              } else {
                tiles.push(tile);
                headLeft = tile;
              }
            }
          }
          if (dibujandoIzquierda == "DIBIZV2") {
            let orientacionOriginal = currentDetails.orientation;
            if (orientacionOriginal === "horizontal") {
              //significa que se dibujara verticalmente
              currentDetails.orientation = "vertical";
              if (ultimoTileDibujado.orientation === "vertical") {
                x = ultimoTileDibujado.x;
                y = ultimoTileDibujado.y + TILE_LONG + TILE_GAP;
              } else {
                x = ultimoTileDibujado.x;
                y = ultimoTileDibujado.y + TILE_SHORT + TILE_GAP;
              }
              if (
                ultimoTileDibujado.piece.isDouble() &&
                (ultimoTileDibujado.tipoDibujado == "DIBIZV2" || isMobile)
              ) {
                x += TILE_SHORT / 2;
              }
            } else {
              //significa que se dibujara verticalmente, porque esta ficha es un doble
              currentDetails.orientation = "horizontal";
              x = ultimoTileDibujado.x - TILE_SHORT / 2;
              y = ultimoTileDibujado.y + TILE_LONG + TILE_GAP;
            }

            const tile = {
              ...currentDetails,
              x: x,
              y: y,
              rotation: 0,
              tipoDibujado: dibujandoIzquierda,
            };
            let spacingNeededBottom = siguienteFichaIsDoble
              ? TILE_SHORT
              : TILE_LONG;
            let heightFichaActual =
              currentDetails.orientation === "horizontal"
                ? TILE_SHORT
                : TILE_LONG;
            let limiteAbajo = spacingNeededBottom + 4;

            if (currentDetails.piece.isDouble()) {
              tiles.push(tile);
              headLeft = tile;
              if (y + limiteAbajo > height) {
                dibujandoIzquierda = "DIBIZV3";
                continue;
              } else {
                currentDetails.orientation = orientacionOriginal;
              }
            } else {
              if (y + limiteAbajo + heightFichaActual > height) {
                // currentDetails.piece = currentDetails.piece.inverted();
                currentDetails.orientation = orientacionOriginal;
                dibujandoIzquierda = "DIBIZV3";
              } else {
                currentDetails.piece = currentDetails.piece.inverted();

                const tile = {
                  ...currentDetails,
                  x: x, // Start at origin, will be centered later
                  y: y,
                  rotation: 0,
                  tipoDibujado: dibujandoIzquierda,
                };
                currentDetails.orientation = orientacionOriginal;
                tiles.push(tile);
                headLeft = tile;
                continue;
              }
            }
          }
          if (dibujandoIzquierda === "DIBIZV3") {
            //console.log("currentDetails.piece",currentDetails.piece);

            currentDetails.piece = currentDetails.piece.inverted();

            const refTile = headLeft; // última ficha dibujada
            if (currentDetails.orientation === "horizontal") {
              // Ficha “normal” acostada que se coloca a la derecha
              x =
                refTile.orientation === "vertical"
                  ? refTile.x + TILE_SHORT + TILE_GAP
                  : refTile.x + TILE_LONG + TILE_GAP;
              if (refTile.orientation === "vertical") {
                y = refTile.y + TILE_SHORT + TILE_GAP;
                if (refTile.tipoDibujado == "DIBIZV3") {
                  y -= TILE_SHORT / 2;
                }
              } else {
                y = refTile.y;
              }
            } else {
              // Ficha doble: se coloca de pie formando una “T” invertida
              currentDetails.orientation = "vertical";
              x = refTile.x + TILE_LONG + TILE_GAP;
              y = refTile.y - TILE_SHORT / 2;
            }

            const tile = {
              ...currentDetails,
              x,
              y,
              rotation: 0,
              tipoDibujado: dibujandoIzquierda,
            };
            const spacingNeededLeft = siguienteFichaIsDoble ? TILE_SHORT : 0;
            const limiteDerecho =
              width -
              paddingDesktop -
              widthPlayer -
              spacingNeededLeft -
              4 -
              cuartoFicha;
            let widthFichaActual =
              currentDetails.orientation === "horizontal"
                ? TILE_LONG
                : TILE_SHORT;

            if (currentDetails.piece.isDouble()) {
              tiles.push(tile);
              headLeft = tile;
              if (x + widthFichaActual >= limiteDerecho) {
                dibujandoIzquierda = "DIBIZV4";
                continue;
              }
            } else {
              if (x + widthFichaActual >= limiteDerecho) {
                dibujandoIzquierda = "DIBIZV4";
                currentDetails.piece = currentDetails.piece.inverted();
                // console.log("llego aqui", currentDetails.piece);
              } else {
                tiles.push(tile);
                headLeft = tile;
                continue;
              }
            }
          }
          if (dibujandoIzquierda === "DIBIZV4") {
            let orientacionOriginal = currentDetails.orientation;

            if (orientacionOriginal === "horizontal") {
              currentDetails.orientation = "vertical";
              if (ultimoTileDibujado.orientation === "vertical") {
                x = ultimoTileDibujado.x;
                y = ultimoTileDibujado.y - TILE_LONG - TILE_GAP;
              } else {
                x = ultimoTileDibujado.x + TILE_SHORT;
                y = ultimoTileDibujado.y - TILE_LONG - TILE_GAP;
              }

              if (
                ultimoTileDibujado.piece.isDouble() &&
                ultimoTileDibujado.tipoDibujado === "DIBIZV4"
              ) {
                x -= TILE_SHORT / 2;
              }
            } else {
              // ficha doble
              currentDetails.orientation = "horizontal";
              x = ultimoTileDibujado.x - TILE_SHORT / 2;
              y = ultimoTileDibujado.y - TILE_SHORT - TILE_GAP;
            }

            //currentDetails.piece = currentDetails.piece.inverted();
            const tile = {
              ...currentDetails,
              x,
              y,
              rotation: 0,
              tipoDibujado: dibujandoIzquierda,
            };
            tiles.push(tile);
            headLeft = tile;
          }
        }
      }
      /* ── DIBDRV1  (derecha → izquierda, borde superior) ───────── */
      for (let i = 0; i < piezasRight.length; i++) {
        const currentDetails = piezasRight[i];
        const ultimoTileDibujado = tiles.find(
          (t) =>
            t.piece.left === headRight.piece.left &&
            t.piece.right === headRight.piece.right
        );
        const siguienteFicha =
          i + 1 < piezasRight.length ? piezasRight[i + 1] : null;
        let siguienteFichaIsDoble = siguienteFicha?.piece.isDouble() ?? false;

        if (ultimoTileDibujado) {
          let x = 0;
          let y = 0;

          if (dibujandoDerecha === "DIBDRV1") {
            if (currentDetails.orientation === "horizontal") {
              if (ultimoTileDibujado.orientation === "vertical") {
                x = ultimoTileDibujado.x + TILE_SHORT + TILE_GAP;
                y = ultimoTileDibujado.y + TILE_SHORT / 2;
              } else {
                x = ultimoTileDibujado.x + TILE_LONG + TILE_GAP;
                y = ultimoTileDibujado.y;
              }
            } else {
              x = ultimoTileDibujado.x + TILE_LONG + TILE_GAP;
              y = ultimoTileDibujado.y - TILE_SHORT / 2;
            }

            const tile = {
              ...currentDetails,
              x,
              y,
              rotation: 0,
              tipoDibujado: dibujandoDerecha,
            };
            const spacingNeededLeft = siguienteFichaIsDoble ? TILE_SHORT : 0;
            const limiteDerecho =
              width - paddingDesktop - widthPlayer - spacingNeededLeft - 4;
            let widthFichaActual =
              currentDetails.orientation === "horizontal"
                ? TILE_LONG
                : TILE_SHORT;
            if (currentDetails.piece.isDouble()) {
              tiles.push(tile);
              headRight = tile;
              if (x + widthFichaActual >= limiteDerecho) {
                dibujandoDerecha = "DIBDRV2";
                continue;
              }
            } else {
              if (x + widthFichaActual >= limiteDerecho) {
                dibujandoDerecha = "DIBDRV2";
              } else {
                tiles.push(tile);
                headRight = tile;
              }
            }
          }
          if (dibujandoDerecha === "DIBDRV2") {
            let orientacionOriginal = currentDetails.orientation;

            if (orientacionOriginal === "horizontal") {
              currentDetails.orientation = "vertical";
              if (ultimoTileDibujado.orientation === "vertical") {
                x = ultimoTileDibujado.x;
                y = ultimoTileDibujado.y - TILE_LONG - TILE_GAP;
              } else {
                x = ultimoTileDibujado.x + TILE_SHORT;
                y = ultimoTileDibujado.y - TILE_LONG - TILE_GAP;
              }

              if (
                ultimoTileDibujado.piece.isDouble() &&
                (ultimoTileDibujado.tipoDibujado === "DIBDRV2" || isMobile)
              ) {
                x -= TILE_SHORT / 2;
              }
            } else {
              // ficha doble
              currentDetails.orientation = "horizontal";
              x = ultimoTileDibujado.x - TILE_SHORT / 2;
              y = ultimoTileDibujado.y - TILE_SHORT - TILE_GAP;
            }

            let spacingNeededTop = siguienteFichaIsDoble
              ? TILE_SHORT
              : TILE_LONG;
            let limiteArriba =
              spacingNeededTop + heightOponentTop + paddingDesktop + 4;

            currentDetails.piece = currentDetails.piece.inverted();
            const tile = {
              ...currentDetails,
              x,
              y,
              rotation: 0,
              tipoDibujado: dibujandoDerecha,
            };
            if (currentDetails.piece.isDouble()) {
              tiles.push(tile);
              headRight = tile;
              if (y < limiteArriba) {
                dibujandoDerecha = "DIBDRV3";
                continue;
              }
            } else {
              const tile = {
                ...currentDetails,
                x,
                y,
                rotation: 0,
                tipoDibujado: dibujandoDerecha,
              };
              if (y < limiteArriba) {
                dibujandoDerecha = "DIBDRV3";
                currentDetails.orientation = "horizontal";
                currentDetails.piece = currentDetails.piece.inverted();
              } else {
                tiles.push(tile);
                headRight = tile;
                continue;
              }
            }
          }

          //aqui giro a la izquierda
          /* ── DIBDRV3  (derecha → izquierda, borde inferior) ───────── */
          if (dibujandoDerecha === "DIBDRV3") {
            currentDetails.piece = currentDetails.piece.inverted();
            const refTile = headRight;

            if (currentDetails.orientation === "horizontal") {
              x =
                refTile.orientation === "vertical"
                  ? refTile.x - TILE_LONG - TILE_GAP
                  : refTile.x - TILE_SHORT - TILE_GAP;

              if (refTile.orientation === "vertical") {
                y = refTile.y;
                if (refTile.tipoDibujado === "DIBDRV3") {
                  y += TILE_SHORT / 2;
                }
              } else {
                y = refTile.y;
                x -= TILE_SHORT;
              }
            } else {
              currentDetails.orientation = "vertical";
              x = refTile.x - TILE_SHORT - TILE_GAP;
              y = refTile.y - TILE_SHORT / 2;
            }

            const tile = {
              ...currentDetails,
              x,
              y,
              rotation: 0,
              tipoDibujado: dibujandoDerecha,
            };
            const spacingNeededLeft = siguienteFichaIsDoble ? TILE_SHORT : 0;
            const limiteIzquierdo =
              widthPlayer +
              paddingDesktop +
              spacingNeededLeft +
              4 +
              cuartoFicha;
            if (currentDetails.piece.isDouble()) {
              tiles.push(tile);
              headRight = tile;
              if (x <= limiteIzquierdo) {
                dibujandoDerecha = "DIBDRV4";
                continue;
              }
            } else {
              if (x <= limiteIzquierdo) {
                dibujandoDerecha = "DIBDRV4";
                currentDetails.piece = currentDetails.piece.inverted();
              } else {
                tiles.push(tile);
                headRight = tile;
              }
            }
          }
          if (dibujandoDerecha == "DIBDRV4") {
            let orientacionOriginal = currentDetails.orientation;
            if (orientacionOriginal === "horizontal") {
              //significa que se dibujara verticalmente
              currentDetails.orientation = "vertical";
              if (ultimoTileDibujado.orientation === "vertical") {
                x = ultimoTileDibujado.x;
                y = ultimoTileDibujado.y + TILE_LONG + TILE_GAP;
              } else {
                x = ultimoTileDibujado.x;
                y = ultimoTileDibujado.y + TILE_SHORT + TILE_GAP;
              }
              if (
                ultimoTileDibujado.piece.isDouble() &&
                ultimoTileDibujado.tipoDibujado == "DIBDRV4"
              ) {
                x += TILE_SHORT / 2;
              }
            } else {
              //significa que se dibujara verticalmente, porque esta ficha es un doble
              currentDetails.orientation = "horizontal";
              x = ultimoTileDibujado.x - TILE_SHORT / 2;
              y = ultimoTileDibujado.y + TILE_LONG + TILE_GAP;
            }

            const tile = {
              ...currentDetails,
              x: x, // Start at origin, will be centered later
              y: y,
              rotation: 0,
              tipoDibujado: dibujandoDerecha,
            };
            tiles.push(tile);
            headRight = tile;
          }
        }
      }
    }
    let leftEndPos = { x: 0, y: 0, orientation: "vertical" };
    const fichaclick = clickedTile?.domino ?? [null, null];
    const isDoble =
      fichaclick[0] === fichaclick[1] &&
      fichaclick[0] !== null &&
      fichaclick[1] !== null;
    if (headLeft) {
      if (dibujandoIzquierda == "DIBIZV1") {
        let widthFichaActual =
          headLeft.orientation === "horizontal" && isDoble
            ? TILE_SHORT
            : TILE_LONG;
        const limiteIzquierdo =
          paddingDesktop + widthPlayer + widthFichaActual + 4;
        if (headLeft.x < limiteIzquierdo) {
          dibujandoIzquierda = "DIBIZV2";
        } else {
          if (headLeft.orientation === "horizontal") {
            if (isDoble) {
              leftEndPos = {
                x: headLeft.x - TILE_SHORT,
                y: headLeft.y - TILE_SHORT / 2,
                orientation: "vertical",
              };
            } else {
              leftEndPos = {
                x: headLeft.x - TILE_LONG,
                y: headLeft.y,
                orientation: "horizontal",
              };
            }
          } else {
            leftEndPos = {
              x: headLeft.x - TILE_LONG,
              y: headLeft.y + TILE_SHORT / 2,
              orientation: "horizontal",
            };
          }
        }
      }
      if (dibujandoIzquierda == "DIBIZV2") {
        let heightFichaActual =
          headRight.orientation === "horizontal" ? TILE_SHORT : TILE_LONG;
        const limiteAbajo = 4 + TILE_LONG;
        if (headLeft.y + heightFichaActual + limiteAbajo > height) {
          dibujandoIzquierda = "DIBIZV3";
        } else {
          if (headLeft.orientation === "horizontal") {
            leftEndPos = {
              x: headLeft.x + TILE_SHORT / 2,
              y: headLeft.y + TILE_SHORT,
              orientation: "vertical",
            };
          } else {
            if (isDoble) {
              leftEndPos = {
                x: headLeft.x - TILE_SHORT / 2,
                y: headLeft.y + TILE_LONG,
                orientation: "horizontal",
              };
            } else {
              leftEndPos = {
                x: headLeft.x,
                y: headLeft.y + TILE_LONG,
                orientation: "vertical",
              };
            }
          }
        }
      }
      /* ── DIBIZV3  (izquierda → derecha, borde inferior) ───────── */
      if (dibujandoIzquierda === "DIBIZV3") {
        let widthFichaActual =
          headRight.orientation === "horizontal" ? TILE_LONG : TILE_SHORT;
        const limiteDerecho =
          width - paddingDesktop - widthPlayer - 4 - TILE_SHORT;
        if (headRight.x + widthFichaActual > limiteDerecho) {
          dibujandoIzquierda = "DIBIZV4";
        }

        if (headLeft.orientation === "horizontal") {
          if (isDoble) {
            leftEndPos.x = headLeft.x + TILE_LONG;
            leftEndPos.y = headLeft.y - TILE_SHORT / 2;
            leftEndPos.orientation = "vertical";
          } else {
            leftEndPos.x = headLeft.x + TILE_LONG;
            leftEndPos.y = headLeft.y;
            leftEndPos.orientation = "horizontal";
          }
        } else {
          // vertical
          leftEndPos.x = headLeft.x + TILE_SHORT;
          leftEndPos.y = headLeft.y + TILE_SHORT / 2;
          leftEndPos.orientation = "horizontal";
        }
      }
      if (dibujandoIzquierda === "DIBIZV4") {
        // console.log("leftEndPos", leftEndPos);
        if (isDoble) {
          leftEndPos = {
            x: headLeft.x - TILE_SHORT / 2,
            y: headLeft.y - TILE_SHORT,
            orientation: "horizontal",
          };
        } else {
          if (headLeft.orientation === "horizontal") {
            leftEndPos = {
              x: headLeft.x + TILE_SHORT / 2,
              y: headLeft.y - TILE_LONG,
              orientation: "vertical",
            };
          } else {
            // headLeft.orientation === "vertical"
            leftEndPos = {
              x: headLeft.x,
              y: headLeft.y - TILE_LONG,
              orientation: "vertical",
            };
          }
        }
      }
    }

    let rightEndPos = { x: 0, y: 0, orientation: "vertical" };
    if (headRight) {
      // ── DIBDRV1 (izquierda → derecha, fase inicial) ────────────────
      if (dibujandoDerecha === "DIBDRV1") {
        let widthFichaActual =
          headRight.orientation === "horizontal" ? TILE_LONG : TILE_SHORT;
        const limiteDerecho =
          width - paddingDesktop - widthPlayer - 4 - TILE_LONG;

        if (headRight.x + widthFichaActual > limiteDerecho) {
          dibujandoDerecha = "DIBDRV2";
        } else {
          if (headRight.orientation === "horizontal") {
            if (isDoble) {
              rightEndPos = {
                x: headRight.x + TILE_LONG,
                y: headRight.y - TILE_SHORT / 2,
                orientation: "vertical",
              };
            } else {
              rightEndPos = {
                x: headRight.x + TILE_LONG,
                y: headRight.y,
                orientation: "horizontal",
              };
            }
          } else {
            // vertical
            rightEndPos = {
              x: headRight.x + TILE_SHORT,
              y: headRight.y + TILE_SHORT / 2,
              orientation: "horizontal",
            };
          }
        }
      }

      // ── DIBDRV2 (borde derecho → gira hacia arriba) ───────────────
      if (dibujandoDerecha === "DIBDRV2") {
        if (headRight.orientation === "horizontal") {
          rightEndPos = {
            x: headRight.x + TILE_SHORT / 2,
            y: headRight.y - TILE_LONG,
            orientation: "vertical",
          };
        } else {
          // vertical
          if (isDoble) {
            rightEndPos = {
              x: headRight.x - TILE_SHORT / 2,
              y: headRight.y - TILE_SHORT,
              orientation: "horizontal",
            };
          } else {
            rightEndPos = {
              x: headRight.x,
              y: headRight.y - TILE_LONG,
              orientation: "vertical",
            };
          }
        }
      }

      // ── DIBDRV3 (borde superior → gira hacia la izquierda) ─────────
      if (dibujandoDerecha === "DIBDRV3") {
        const limiteIzquierdo = paddingDesktop + widthPlayer + TILE_SHORT + 4;
        let needSpacing = isDoble ? TILE_SHORT : TILE_LONG;

        if (headRight.x < limiteIzquierdo + needSpacing) {
          dibujandoDerecha = "DIBDRV4";
        }
        if (headRight.orientation === "horizontal") {
          if (isDoble) {
            rightEndPos = {
              x: headRight.x - TILE_SHORT,
              y: headRight.y - TILE_SHORT / 2,
              orientation: "vertical",
            };
          } else {
            rightEndPos = {
              x: headRight.x - TILE_LONG,
              y: headRight.y,
              orientation: "horizontal",
            };
          }
        } else {
          // vertical
          if (isDoble) {
            rightEndPos = {
              x: headRight.x - TILE_SHORT / 2,
              y: headRight.y - TILE_SHORT,
              orientation: "horizontal",
            };
          } else {
            rightEndPos = {
              x: headRight.x - TILE_LONG,
              y: headRight.y + TILE_SHORT / 2,
              orientation: "horizontal",
            };
          }
        }
      }

      if (dibujandoDerecha == "DIBDRV4") {
        if (headRight.orientation === "horizontal") {
          rightEndPos = {
            x: headRight.x + TILE_SHORT / 2,
            y: headRight.y + TILE_SHORT,
            orientation: "vertical",
          };
        } else {
          if (isDoble) {
            rightEndPos = {
              x: headRight.x - TILE_SHORT / 2,
              y: headRight.y + TILE_LONG,
              orientation: "horizontal",
            };
          } else {
            rightEndPos = {
              x: headRight.x,
              y: headRight.y + TILE_LONG,
              orientation: "vertical",
            };
          }
        }
      }
    }
    return {
      tiles: tiles,
      leftEndPos,
      rightEndPos,
      tileScale: TILE_SCALE,
      tileLong: TILE_LONG,
      tileShort: TILE_SHORT,
      froceDrawDrag: true,
    };
  }, [boardDimensions, boardLogic, match.gameState.board]);

  const players = useMemo(() => Object.values(playerMap || {}), [playerMap]);
  const playerLayout = useMemo(
    () => getPlayerLayout(players, playerOrder, address, hands),
    [players, playerOrder, address, hands]
  );

  const isMyTurn = currentPlayerId === address;
  const myScore = useMemo(() => {
    const player = players.find((p) => p.id === address);
    if (!player) return 0;

    const team = player.team;
    return gameState.teamScores[team] ?? 0;
  }, [players, address, gameState.teamScores]);

  const playableMoves = useMemo(() => {
    if (!isMyTurn || boardEnds[0] === null || boardEnds[1] === null)
      return new Set();
    const moves = new Set<string>();
    playerHand.forEach((domino) => {
      if (domino.includes(boardEnds[0]!)) moves.add(JSON.stringify(domino));
      if (boardEnds[0] !== boardEnds[1] && domino.includes(boardEnds[1]!))
        moves.add(JSON.stringify(domino));
    });
    return moves;
  }, [playerHand, boardEnds, isMyTurn]);

  // Reset auto-passing state on turn change
  useEffect(() => {
    setIsAutoPassing(false);
  }, [isMyTurn]);

  // Auto-pass logic
  useEffect(() => {
    if (
      isMyTurn &&
      gameState.phase === "playing" &&
      boneyard &&
      boneyard.length === 0 &&
      playableMoves.size === 0 &&
      !isAutoPassing
    ) {
      console.log("No playable moves, auto-passing...");
      setIsAutoPassing(true);
      const passTimeout = setTimeout(() => {
        onPassTurn();
      }, 0);

      return () => clearTimeout(passTimeout);
    }
  }, [
    isMyTurn,
    gameState.phase,
    playableMoves.size,
    onPassTurn,
    isAutoPassing,
  ]);

  const handleClicTilePool = (tile: Domino) => {
    if (playableMoves.size > 0) {
      return;
    }

    onDrawTile(tile);
  };

  const selectDomino = (domino: Domino, index: number) => {
    if (
      clickedTile &&
      clickedTile.index === index &&
      clickedTile.domino === domino
    ) {
      setDraggedDomino(null);
      setClickedTile(null);
      return;
    }
    setDraggedDomino({ domino, index });
    setClickedTile({ domino, index });
    const container = boardContainerRef.current;
    if (container != null) {
      setBoardDimensions({
        width: container.offsetWidth,
        height: container.offsetHeight,
      });
    }
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    domino: Domino,
    index: number
  ) => {
    if (!clickedTile || clickedTile.index !== index) {
      selectDomino(domino, index);
    }

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ domino, index }));
  };

  const handleTileClick = (
    e: React.MouseEvent<HTMLDivElement>,
    domino: Domino,
    index: number
  ) => {
    selectDomino(domino, index);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, end: "left" | "right") => {
      e.preventDefault();
      if (!draggedDomino || !boardLogic) return;

      try {
        const piece = new DominoPiece(
          draggedDomino.domino[0],
          draggedDomino.domino[1]
        );
        const isHead = end === "right";

        if (boardLogic.isPlayable(piece, isHead)) {
          onPlayDomino(draggedDomino.domino, draggedDomino.index, end);
          const audio = new Audio("/place.ogg");
          audio.play().catch((e) => console.error("Error playing sound:", e));
        }
      } catch (error) {
        console.error("Invalid move:", error);
      }
      setDraggedDomino(null);
      setClickedTile(null);
    },
    [draggedDomino, onPlayDomino, boardLogic]
  );

  const renderPlayerArea = (info: PlayerLayoutInfo) => {
    if (!info?.player) return null;

    const isCurrent = info.player.id === currentPlayerId;
    const isDisconnected =
      !info.player.isAI && info.player.isConnected === false;

    const isMobile = useIsMobile();

    // Determine emoji based on player type and connection status
    let emoji = "👤"; // Default human icon
    if (info.player.isAI) {
      emoji = "🤖"; // AI icon
    } else if (isDisconnected) {
      emoji = "⚠️"; // Disconnected icon
    }

    // ✅ Obtener score del equipo del jugador
    const team = info.player.team;
    const score = gameState.teamScores?.[team] ?? 0;

    return (
      <div
        key={info.player.id}
        className={`absolute z-10 ${
          info.position === "bottom"
            ? "bottom-4 left-1/2 -translate-x-1/2"
            : info.position === "top"
            ? `${!isMobile ? "top-4" : ""} left-1/2 -translate-x-1/2`
            : info.position === "left"
            ? `${!isMobile ? "left-4" : ""} top-1/2 -translate-y-1/2`
            : info.position === "right"
            ? `${!isMobile ? "right-4" : "right-0"} top-1/2 -translate-y-1/2`
            : ""
        }`}
      >
        <div
          className={`
    ${
      info.position === "top"
        ? `h-[50px] w-auto max-w-[60vw]`
        : `${isMobile ? "w-[50px]" : "w-[70px]"} h-auto max-h-[90vh]`
    }
    flex items-center justify-between gap-2 px-2 py-1 sm:px-3 sm:py-2 
    backdrop-blur-sm rounded-xl shadow-lg border 
    ${isCurrent ? "border-amber-500/80" : "border-white/20"} text-white 
    ${
      info.position === "left" || info.position === "right"
        ? "flex-col text-center"
        : "flex-row text-start"
    }
    overflow-hidden
  `}
        >
          <div className="text-xl sm:text-2xl flex-shrink-0">{emoji}</div>

          <div
            className={`flex ${
              info.position === "left" || info.position === "right"
                ? "flex-col items-center justify-center"
                : "flex-row items-center justify-center"
            } flex-shrink-0`}
            style={{ perspective: "600px", transformStyle: "preserve-3d" }}
          >
            {Array.from({ length: info.handSize }).map((_, i) => {
              const count = info.handSize;
              const isFirst = i === 0;

              let overlap = Math.max(6, 20 - count);
              if (info.position === "left" || info.position === "right") {
                overlap = Math.max(6, 40 - count);
              }
              const zStep = Math.max(2, 10 - Math.floor(count / 4));
              const angleBase = -Math.min(12, count);
              const angleStep = Math.max(1, 5 - Math.floor(count / 6));

              const zIndex = i + 1;

              let transform = "";
              if (info.position === "top") {
                const rotateY = `${angleBase + i * angleStep}deg`;
                const translateZ = `${i * zStep}px`;
                transform = `translateZ(${translateZ}) rotateY(${rotateY})`;
              } else {
                const rotateX = `${angleBase + i * angleStep}deg`;
                const translateZ = `${i * zStep}px`;
                transform = `translateZ(${translateZ}) rotateX(${rotateX}) rotate(90deg)`;
              }

              return (
                <div
                  key={i}
                  style={{
                    marginLeft:
                      info.position === "top"
                        ? isFirst
                          ? 0
                          : `-${overlap}px`
                        : 0,
                    marginTop:
                      info.position === "left" || info.position === "right"
                        ? isFirst
                          ? 0
                          : `-${overlap}px`
                        : 0,
                    zIndex,
                    transform,
                    transformOrigin: "center",
                    transition: "transform 160ms ease, margin 160ms ease",
                    boxShadow: "0 6px 12px rgba(0,0,0,0.18)",
                    borderRadius: 10,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    overflow: "visible",
                  }}
                >
                  <DominoTile
                    values={[0, 0]}
                    scale={0.5}
                    faceDown={true}
                    onClick={() => {}}
                    clickedTile={clickedTile}
                    isClickable={false}
                    isPlayable={false}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-medium">
              {info.player.isAI ? "AI" : info.player.address.slice(0, 5)}
            </div>
            <div className="text-[0.6rem] text-emerald-300 mt-0.5">
              Points: {score}
            </div>
          </div>

          {/* Timer */}
          {isCurrent && gameState.phase === "playing" && (
            <div className="ml-2 flex-shrink-0">
              <p className="text-xs font-mono text-amber-300 animate-pulse">
                {turnTimer}s
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBoard = () => {
    if (!boardLayout || !boardLayout.tiles.length) return null;

    return boardLayout.tiles.map(({ piece, x, y, orientation }, index) => (
      <div
        key={index}
        // className="transition-all duration-500"
        style={{
          position: "absolute",
          left: `${x}px`,
          top: `${y}px`,
          margin: "1px auto",
        }}
      >
        <DominoTile
          values={[piece.left, piece.right]}
          scale={boardLayout.tileScale}
          orientation={orientation}
          isInTable={true}
          clickedTile={clickedTile}
        />
      </div>
    ));
  };

  const renderGameOverlays = () => {
    if (gameState.phase !== "roundOver" && gameState.phase !== "gameOver")
      return null;

    const winnerText = gameState.matchWinner
      ? `Team ${gameState.matchWinner} Wins the Match!`
      : "Round Over!";

    let message = "";
    if (gameState.roundWinnerInfo) {
      const { team, score, method } = gameState.roundWinnerInfo;
      if (method === "cancelled") {
        message = "Game cancelled due to player disconnection.";
      } else {
        const reasonText = method === "blocked" ? " (Game Blocked)" : "";
        message = `Team ${team} wins the round with ${score} points${reasonText}.`;
      }
    }

    const renderGameOverButton = () => {
      if (gameState.phase !== "gameOver") return null;

      const isCashGame = match.type === "cash" && match.bet;

      if (isCashGame) {
        const totalPot = match.bet!.amount * Object.keys(playerMap).length;
        const currencySymbol =
          match.bet!.currency === "native" ? nativeCurrencySymbol : "USDT";
        return (
          <div className="mt-8 text-center">
            <p className="text-lg text-gray-300">Total Pot Won:</p>
            <p className="text-2xl font-bold text-green-400">
              {totalPot.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              })}{" "}
              {currencySymbol}
            </p>
            <button
              onClick={onLeave}
              className="mt-4 font-display bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg text-lg transition-all duration-300 shadow-lg hover:shadow-green-500/40 transform hover:scale-105"
            >
              Claim Reward
            </button>
          </div>
        );
      } else {
        // Local AI game or other free games
        return (
          <button
            onClick={onLeave}
            className="mt-8 font-display bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold py-3 px-8 rounded-lg text-lg transition-all duration-300 shadow-lg hover:shadow-amber-300/40 transform hover:scale-105"
          >
            Return to Lobby
          </button>
        );
      }
    };

    return (
      <div className="absolute col-span-full row-span-full inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-30 text-center p-4">
        {gameState.phase === "gameOver" && (
          <div className="font-display text-4xl sm:text-6xl text-amber-400 mb-4">
            {gameState.roundWinnerInfo?.method === "cancelled"
              ? "Game Cancelled"
              : "Game Over!"}
          </div>
        )}
        <div className="font-display text-2xl sm:text-4xl text-white">
          {winnerText}
        </div>
        {message && (
          <p className="text-base sm:text-xl mt-2 text-gray-300">{message}</p>
        )}
        {renderGameOverButton()}
      </div>
    );
  };

  const dropZoneClasses =
    "border-4 border-dashed rounded-lg transition-colors duration-300 flex items-center justify-center";
  const canDropLeft =
    isMyTurn &&
    draggedDomino &&
    boardEnds[0] !== null &&
    draggedDomino.domino.includes(boardEnds[0]!);
  const canDropRight =
    isMyTurn &&
    draggedDomino &&
    boardEnds[1] !== null &&
    draggedDomino.domino.includes(boardEnds[1]!);

  return (
    <div
      className="w-full flex-grow flex flex-col relative overflow-hidden"
      style={{
        background:
          "radial-gradient(circle, #166534 0%, #14532d 80%, #064e3b 100%)",
        boxShadow: "inset 0 0 50px rgba(0,0,0,0.6)",
      }}
    >
      <div className="flex-grow relative">
        {/* Opponent Player Areas */}
        {playerLayout
          .filter((p) => p.position !== "bottom")
          .map(renderPlayerArea)}

        {/* Game Overlays */}
        {renderGameOverlays()}

        {/* Game Board */}
        <div ref={boardContainerRef} className="absolute inset-0 w-full h-full">
          {renderBoard()}

          {board.length > 0 &&
            isMyTurn &&
            boardLayout &&
            boardLayout.tileShort > 0 && (
              <>
                <div
                  className={`absolute z-10 ${
                    isMobile
                      ? "top-0 left-0 w-full h-1/2"
                      : "top-0 left-0 w-1/2 h-full"
                  }`}
                  onDragOver={(e) => {
                    if (canDropLeft) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }
                  }}
                  onDrop={(e) => {
                    if (canDropLeft) handleDrop(e, "left");
                  }}
                  onClick={(e) => {
                    if (clickedTile) {
                      handleDrop(
                        e as React.DragEvent<HTMLDivElement>,
                        isMobile ? "right" : "left"
                      );
                    }
                  }}
                />

                <div
                  className={`absolute z-10 ${
                    isMobile
                      ? "bottom-0 left-0 w-full h-1/2"
                      : "top-0 right-0 w-1/2 h-full"
                  }`}
                  onDragOver={(e) => {
                    if (canDropRight) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }
                  }}
                  onDrop={(e) => {
                    if (canDropRight) handleDrop(e, "right");
                  }}
                  onClick={(e) => {
                    if (clickedTile) {
                      handleDrop(
                        e as React.DragEvent<HTMLDivElement>,
                        isMobile ? "left" : "right"
                      );
                    }
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: `${boardLayout.leftEndPos.x}px`,
                    top: `${boardLayout.leftEndPos.y}px`,
                    width: `${
                      boardLayout.leftEndPos.orientation === "vertical"
                        ? boardLayout.tileShort
                        : boardLayout.tileLong
                    }px`,
                    height: `${
                      boardLayout.leftEndPos.orientation === "vertical"
                        ? boardLayout.tileLong
                        : boardLayout.tileShort
                    }px`,
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = canDropLeft ? "move" : "none";
                  }}
                  onDrop={(e) => handleDrop(e, "left")}
                  onClick={(e) => {
                    if (clickedTile) {
                      handleDrop(e as React.DragEvent<HTMLDivElement>, "left");
                    }
                  }}
                  className={`${dropZoneClasses} ${
                    canDropLeft
                      ? "border-amber-400 bg-amber-400/20"
                      : "border-transparent"
                  }`}
                />
                <div
                  style={{
                    position: "absolute",
                    left: `${boardLayout.rightEndPos.x}px`,
                    top: `${boardLayout.rightEndPos.y}px`,
                    width: `${
                      boardLayout.rightEndPos.orientation === "vertical"
                        ? boardLayout.tileShort
                        : boardLayout.tileLong
                    }px`,
                    height: `${
                      boardLayout.rightEndPos.orientation === "vertical"
                        ? boardLayout.tileLong
                        : boardLayout.tileShort
                    }px`,
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = canDropRight ? "move" : "none";
                  }}
                  onDrop={(e) => handleDrop(e, "right")}
                  onClick={(e) => {
                    if (clickedTile) {
                      handleDrop(e as React.DragEvent<HTMLDivElement>, "right");
                    }
                  }}
                  className={`${dropZoneClasses} ${
                    canDropRight
                      ? "border-amber-400 bg-amber-400/20"
                      : "border-transparent"
                  }`}
                />
              </>
            )}
        </div>
      </div>

      {/* Player Hand & Info Area */}
      <div
        className={`w-full ${isMobile ? "h-20 " : "h-28"} 
        ${isMyTurn ? "border-4 border-amber-500/80" : "border border-white/20"}
        bg-black/50 pt-0 pb-2 px-1 sm:px-4 rounded-t-lg flex flex-col items-bottom z-20 shrink-0 overflow-visible no-scrollbar`}
      >
        {/* Tiles container */}

        <div
          className={`flex justify-center items-end space-x-1 ${
            isMobile ? "h-24" : "h-32"
          } w-full overflow-x-auto overflow-visible p-2 -mt-6 relative z-30 no-scrollbar`}
        >
          <div className="flex-shrink-0 text-center pr-2 sm:pr-4 mr-1 sm:mr-2">
            <p>Points:</p>
            <p>{myScore}</p>
          </div>

          <div className="flex-1 overflow-x-auto px-1 no-scrollbar">
            <div className="inline-flex justify-center space-x-1 w-full no-scrollbar z-40">
              {playerHand.map((domino, index) => (
                <div
                  key={index}
                  className="transition-all duration-700 ease-out flex-shrink-0"
                  style={{
                    transform: isDealing
                      ? "translateY(40vh) scale(0.5)"
                      : "translateY(0) scale(1)",
                    opacity: isDealing ? 0 : 1,
                    transitionDelay: isDealing ? `${index * 75}ms` : "0ms",
                  }}
                  onDragStart={(e) => handleDragStart(e, domino, index)}
                  onDragEnd={() => {
                    if (draggedDomino) {
                      setDraggedDomino(null);
                      setClickedTile(null);
                    }
                  }}
                  onClick={(e) => handleTileClick(e, domino, index)}
                >
                  <DominoTile
                    values={domino}
                    scale={boardLayout.tileScale}
                    isClickable={
                      isMyTurn &&
                      gameState.phase === "playing" &&
                      playableMoves.has(JSON.stringify(domino))
                    }
                    isPlayable={
                      isMyTurn &&
                      playableMoves.has(JSON.stringify(domino)) &&
                      gameState.phase === "playing"
                    }
                    draggable={
                      isMyTurn && !isDealing && gameState.phase === "playing"
                    }
                    isDragging={
                      draggedDomino?.index === index ||
                      clickedTile?.index === index
                    }
                    isClicked={clickedTile?.index === index}
                    isInTable={false}
                    clickedTile={clickedTile}
                  />
                </div>
              ))}
            </div>
          </div>

          {isMyTurn && gameState.phase === "playing" && (
            <div className="flex-shrink-0 text-center pl-2 sm:pl-4 ml-1 sm:ml-2">
              <p className="text-xl sm:text-2xl font-mono text-amber-300 animate-pulse">
                {turnTimer}s
              </p>
            </div>
          )}
        </div>
      </div>
      {isMyTurn &&
        gameState.phase === "playing" &&
        playableMoves.size === 0 && (
          <>
            {boneyard && boneyard.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="bg-black/80 backdrop-blur-sm text-white px-6 py-4 rounded-xl shadow-lg text-center">
                  <p className="text-xl font-semibold">Pasa Turno</p>
                </div>
              </div>
            ) : (
              <>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 pointer-events-auto" />

                <div className="absolute bottom-28 left-0 right-0 flex justify-center z-40">
                  <div className="flex overflow-x-auto space-x-2 px-4 no-scrollbar">
                    {boneyard &&
                      boneyard.map((tile, index) => (
                        <div key={index} className="flex-shrink-0">
                          <DominoTile
                            values={tile}
                            scale={boardLayout.tileScale}
                            faceDown={true}
                            onClick={() => handleClicTilePool(tile)}
                            clickedTile={clickedTile}
                            isClickable={
                              isMyTurn && gameState.phase === "playing"
                            }
                          />
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
    </div>
  );
};

export default DominoBoard;
