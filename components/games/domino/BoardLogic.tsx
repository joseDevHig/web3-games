type Position = [number, number];
export type Direction = 'right' | 'left' | 'up' | 'down';

export interface BoardLogicOptions {
  margin?: number;
}

export class BoardLogic {
  private grid: (DominoPiece | null)[][];
  public headPosition: Position;
  public tailPosition: Position;
  public headValue: number | null = null;
  public tailValue: number | null = null;
  public headDirection: Direction;
  public tailDirection: Direction;
  public placedPieces: {
    piece: DominoPiece;
    position: Position;
    orientation: 'horizontal' | 'vertical';
  }[] = [];

  private margin: number;

  constructor(
    public readonly width: number,
    public readonly height: number,
    options: BoardLogicOptions = {}
  ) {
    this.grid = Array(height)
      .fill(null)
      .map(() => Array(width).fill(null));
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    this.headPosition = [centerX, centerY];
    this.tailPosition = [centerX, centerY];
    this.margin = options.margin ?? 0;

    // Direcciones iniciales
    this.headDirection = 'right';
    this.tailDirection = 'left';
  }

  startGame(firstPiece: DominoPiece): void {
    const [x, y] = this.headPosition;
    this.grid[y][x] = firstPiece;
    this.headValue = firstPiece.right;
    this.tailValue = firstPiece.left;
    
    // If the board is taller than it is wide, start with a horizontal domino
    //const orientation = this.height > this.width ? 'horizontal' : 'vertical';

    this.placedPieces.push({
      piece: firstPiece,
      position: [x, y],
      //orientation: orientation,
      orientation: 'vertical',
    })
    
  }

  placePiece(piece: DominoPiece, isHead: boolean) {
    if (!this.isPlayable(piece, isHead)) {
      throw new Error(
        `La ficha [${piece.left}|${piece.right}] no coincide con el extremo activo (${isHead ? this.headValue : this.tailValue})`
      );
    }

    const valueToMatch = isHead ? this.headValue : this.tailValue;
    const isDouble = piece.isDouble();

    // Orientación de la ficha según extremo
    const orientedPiece = isDouble
      ? new DominoPiece(valueToMatch!, valueToMatch!)
      : isHead
      ? piece.left === valueToMatch
        ? piece
        : new DominoPiece(piece.right, piece.left)
      : piece.right === valueToMatch
      ? piece
      : new DominoPiece(piece.right, piece.left);

    const [position, newDirection, orientation] = this.findValidPosition(
      isHead,
      isDouble
    );
    const [x, y] = position;

    if (this.grid[y][x] !== null) {
      throw new Error(`Posición [${x},${y}] ya ocupada`);
    }

    this.grid[y][x] = orientedPiece;
    this.updateBoardState(
      orientedPiece,
      position,
      newDirection,
      isHead,
      isDouble
    );
    //console.log("orientedPiece", orientedPiece,"orientation",orientation,"isHead",);
    //this.placedPieces.push({ piece: orientedPiece, position, orientation });
    //En observacion por ahora
    this.placedPieces.push({ piece: orientedPiece, position,orientation: isDouble ? 'vertical' : 'horizontal' });
    return { position, orientation };
  }

  isPlayable(piece: DominoPiece, isHead: boolean) {
    const value = isHead ? this.headValue : this.tailValue;
    return value !== null && (piece.left === value || piece.right === value);
  }

 

  private findValidPosition(isHead: boolean, isDouble: boolean) {
    const basePos = isHead ? this.headPosition : this.tailPosition;
    const baseDir = isHead ? this.headDirection : this.tailDirection;

    let newPos = this.calculateNewPosition(basePos, baseDir);
    if (this.isValidPosition(newPos)) {
      return [newPos, baseDir, this.getOrientation(baseDir)] as const;
    }

    // Probar direcciones perpendiculares
    const perpendicular = this.getPerpendicularDirections(baseDir);
    for (const dir of perpendicular) {
      newPos = this.calculateNewPosition(basePos, dir);
      if (this.isValidPosition(newPos)) {
        return [newPos, dir, this.getOrientation(dir)] as const;
      }
    }

    // Como último recurso, probar dirección opuesta
    const oppDir = this.getOppositeDirection(baseDir);
    newPos = this.calculateNewPosition(basePos, oppDir);
    if (this.isValidPosition(newPos)) {
      return [newPos, oppDir, this.getOrientation(oppDir)] as const;
    }

    throw new Error("No hay espacio disponible para colocar la ficha");
  }

  private calculateNewPosition([x, y]: Position, dir: Direction): Position {
    switch (dir) {
      case 'right':
        return [x + 1, y];
      case 'left':
        return [x - 1, y];
      case 'up':
        return [x, y - 1];
      case 'down':
        return [x, y + 1];
    }
  }

  private isValidPosition([x, y]: Position) {
    return (
      x >= 0 &&
      x < this.width &&
      y >= 0 &&
      y < this.height &&
      this.grid[y][x] === null
    );
  }

  private getOrientation(dir: Direction): 'horizontal' | 'vertical' {
    return dir === 'right' || dir === 'left' ? 'horizontal' : 'vertical';
  }

  private getPerpendicularDirections(dir: Direction): Direction[] {
    return dir === 'right' || dir === 'left' ? ['up', 'down'] : ['right', 'left'];
  }

  public getOppositeDirection(dir: Direction): Direction {
    switch (dir) {
      case 'right':
        return 'left';
      case 'left':
        return 'right';
      case 'up':
        return 'down';
      case 'down':
        return 'up';
    }
  }

  private updateBoardState(
    piece: DominoPiece,
    [x, y]: Position,
    dir: Direction,
    isHead: boolean,
    isDouble: boolean
  ) {
    if (isHead) {
      this.headPosition = [x, y];
      this.headValue = isDouble ? piece.left : piece.right;
      this.headDirection = dir;
    } else {
      this.tailPosition = [x, y];
      this.tailValue = piece.left;
      this.tailDirection = dir;
    }
  }

  getBoardState() {
    return {
      headPosition: this.headPosition,
      tailPosition: this.tailPosition,
      headValue: this.headValue,
      tailValue: this.tailValue,
      headDirection: this.headDirection,
      tailDirection: this.tailDirection,
      placedPieces: [...this.placedPieces],
    };
  }
}

export class DominoPiece {
  constructor(public readonly left: number, public readonly right: number) {}

  matches(value: number) {
    return this.left === value || this.right === value;
  }

  isDouble() {
    return this.left === this.right;
  }
   inverted(): DominoPiece {
    return new DominoPiece(this.right, this.left);
  }
}
