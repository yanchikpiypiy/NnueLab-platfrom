import { useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import { assignHierarchicalIds, bfsCollectNodes } from '../../utils/chessTree/treeUtils';

export const useChessSolver = (problemFEN, solverFunction) => {
    const [allowedSteps, setAllowedSteps] = useState(2);
    const [bestCandidate, setBestCandidate] = useState(null);
    const [candidateTree, setCandidateTree] = useState(null);
    const [bfsQueue, setBfsQueue] = useState([]);
    const [solveError, setSolveError] = useState(null);

    const solveProblem = useCallback(() => {
        setSolveError(null);

        try {
            const chessInstance = new Chess(problemFEN);
            const { candidate, tree } = solverFunction(chessInstance, allowedSteps);

            if (!candidate) {
                const errorMsg = `No mate‑in‑${allowedSteps} candidate found.`;
                setSolveError(errorMsg);
                setBestCandidate(null);
                setCandidateTree(null);
                setBfsQueue([]);
                return { success: false, error: errorMsg };
            }

            tree.visible = true;
            if (tree.children) {
                tree.children.forEach(child => (child.visible = false));
            }

            assignHierarchicalIds(tree);
            setCandidateTree(tree);

            const nodesInBFS = bfsCollectNodes(tree);
            nodesInBFS.shift(); // remove root
            setBfsQueue(nodesInBFS);
            setBestCandidate(candidate);

            return { success: true, candidate, tree };
        } catch (err) {
            const errorMsg = 'Invalid problem FEN. Please fix your board setup.';
            setSolveError(errorMsg);
            return { success: false, error: errorMsg };
        }
    }, [problemFEN, allowedSteps, solverFunction]);

    const resetSolver = useCallback(() => {
        setBestCandidate(null);
        setCandidateTree(null);
        setBfsQueue([]);
        setSolveError(null);
    }, []);

    return {
        allowedSteps,
        setAllowedSteps,
        bestCandidate,
        candidateTree,
        bfsQueue,
        solveError,
        solveProblem,
        resetSolver,
        setCandidateTree,
        setBfsQueue,
    };
};
