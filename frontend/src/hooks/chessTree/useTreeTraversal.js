import { useState, useCallback } from 'react';
import { Chess } from 'chess.js';

export const useTreeTraversal = (problemFEN) => {
    const [solutionBranch, setSolutionBranch] = useState(null);
    const [traversalFens, setTraversalFens] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);

    const computeTraversal = useCallback((branch) => {
        const clone = new Chess(problemFEN);
        const fens = [clone.fen()];

        branch.forEach(move => {
            clone.move(move);
            fens.push(clone.fen());
        });

        return fens;
    }, [problemFEN]);

    const showFullTraversal = useCallback((bestCandidate) => {
        if (traversalFens && traversalFens.length > 0) {
            setTraversalFens([]);
            return false;
        }

        if (!bestCandidate) return false;

        setSolutionBranch({ branch: bestCandidate.branch });
        const fens = computeTraversal(bestCandidate.branch);
        setTraversalFens(fens);
        setCurrentStep(0);

        return true;
    }, [traversalFens, computeTraversal]);

    const nextStep = useCallback(() => {
        setCurrentStep(prev => Math.min(prev + 1, traversalFens.length - 1));
    }, [traversalFens]);

    const prevStep = useCallback(() => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    }, []);

    const resetTraversal = useCallback(() => {
        setSolutionBranch(null);
        setTraversalFens([]);
        setCurrentStep(0);
    }, []);

    return {
        solutionBranch,
        traversalFens,
        currentStep,
        showFullTraversal,
        nextStep,
        prevStep,
        resetTraversal,
    };
};
