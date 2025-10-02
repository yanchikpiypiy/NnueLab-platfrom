// helpers.js
import { Chess } from 'chess.js';

// Helper: Convert board object to FEN
export function objectToFEN(boardObj) {
  const files = ['a','b','c','d','e','f','g','h'];
  let fenRows = [];
  for (let rank = 8; rank >= 1; rank--) {
    let row = "";
    let emptyCount = 0;
    for (let file of files) {
      const square = file + rank;
      const piece = boardObj[square] || "";
      if (piece === "") {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          row += emptyCount;
          emptyCount = 0;
        }
        let symbol = piece[1];
        symbol = piece[0] === 'w' ? symbol.toUpperCase() : symbol.toLowerCase();
        row += symbol;
      }
    }
    if (emptyCount > 0) row += emptyCount;
    fenRows.push(row);
  }
  return fenRows.join("/") + " w - - 0 1";
}

// Helper: BFS to Collect All Nodes
export function bfsCollectNodes(root) {
  const queue = [];
  const result = [];
  if (!root) return result;
  queue.push(root);
  while (queue.length > 0) {
    const current = queue.shift();
    result.push(current);
    if (current.children && Array.isArray(current.children)) {
      queue.push(...current.children);
    }
  }
  return result;
}

// Helper: Get Arrow Tuple
export const getArrowTuple = (moveSan, fen, color = "rgba(0,255,0,0.6)", verify = false) => {
  if (!moveSan) return null;
  const chessInstance = new Chess(fen);
  try {
    let moveObj;
    if (verify) {
      const legalMoves = chessInstance.moves({ verbose: true });
      moveObj = legalMoves.find(m => m.san === moveSan);
      if (!moveObj) {
        console.warn(`Invalid move: ${moveSan} on FEN: ${fen}`);
        return null;
      }
      chessInstance.move(moveSan);
    } else {
      moveObj = chessInstance.move(moveSan);
      if (!moveObj) return null;
    }
    return [moveObj.from, moveObj.to, color];
  } catch (error) {
    console.error("getArrowTuple error for move", moveSan, "on FEN:", fen, error);
    return null;
  }
};
