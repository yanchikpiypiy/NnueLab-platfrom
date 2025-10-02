import { Chess } from 'chess.js';

export const getArrowTuple = (move, fen, color, includePromotion = false) => {
    // Import from your helpers file or reimplement
    try {
        const chess = new Chess(fen);
        const moveObj = chess.move(move);
        if (moveObj) {
            return [moveObj.from, moveObj.to, color];
        }
    } catch (error) {
        console.error('Error creating arrow:', error);
    }
    return null;
};

export const extractArrowsFromTreeDFS = (
    node,
    maxDepth,
    problemFEN,
    path = [],
    arrowsQueue = [],
    currentFEN = problemFEN,
    depth = 0
) => {
    if (!node) return arrowsQueue;

    let newFEN = currentFEN;

    try {
        if (node.move) {
            const color = depth % 2 === 0
                ? "rgba(255,0,0,0.9)"
                : "rgba(0,255,0,0.9)";
            const arrow = getArrowTuple(node.move, currentFEN, color, true);

            if (arrow) path.push(arrow);

            const clone = new Chess(currentFEN);
            const moveObj = clone.move(node.move);

            if (moveObj) {
                newFEN = clone.fen();
            } else {
                path.pop();
                return arrowsQueue;
            }
        }
    } catch (error) {
        if (path.length) path.pop();
        return arrowsQueue;
    }

    if (path.length === maxDepth) {
        arrowsQueue.push({ arrows: [...path], fen: newFEN });
        if (node.move) path.pop();
        return arrowsQueue;
    }

    if (node.children && node.children.length > 0) {
        for (const child of node.children) {
            extractArrowsFromTreeDFS(
                child,
                maxDepth,
                problemFEN,
                path,
                arrowsQueue,
                newFEN,
                depth + 1
            );
        }
    }

    if (node.move) path.pop();
    return arrowsQueue;
};

export const convertSANtoTargetSquares = (sanMoves, problemFEN) => {
    const chessInstance = new Chess(problemFEN);
    return sanMoves.map(sanMove => {
        const moveObj = chessInstance.move(sanMove);
        return moveObj ? moveObj.to : null;
    });
};
