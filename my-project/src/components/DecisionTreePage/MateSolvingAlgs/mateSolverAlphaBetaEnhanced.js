import { Chess } from "chess.js";

const transpositionTable = new Map(); // Cache for storing board evaluations
let nodesEvaluated = 0; // Count total nodes evaluated
let cacheHits = 0; // Count transposition table hits

export const findMateInNCandidateTreeAlphaBetaEnhanced = (chessInstance, n) => {
  nodesEvaluated = 0;
  cacheHits = 0;
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
        if (a.checkmate) return -1;
        if (b.checkmate) return 1;
        const aCaptureValue = pieceValues[a.captured] || 0;
        const bCaptureValue = pieceValues[b.captured] || 0;
        if (aCaptureValue !== bCaptureValue) return bCaptureValue - aCaptureValue;
        if (a.promotion && !b.promotion) return -1;
        if (b.promotion && !a.promotion) return 1;
        return 0;
      })
      .map(move => move.san);
  };

  const minimax = (chess, depth, alpha, beta, isMaximizing, isRoot = true, lastMoveWasWhite = false) => {
    nodesEvaluated++;
    const fen = chess.fen();
    if (transpositionTable.has(fen)) {
      cacheHits++;
      return transpositionTable.get(fen);
    }

    const node = {
      move: null,
      fen,
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
      transpositionTable.set(fen, { score: node.score, branch: null, tree: node });
      return { score: node.score, branch: null, tree: node };
    }

    let bestScore = isMaximizing ? -Infinity : Infinity;
    let bestBranch = null;

    for (const moveSAN of getSortedMoves(chess, isMaximizing)) {
      const clone = new Chess(fen);
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

      if (beta <= alpha) break;
    }

    node.score = bestScore;
    transpositionTable.set(fen, { score: bestScore, branch: bestBranch, tree: node });
    return { score: bestScore, branch: bestBranch, tree: node };
  };

  console.time("AlphaBetaExecution");
  const result = minimax(chessInstance, maxDepth, -Infinity, Infinity, chessInstance.turn() === startingPlayer);
  console.timeEnd("AlphaBetaExecution");

  console.log(`Nodes Evaluated: ${nodesEvaluated}`);
  console.log(`Cache Hits: ${cacheHits}`);

  return { candidate: result.branch ? { branch: result.branch } : null, tree: result.tree };
};