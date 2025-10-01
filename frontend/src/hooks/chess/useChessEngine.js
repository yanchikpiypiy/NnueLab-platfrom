import { useCallback, useEffect } from 'react';
import { chessAPI } from '../../services/chess/chessAPI';

export const useChessEngine = (
    gameRef,
    engineChoice,
    board,
    handleEngineMove
) => {
    const requestStockfishMove = useCallback(() => {
        const stockfishWorker = new Worker('/stockfish.js');

        stockfishWorker.onmessage = (event) => {
            const line = event.data;
            if (line.startsWith('bestmove')) {
                const bestMove = line.split(' ')[1];
                handleEngineMove(bestMove);
                stockfishWorker.terminate();
            }
        };

        stockfishWorker.postMessage(`position fen ${gameRef.current.fen()}`);
        stockfishWorker.postMessage('go depth 15');
    }, [gameRef, handleEngineMove]);

    const requestSunfishMove = useCallback(async () => {
        const movesVerbose = gameRef.current.history({ verbose: true });
        if (movesVerbose.length === 0) return;

        const lastMoveObj = movesVerbose[movesVerbose.length - 1];
        const userMove =
            lastMoveObj.from +
            lastMoveObj.to +
            (lastMoveObj.promotion || '');

        try {
            const data = await chessAPI.makeMove(userMove);
            if (data.status === 'ok') {
                handleEngineMove(data.engine_move);
            }
        } catch (err) {
            console.error('Error requesting engine move:', err);
        }
    }, [gameRef, handleEngineMove]);

    useEffect(() => {
        if (gameRef.current.isGameOver()) return;
        if (engineChoice !== 'none' && gameRef.current.turn() === 'b') {
            if (engineChoice === 'stockfish') {
                requestStockfishMove();
            } else if (engineChoice === 'yunfish') {
                requestSunfishMove();
            }
        }
    }, [board, engineChoice, gameRef, requestStockfishMove, requestSunfishMove]);

    return {
        requestStockfishMove,
        requestSunfishMove,
    };
};
