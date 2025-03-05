import { Chess } from "chess.js";

export const findMateInNCandidateTree = (chessInstance, n) => {
  const maxDepth = 2 * n - 1;
  const startingPlayer = chessInstance.turn();

  const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

  const evaluate = (chess) => {
    let score = 0;
    const board = chess.board();
    board.forEach(row => {
      row.forEach(piece => {
        if (piece) {
          const value = pieceValues[piece.type] || 0;
          score += (piece.color === startingPlayer) ? value : -value;
        }
      });
    });
    return score;
  };

  const getSortedMoves = (chess, isMaximizing) => {
    return chess.moves({ verbose: true })
      .sort((a, b) => {
        // Prioritize captures for Black
        if (!isMaximizing) {
          return (b.captured ? 1 : 0) - (a.captured ? 1 : 0);
        }
        return 0; // Keep default order for White
      })
      .map(move => move.san);
  };

  const minimax = (chess, depth) => {
    const node = {
      fen: chess.fen(),
      move: null,
      visible: true,
      children: []
    };

    if (chess.isGameOver() || depth === 0) {
      if (chess.isCheckmate()) {
        const pliesUsed = maxDepth - depth + 1;
        if (chess.turn() === startingPlayer) {
          return { score: -(1000 - pliesUsed), branch: [], tree: node };
        } else {
          return { score: 1000 - pliesUsed, branch: [], tree: node };
        }
      } else {
        return { score: evaluate(chess), branch: null, tree: node };
      }
    }

    const isMaximizing = (chess.turn() === startingPlayer);

    if (isMaximizing) {
      let bestScore = -Infinity;
      let bestBranch = null;
      for (const moveSAN of getSortedMoves(chess, isMaximizing)) {
        const clone = new Chess(chess.fen());
        if (!clone.move(moveSAN)) continue;

        const childNode = {
          fen: clone.fen(),
          move: moveSAN,
          visible: true,
          children: []
        };
        node.children.push(childNode);

        const result = minimax(clone, depth - 1);
        childNode.children = result.tree.children;

        if (result.score > bestScore) {
          bestScore = result.score;
          bestBranch = result.branch !== null ? [moveSAN, ...result.branch] : null;
        }
      }
      return { score: bestScore, branch: bestBranch, tree: node };
    } else {
      let bestScore = Infinity;
      let bestBranch = null;
      for (const moveSAN of getSortedMoves(chess, isMaximizing)) {
        const clone = new Chess(chess.fen());
        if (!clone.move(moveSAN)) continue;

        const childNode = {
          fen: clone.fen(),
          move: moveSAN,
          visible: true,
          children: []
        };
        node.children.push(childNode);

        const result = minimax(clone, depth - 1);
        childNode.children = result.tree.children;

        if (result.score < bestScore) {
          bestScore = result.score;
          bestBranch = result.branch !== null ? [moveSAN, ...result.branch] : null;
        }
      }
      return { score: bestScore, branch: bestBranch, tree: node };
    }
  };

  const result = minimax(chessInstance, maxDepth);
  return { candidate: result.branch ? { branch: result.branch } : null, tree: result.tree };
};

export const transformTreeForD3 = (node) => {
  if (!node.visible) return null;
  const transformedChildren = node.children
    .map(transformTreeForD3)
    .filter(child => child !== null);
  return {
    name: node.move || 'start',
    attributes: { fen: node.fen },
    children: transformedChildren
  };
};
