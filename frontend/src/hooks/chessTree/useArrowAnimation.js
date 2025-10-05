import { useState, useCallback, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { extractArrowsFromTreeDFS, convertSANtoTargetSquares } from '../../utils/chessTree/arrowUtils';

export const useArrowAnimation = (problemFEN, candidateTree, bestCandidate) => {
    const [arrowTraversalQueue, setArrowTraversalQueue] = useState([]);
    const [currentArrowStep, setCurrentArrowStep] = useState(0);
    const [arrows, setArrows] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const playIntervalRef = useRef(null);

    const updateArrowsFromTree = useCallback(() => {
        if (!candidateTree || !bestCandidate) return;

        const maxDepth = bestCandidate.branch.length;
        const newArrowSequences = extractArrowsFromTreeDFS(
            candidateTree,
            maxDepth,
            problemFEN
        ) || [];

        setArrowTraversalQueue(newArrowSequences);
        setCurrentArrowStep(0);
    }, [candidateTree, bestCandidate, problemFEN]);

    useEffect(() => {
        updateArrowsFromTree();
    }, [updateArrowsFromTree]);

    const nextArrowStep = useCallback((gameSetterCallback) => {
        setCurrentArrowStep(prev => {
            const nextStep = prev + 1;
            if (nextStep < arrowTraversalQueue.length) {
                const next = arrowTraversalQueue[nextStep];
                setArrows(next.arrows || []);

                // ✅ update board if possible
                if (next.fen && gameSetterCallback) {
                    gameSetterCallback(new Chess(next.fen));
                }

                return nextStep;
            }
            return prev;
        });
    }, [arrowTraversalQueue]);

    const prevArrowStep = useCallback((gameSetterCallback) => {
        setCurrentArrowStep(prev => {
            const prevStep = prev - 1;
            if (prevStep >= 0) {
                const prevData = arrowTraversalQueue[prevStep];
                setArrows(prevData.arrows || []);

                // ✅ update board if possible
                if (prevData.fen && gameSetterCallback) {
                    gameSetterCallback(new Chess(prevData.fen));
                }

                return prevStep;
            }
            return prev;
        });
    }, [arrowTraversalQueue]);


    const playArrows = useCallback((gameSetterCallback) => {
        if (isPlaying) {
            clearInterval(playIntervalRef.current);
            setIsPlaying(false);
            return;
        }

        if (!arrowTraversalQueue.length || !bestCandidate) return;

        // Resume from current step
        setIsPlaying(true);

        playIntervalRef.current = setInterval(() => {
            setCurrentArrowStep(prevStep => {
                const nextStep = prevStep + 1;

                if (nextStep >= arrowTraversalQueue.length) {
                    clearInterval(playIntervalRef.current);
                    setIsPlaying(false);
                    return prevStep;
                }

                const next = arrowTraversalQueue[nextStep];
                if (next) {
                    setArrows(next.arrows || []);
                    if (next.fen && gameSetterCallback) {
                        gameSetterCallback(new Chess(next.fen));
                    }
                    return nextStep;
                }

                return prevStep;
            });
        }, 10); // ⚡ speed tweak (200ms)
    }, [isPlaying, arrowTraversalQueue, bestCandidate]);
    const clearArrows = useCallback(() => {
        if (playIntervalRef.current) {
            clearInterval(playIntervalRef.current);
        }
        setArrows([]);
        setIsPlaying(false);
        setCurrentArrowStep(0);
    }, []);

    return {
        arrows,
        arrowTraversalQueue,
        currentArrowStep,
        isPlaying,
        setArrows,
        nextArrowStep,
        prevArrowStep,
        playArrows,
        clearArrows,
    };
};
