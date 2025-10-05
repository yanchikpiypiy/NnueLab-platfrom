import React, { useRef, useCallback, useMemo, useEffect } from 'react';
import { Chess } from 'chess.js';
import Header from '../../components/Header';
import BoardSection from '../../components/chessTree/BoardSection';
import ControlPanel from '../../components/chessTree/ControlPanel';
import TreeSection from '../../components/chessTree/TreeSection';
import SetupSidebar from '../../components/chessTree/SetupSidebar';
import { PIECE_IMAGES, PALETTE_PIECES, BOARD_WIDTH } from '../../constants/chessTree/pieceImages';
import { MATE_IN_TWO_PROBLEMS } from '../../constants/chessTree/mateProblems';
import { fenToPosition } from '../../utils/chessTree/fenUtils';
import { toggleNodeVisibility, revealAllNodes } from '../../utils/chessTree/treeUtils';
import { useChessPosition } from '../../hooks/chessTree/useChessPosition';
import { useChessSolver } from '../../hooks/chessTree/useChessSolver';
import { useTreeTraversal } from '../../hooks/chessTree/useTreeTraversal';
import { useArrowAnimation } from '../../hooks/chessTree/useArrowAnimation';
import { useSetupMode } from '../../hooks/chessTree/useSetupMode';
import { findMateInNCandidateTreeAlphaBetaEnhanced } from './MateSolvingAlgs/mateSolverAlphaBetaEnhanced';
import { transformTreeForD3 } from './MateSolvingAlgs/mateSolver';
import { getArrowTuple } from './helpers';
import './MateIn2Solver.css';
const DecisionTreePage = () => {
    const defaultFen = MATE_IN_TWO_PROBLEMS[0].fen;

    // Refs
    const boardContainerRef = useRef(null);
    const treeContainerRef = useRef(null);

    // Custom hooks
    const {
        setupMode,
        selectedProblemIndex,
        setSelectedProblemIndex,
        enterSetupMode,
        exitSetupMode,
    } = useSetupMode(true);

    const {
        game,
        positionObj,
        problemFEN,
        setGame,
        updatePosition,
        updatePositionObject,
        setCurrentBoardAsProblem,
        makeMove,
    } = useChessPosition(defaultFen);

    const {
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
    } = useChessSolver(problemFEN, findMateInNCandidateTreeAlphaBetaEnhanced);

    const {
        solutionBranch,
        traversalFens,
        currentStep,
        showFullTraversal,
        nextStep,
        prevStep,
        resetTraversal,
    } = useTreeTraversal(problemFEN);

    const {
        arrows,
        arrowTraversalQueue,
        currentArrowStep,
        isPlaying,
        setArrows,
        nextArrowStep,
        prevArrowStep,
        playArrows,
        clearArrows,
    } = useArrowAnimation(problemFEN, candidateTree, bestCandidate);

    const [showTree, setShowTree] = React.useState(false);
    useEffect(() => {
        // Whenever the base problem FEN changes, reset everything
        resetSolver();
        resetTraversal();
        clearArrows();
        setCandidateTree(null);
    }, [problemFEN]);
    // Transform tree for visualization
    const treeData = useMemo(
        () => candidateTree ? transformTreeForD3(candidateTree) : null,
        [candidateTree]
    );

    // Scroll to tree when shown
    useEffect(() => {
        if (showTree && treeContainerRef.current) {
            const offset = -75;
            const top = treeContainerRef.current.getBoundingClientRect().top +
                window.pageYOffset - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    }, [showTree]);

    // Problem selection handler
    const handleProblemChange = useCallback((index) => {
        setSelectedProblemIndex(index);
        const newFen = MATE_IN_TWO_PROBLEMS[index].fen;
        updatePosition(newFen);
    }, [setSelectedProblemIndex, updatePosition]);

    // Setup mode handlers
    const handleSetUp = useCallback(() => {
        if (setupMode) {
            const result = setCurrentBoardAsProblem();
            if (result.success) {
                exitSetupMode();
                resetSolver();
                resetTraversal();
                clearArrows();
                setShowTree(false);
                setCandidateTree(null);
            } else {
                alert(result.error);
            }
        } else {
            enterSetupMode();
            setShowTree(false);
        }
    }, [
        setupMode,
        setCurrentBoardAsProblem,
        exitSetupMode,
        enterSetupMode,
        resetSolver,
        resetTraversal,
        clearArrows
    ]);

    // Board interaction handlers
    const onDrop = useCallback((sourceSquare, targetSquare) => {
        if (!setupMode) {
            const move = makeMove(sourceSquare, targetSquare, 'q');
            return move;
        }

        // Setup mode: move pieces freely
        const newPos = { ...positionObj };
        if (newPos[sourceSquare]) {
            newPos[targetSquare] = newPos[sourceSquare];
            delete newPos[sourceSquare];
            updatePositionObject(newPos);
            return true;
        }

        return false;
    }, [setupMode, positionObj, makeMove, updatePositionObject]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
    }, []);

    const handleBoardDrop = useCallback((e) => {
        e.preventDefault();
        if (!setupMode) return;

        const rect = boardContainerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const fileIndex = Math.floor((x / BOARD_WIDTH) * 8);
        const rankIndex = Math.floor((y / BOARD_WIDTH) * 8);
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const square = files[fileIndex] + (8 - rankIndex);
        const piece = e.dataTransfer.getData("piece");

        if (piece) {
            const newPosition = { ...positionObj };
            newPosition[square] = piece;
            updatePositionObject(newPosition);
        }
    }, [setupMode, positionObj, updatePositionObject]);

    const handleSquareRightClick = useCallback((square) => {
        if (!setupMode) return;
        const newPosition = { ...positionObj };
        delete newPosition[square];
        updatePositionObject(newPosition);
    }, [setupMode, positionObj, updatePositionObject]);

    // Tree expansion handlers
    const expandNext = useCallback(() => {
        if (!candidateTree || bfsQueue.length === 0) {
            alert("No more nodes to expand.");
            return;
        }

        const nextNode = bfsQueue.shift();
        nextNode.visible = true;
        setBfsQueue([...bfsQueue]);
        setCandidateTree({ ...candidateTree });
    }, [candidateTree, bfsQueue, setBfsQueue, setCandidateTree]);

    const expandFullTree = useCallback(() => {
        if (!candidateTree) return;

        const expandedTree = JSON.parse(JSON.stringify(candidateTree));
        revealAllNodes(expandedTree);
        setCandidateTree(expandedTree);
    }, [candidateTree, setCandidateTree]);

    // Node interaction handler
    const handleNodeDoubleClick = useCallback((event, flowNode) => {
        if (!candidateTree) return;

        const newCandidateTree = JSON.parse(JSON.stringify(candidateTree));
        toggleNodeVisibility(newCandidateTree, flowNode.id);
        setCandidateTree(newCandidateTree);
    }, [candidateTree, setCandidateTree]);

    // Traversal handlers
    const handleShowFullTraversal = useCallback(() => {
        const isShowing = showFullTraversal(bestCandidate);
        if (!isShowing) {
            const dummy_holder = currentArrowStep === 0
                ? []
                : arrowTraversalQueue[currentArrowStep]?.arrows || [];
            setArrows(dummy_holder);
        } else {
            setArrows(null);
        }
    }, [showFullTraversal, bestCandidate, currentArrowStep, arrowTraversalQueue, setArrows]);


    // ✅ NEW
    const handlePlayArrows = useCallback(() => {
        // Only reset board if starting from scratch
        if (currentArrowStep === 0) {
            setGame(new Chess(problemFEN));
        }

        playArrows(setGame);
    }, [playArrows, setGame, problemFEN, currentArrowStep]);


    const handleClearArrows = useCallback(() => {
        clearArrows();
        setGame(new Chess(problemFEN));
    }, [clearArrows, problemFEN, setGame]);

    // Compute current arrows for visualization


    const computeCurrentArrows = useCallback(() => {
        if (!solutionBranch || !solutionBranch.branch) return [];

        const arrows = [];
        const chess = new Chess(problemFEN); // single instance to carry board state

        for (let i = 0; i < Math.min(currentStep, solutionBranch.branch.length); i++) {
            const move = solutionBranch.branch[i];
            if (!move) break;

            const color = i % 2 === 0 ? "rgba(0,255,0,0.6)" : "rgba(255,0,0,0.6)";

            // Get arrow from current chess instance
            const arrow = getArrowTuple(move, chess.fen(), color, true);
            if (arrow) arrows.push(arrow);

            // Advance the board for the next step
            try {
                chess.move(move);
            } catch (error) {
                // Move is invalid for this position - stop processing
                console.warn('Invalid move encountered in computeCurrentArrows:', move, error);
                break;
            }
        }

        return arrows;
    }, [solutionBranch, currentStep, problemFEN]);
    const memoizedCurrentArrows = useMemo(
        () => computeCurrentArrows(),
        [computeCurrentArrows]
    );

    return (
        <>
            <Header />

            {/* Informational Text */}
            <div
                className="visualization-info"
                style={{
                    maxWidth: '600px',
                    margin: '1rem auto',
                    textAlign: 'center'
                }}
            >
                <p className="text-gray-300 leading-relaxed">
                    This page visualizes the decision-making process of an algorithm
                    solving a mate‑in‑2 chess problem. In reality, similar algorithmic
                    decisions occur on every move during a game. Here, you can set up a
          problem, then click{' '}
                    <span className="text-green-500">solve</span> to generate and
          visualize the minimax search tree.
        </p>
            </div>

            <div className="main-container dark-theme">
                {setupMode ? (
                    <div
                        className="setup-container"
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'flex-start',
                            gap: '1rem'
                        }}
                    >
                        <BoardSection
                            setupMode={setupMode}
                            positionObj={positionObj}
                            boardContainerRef={boardContainerRef}
                            palettePieces={PALETTE_PIECES}
                            pieceImages={PIECE_IMAGES}
                            boardWidth={BOARD_WIDTH}
                            onDrop={onDrop}
                            onPieceDrop={onDrop}
                            handleDragOver={handleDragOver}
                            handleBoardDrop={handleBoardDrop}
                            handleSquareRightClick={handleSquareRightClick}
                            game={game}
                            traversalFens={traversalFens}
                            currentStep={currentStep}
                            Arrows={arrows}
                            memoizedCurrentArrows={memoizedCurrentArrows}
                            handleSetUp={handleSetUp}
                        />
                        <SetupSidebar
                            problems={MATE_IN_TWO_PROBLEMS}
                            selectedIndex={selectedProblemIndex}
                            onProblemChange={handleProblemChange}
                        />
                    </div>
                ) : (
                        <BoardSection
                            setupMode={setupMode}
                            positionObj={positionObj}
                            boardContainerRef={boardContainerRef}
                            palettePieces={PALETTE_PIECES}
                            pieceImages={PIECE_IMAGES}
                            boardWidth={BOARD_WIDTH}
                            onDrop={onDrop}
                            handleDragOver={handleDragOver}
                            handleBoardDrop={handleBoardDrop}
                            handleSquareRightClick={handleSquareRightClick}
                            game={game}
                            traversalFens={traversalFens}
                            currentStep={currentStep}
                            Arrows={arrows}
                            memoizedCurrentArrows={memoizedCurrentArrows}
                            handleSetUp={handleSetUp}
                        />
                    )}

                {!setupMode && (
                    <ControlPanel
                        allowedSteps={allowedSteps}
                        setAllowedSteps={setAllowedSteps}
                        setupMode={setupMode}
                        solveProblem={solveProblem}
                        bestCandidate={bestCandidate}
                        showFullTraversal={handleShowFullTraversal}
                        traversalFens={traversalFens}
                        currentStep={currentStep}
                        nextStep={nextStep}
                        prevStep={prevStep}
                        arrowTraversalQueue={arrowTraversalQueue}
                        currentArrowStep={currentArrowStep}
                        nextArrowStep={() => nextArrowStep(setGame)}
                        prevArrowStep={() => prevArrowStep(setGame)}
                        playArrows={handlePlayArrows}
                        isPlaying={isPlaying}
                        clearArrowsOnStop={handleClearArrows}
                    />
                )}
            </div>

            {candidateTree && !setupMode && (
                <div
                    style={{
                        maxWidth: '600px',
                        margin: '1rem auto',
                        textAlign: 'center'
                    }}
                >
                    <p className="text-gray-300 leading-relaxed">
                        Use <span className="text-green-500">double‑click</span> on a node
            to <span className="text-green-500">toggle</span> (expand or
            collapse) its children. You can also use the{' '}
                        <span className="text-green-500">Expand Full Tree</span> option
            from the control panel. Please also make sure to use the{' '}
                        <span className="text-green-500">center‑root</span> button to
            simplify your navigation.
          </p>
                </div>
            )}

            {/* Tree Container */}
            <div
                ref={treeContainerRef}
                className="tree-container"
                style={{
                    margin: '1rem auto',
                    maxWidth: '800px',
                    width: '90%'
                }}
            >
                {candidateTree && !setupMode ? (
                    <TreeSection
                        treeData={treeData}
                        showTree={showTree}
                        setShowTree={setShowTree}
                        expandNext={expandNext}
                        expandFullTree={expandFullTree}
                        setupMode={setupMode}
                        onNodeDoubleClick={handleNodeDoubleClick}
                    />
                ) : (
                        <div className="tree-section visible">
                            <p style={{ textAlign: 'center', color: '#777' }}>
                                {setupMode
                                    ? "Setup mode active. Solve a problem to generate tree logic."
                                    : "Solve a problem to generate tree logic."}
                            </p>
                        </div>
                    )}
            </div>
        </>
    );
};

export default DecisionTreePage;
