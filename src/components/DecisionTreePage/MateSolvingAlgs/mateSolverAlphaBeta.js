import { Chess } from "chess.js";

export const findMateInNCandidateTreeAlphaBeta = (chessInstance, n) => {
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
      .sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0))
      .map(move => move.san);
  };

  const minimax = (chess, depth, alpha, beta, isMaximizing, isRoot = true, lastMoveWasWhite = false) => {
    const node = {
      move: null,
      fen: chess.fen(),
      visible: false,
      score: null,
      children: [],
      isWhiteTurn: isRoot ? null : !lastMoveWasWhite,
    };

    if (chess.isCheckmate()) {
      const pliesUsed = maxDepth - depth + 1;
      node.score = (chess.turn() === startingPlayer) ? -(1000 - pliesUsed) : (1000 - pliesUsed);
      return { score: node.score, branch: [], tree: node };
    }

    if (depth === 0 || chess.isGameOver()) {
      node.score = evaluate(chess);
      return { score: node.score, branch: null, tree: node };
    }

    let bestScore = isMaximizing ? -Infinity : Infinity;
    let bestBranch = null;

    for (const moveSAN of getSortedMoves(chess, isMaximizing)) {
      const clone = new Chess(chess.fen());
      if (!clone.move(moveSAN)) continue;

      const result = minimax(clone, depth - 1, alpha, beta, !isMaximizing, false, !lastMoveWasWhite);
      const childNode = {
        move: moveSAN,
        fen: clone.fen(),
        visible: false,
        children: result.tree.children,
        isWhiteTurn: lastMoveWasWhite,
        score: result.score,
      };
      node.children.push(childNode);

      if (isMaximizing) {
        if (result.score > bestScore) {
          bestScore = result.score;
          bestBranch = result.branch !== null ? [moveSAN, ...result.branch] : null;
        }
        alpha = Math.max(alpha, bestScore);
      } else {
        if (result.score < bestScore) {
          bestScore = result.score;
          bestBranch = result.branch !== null ? [moveSAN, ...result.branch] : null;
        }
        beta = Math.min(beta, bestScore);
      }

      if (beta <= alpha) break; // Alpha-beta pruning
    }

    node.score = bestScore;
    return { score: bestScore, branch: bestBranch, tree: node };
  };

  const result = minimax(chessInstance, maxDepth, -Infinity, Infinity, chessInstance.turn() === startingPlayer);
  return { candidate: result.branch ? { branch: result.branch } : null, tree: result.tree };
};
