import { useCallback, useEffect, useRef } from 'react';
import { chessAPI } from '../../services/chess/chessAPI';

export const useChessEngine = (
    gameRef,
    engineChoice,
    board,
    handleEngineMove
) => {
    const previousEngineRef = useRef(engineChoice);

    // Initialize/cleanup backend when engine changes
    useEffect(() => {
        const initializeEngine = async () => {
            const previousEngine = previousEngineRef.current;

            // If switching TO yunfish, initialize backend
            if (engineChoice === 'yunfish' && previousEngine !== 'yunfish') {
                try {
                    await chessAPI.resetGame();
                    console.log(' Yunfish engine initialized');
                } catch (err) {
                    console.error(' Error initializing Yunfish:', err);
                }
            }

            // If switching FROM yunfish to another engine, cleanup (optional)
            if (previousEngine === 'yunfish' && engineChoice !== 'yunfish') {
                try {
                    await chessAPI.resetGame();
                    console.log(' Yunfish engine cleaned up');
                } catch (err) {
                    console.error(' Error cleaning up Yunfish:', err);
                }
            }

            previousEngineRef.current = engineChoice;
        };

        initializeEngine();
    }, [engineChoice]);

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
        if (movesVerbose.length === 0) {
            console.warn(' No moves yet, cannot request Yunfish move');
            return;
        }

        const lastMoveObj = movesVerbose[movesVerbose.length - 1];
        const userMove =
            lastMoveObj.from +
            lastMoveObj.to +
            (lastMoveObj.promotion || '');

        try {
            console.log(' Requesting Yunfish move for:', userMove);
            const data = await chessAPI.makeMove(userMove);

            if (data.status === 'ok') {
                console.log(' Yunfish responded with:', data.engine_move);
                handleEngineMove(data.engine_move);
            } else {
                console.error(' Backend returned error:', data);
            }
        } catch (err) {
            console.error(' Error requesting engine move:', err);
        }
    }, [gameRef, handleEngineMove]);

    // Trigger engine move when it's black's turn
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
