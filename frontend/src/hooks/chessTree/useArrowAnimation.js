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

    const nextArrowStep = useCallback(() => {
        setCurrentArrowStep(prev => {
            const nextStep = prev + 1;
            if (nextStep < arrowTraversalQueue.length) {
                setArrows(arrowTraversalQueue[nextStep].arrows || []);
                return nextStep;
            }
            return prev;
        });
    }, [arrowTraversalQueue]);

    const prevArrowStep = useCallback(() => {
        setCurrentArrowStep(prev => {
            const prevStep = prev - 1;
            if (prevStep >= 0) {
                setArrows(arrowTraversalQueue[prevStep].arrows || []);
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

        if (!arrowTraversalQueue.length || !bestCandidate) {
            return;
        }

        const startingStep = currentArrowStep < arrowTraversalQueue.length
            ? currentArrowStep
            : 0;
        setArrows(arrowTraversalQueue[startingStep].arrows || []);
        setIsPlaying(true);

        const bestCandidateTargetSquares = convertSANtoTargetSquares(
            bestCandidate.branch,
            problemFEN
        );

        playIntervalRef.current = setInterval(() => {
            setCurrentArrowStep(prevStep => {
                if (!arrowTraversalQueue[prevStep]) {
                    clearInterval(playIntervalRef.current);
                    setIsPlaying(false);
                    return prevStep;
                }

                const currentArrowSequence = arrowTraversalQueue[prevStep].arrows;
                const targetSquares = currentArrowSequence.map(arrow => arrow[1]);
                const match = bestCandidateTargetSquares.every(
                    (sq, i) => targetSquares[i] === sq
                );

                if (match) {
                    clearInterval(playIntervalRef.current);
                    setIsPlaying(false);
                    return prevStep;
                }

                const nextStep = prevStep + 1;
                if (arrowTraversalQueue[nextStep]) {
                    setArrows(arrowTraversalQueue[nextStep].arrows || []);
                    if (arrowTraversalQueue[nextStep].fen && gameSetterCallback) {
                        gameSetterCallback(new Chess(arrowTraversalQueue[nextStep].fen));
                    }
                    return nextStep;
                } else {
                    clearInterval(playIntervalRef.current);
                    setIsPlaying(false);
                    return prevStep;
                }
            });
        }, 10);
    }, [
        isPlaying,
        arrowTraversalQueue,
        currentArrowStep,
        bestCandidate,
        problemFEN
    ]);

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
