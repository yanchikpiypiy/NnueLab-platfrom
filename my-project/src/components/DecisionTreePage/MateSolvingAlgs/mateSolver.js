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
        if (!isMaximizing) {
          return (b.captured ? 1 : 0) - (a.captured ? 1 : 0);
        }
        return 0;
      })
      .map(move => move.san);
  };

  const minimax = (chess, depth, isRoot = true, lastMoveWasWhite = false) => {
    const node = {
      move: null,
      fen: chess.fen(),
      visible: false,
      score: null,
      children: [],
      isWhiteTurn: isRoot ? null : !lastMoveWasWhite, // ✅ White moves first
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

    const isMaximizing = (chess.turn() === startingPlayer);
    let bestScore = isMaximizing ? -Infinity : Infinity;
    let bestBranch = null;

    for (const moveSAN of getSortedMoves(chess, isMaximizing)) {
      const clone = new Chess(chess.fen());

      if (!clone.move(moveSAN)) continue;

      if (clone.isCheckmate()) {
        const pliesUsed = maxDepth - depth;
        const checkmateScore = (clone.turn() === startingPlayer) ? -(1000 - pliesUsed) : (1000 - pliesUsed);
        
        const checkmateNode = {
          move: moveSAN,
          fen: clone.fen(),
          visible: false,
          children: [],
          isWhiteTurn: lastMoveWasWhite, // ✅ White moves first, then Black
          score: checkmateScore
        };

        node.children.push(checkmateNode);
        return { score: checkmateScore, branch: [moveSAN], tree: node };
      }

      const childNode = {
        move: moveSAN,
        fen: clone.fen(),
        visible: false,
        children: [],
        isWhiteTurn: lastMoveWasWhite, // ✅ Alternate correctly
      };
      node.children.push(childNode);

      const result = minimax(clone, depth - 1, false, !lastMoveWasWhite);
      childNode.score = result.score;
      childNode.children = result.tree.children;

      if (isMaximizing) {
        if (result.score > bestScore) {
          bestScore = result.score;
          bestBranch = result.branch !== null ? [moveSAN, ...result.branch] : null;
        }
      } else {
        if (result.score < bestScore) {
          bestScore = result.score;
          bestBranch = result.branch !== null ? [moveSAN, ...result.branch] : null;
        }
      }
    }

    node.score = bestScore;
    return { score: bestScore, branch: bestBranch, tree: node };
  };

  const result = minimax(chessInstance, maxDepth);
  return { candidate: result.branch ? { branch: result.branch } : null, tree: result.tree };
};
export const transformTreeForD3 = (node, isRoot = true) => {
  if (!node.visible) return null;

  // Compute fill color based on the node's role:
  const fill = isRoot ? "gray" : (node.isWhiteTurn ? "white" : "black");

  return {
    // Add the node's ID so you can reference it later
    id: node.id,               // <-- IMPORTANT
    name: node.move || "Start",
    attributes: {
      score: node.score !== undefined ? node.score : "N/A",
      nextMove:
        node.children.length > 0
          ? node.children.reduce((best, child) => {
              if (isRoot || node.isWhiteTurn) {
                // If it's the start node or White's turn → Pick best move (maximize)
                return best.score > child.score ? best : child;
              } else {
                // Black's turn → Pick worst for White (minimize), prioritizing captures
                const bestIsCapture = best.move.includes("x");
                const childIsCapture = child.move.includes("x");

                if (childIsCapture && !bestIsCapture) return child; // Prefer captures
                if (!childIsCapture && bestIsCapture) return best;

                return best.score < child.score ? best : child; // Otherwise, minimize
              }
            }).move
          : "None",
    },
    // New property for color instead of nodeSvgShape
    fill,
    children: node.children
      .map((child) => transformTreeForD3(child, false))
      .filter((child) => child !== null),
  };
};
