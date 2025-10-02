import { useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import { fenToPosition, objectToFEN } from '../../utils/chessTree/fenUtils';

export const useChessPosition = (initialFen) => {
    const [game, setGame] = useState(new Chess(initialFen));
    const [positionObj, setPositionObj] = useState(fenToPosition(initialFen));
    const [problemFEN, setProblemFEN] = useState(initialFen);

    const updatePosition = useCallback((newFen) => {
        const newGame = new Chess(newFen);
        setGame(newGame);
        setPositionObj(fenToPosition(newFen));
        setProblemFEN(newFen);
    }, []);

    const updatePositionObject = useCallback((newPos) => {
        setPositionObj(newPos);
    }, []);

    const setCurrentBoardAsProblem = useCallback(() => {
        const fen = objectToFEN(positionObj);
        try {
            const newGame = new Chess(fen);
            setGame(newGame);
            setProblemFEN(fen);
            return { success: true, fen };
        } catch (err) {
            return { success: false, error: 'Invalid board setup' };
        }
    }, [positionObj]);

    const makeMove = useCallback((from, to, promotion) => {
        const newGame = new Chess(game.fen());
        let move = newGame.move({ from, to, promotion });

        if (move) {
            setGame(newGame);
            setPositionObj(fenToPosition(newGame.fen()));
            return move;
        }

        return null;
    }, [game]);

    return {
        game,
        positionObj,
        problemFEN,
        setGame,
        updatePosition,
        updatePositionObject,
        setCurrentBoardAsProblem,
        makeMove,
    };
};
