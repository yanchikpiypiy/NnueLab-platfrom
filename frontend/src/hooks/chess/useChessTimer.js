import { useState, useEffect } from 'react';
import { INITIAL_TIME } from '../../constants/chess/pieceImages';

export const useChessTimer = (gameRef, gameStarted) => {
    const [whiteTime, setWhiteTime] = useState(INITIAL_TIME);
    const [blackTime, setBlackTime] = useState(INITIAL_TIME);

    useEffect(() => {
        if (!gameStarted) return;

        const timer = setInterval(() => {
            if (gameRef.current.isGameOver()) {
                clearInterval(timer);
                return;
            }

            if (gameRef.current.turn() === 'w') {
                setWhiteTime((prev) => (prev > 0 ? prev - 1 : 0));
            } else {
                setBlackTime((prev) => (prev > 0 ? prev - 1 : 0));
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [gameStarted, gameRef]);

    const resetTimers = () => {
        setWhiteTime(INITIAL_TIME);
        setBlackTime(INITIAL_TIME);
    };

    return {
        whiteTime,
        blackTime,
        setWhiteTime,
        setBlackTime,
        resetTimers,
    };
};
