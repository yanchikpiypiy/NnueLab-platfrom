// DecisionTreePage.jsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import Header from '../Header';
import { objectToFEN, bfsCollectNodes, getArrowTuple } from './helpers';
import { findMateInNCandidateTreeAlphaBetaEnhanced } from './MateSolvingAlgs/mateSolverAlphaBetaEnhanced';
import { transformTreeForD3 } from './MateSolvingAlgs/mateSolver';
import BoardSection from './BoardSection';
import ControlPanel from './ControlPanel';
import TreeSection from './TreeSection';
import './MateIn2Solver.css';

// --- Piece Images & Palette ---
const pieceImages = {
  wK: "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg",
  wQ: "https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg",
  wR: "https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg",
  wB: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg",
  wN: "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg",
  wP: "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg",
  bK: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg",
  bQ: "https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg",
  bR: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg",
  bB: "https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg",
  bN: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg",
  bP: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg"
};
const palettePieces = ["wK", "wQ", "wR", "wB", "wN", "wP", "bK", "bQ", "bR", "bB", "bN", "bP"];

const DecisionTreeImpPage = () => {
  // --- State Declarations ---
  const defaultPositionObj = {
    "a8": "bK",
    "b8": "bB",
    "c8": "wK",
    "a7": "bP",
    "b7": "bP",
    "b6": "wP",
    "a1": "wR"
  };
  const [arrowTraversalQueue, setArrowTraversalQueue] = useState([]);
  const [currentArrowStep, setCurrentArrowStep] = useState(0);
  const [setupMode, setSetupMode] = useState(true);
  const [positionObj, setPositionObj] = useState(defaultPositionObj);
  const [problemFEN, setProblemFEN] = useState(objectToFEN(defaultPositionObj));
  const [game, setGame] = useState(new Chess(problemFEN));
  const [allowedSteps, setAllowedSteps] = useState(2);
  const [bestCandidate, setBestCandidate] = useState(null);
  const [candidateTree, setCandidateTree] = useState(null);
  const [bfsQueue, setBfsQueue] = useState([]);
  const [showTree, setShowTree] = useState(false);
  const [solutionBranch, setSolutionBranch] = useState(null);
  const [traversalFens, setTraversalFens] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const boardContainerRef = useRef(null);
  const [Arrows, setArrows] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef(null);
  const boardWidth = 400;

  // --- Solver and Arrow Functions ---
  const solveProblem = useCallback(() => {
    try {
      const chessInstance = new Chess(problemFEN);
      const { candidate, tree } = findMateInNCandidateTreeAlphaBetaEnhanced(chessInstance, allowedSteps);
      if (!candidate) {
        alert(`No mate‑in‑${allowedSteps} candidate found.`);
        setBestCandidate(null);
        setCandidateTree(null);
        setBfsQueue([]);
      } else {
        setBestCandidate(candidate);
        tree.visible = true;
        tree.children.forEach(child => (child.visible = false));
        setCandidateTree(tree);
        const nodesInBFS = bfsCollectNodes(tree);
        nodesInBFS.shift();
        setBfsQueue(nodesInBFS);
      }
    } catch (err) {
      alert("Invalid problem FEN. Please fix your board setup.");
    }
    setSolutionBranch(null);
    setTraversalFens([]);
    setCurrentStep(0);
  }, [problemFEN, allowedSteps]);

  const extractArrowsFromTreeDFS = useCallback((node, maxDepth, path = [], arrowsQueue = [], currentFEN = problemFEN, depth = 0) => {
    if (!node) return arrowsQueue;
    let newFEN = currentFEN;
    try {
      if (node.move) {
        const color = depth % 2 === 0 ? "rgba(255,0,0,0.9)" : "rgba(0,255,0,0.9)";
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
        extractArrowsFromTreeDFS(child, maxDepth, path, arrowsQueue, newFEN, depth + 1);
      }
    }
    if (node.move) path.pop();
    return arrowsQueue;
  }, [problemFEN]);

  const updateArrowsFromTree = useCallback(() => {
    if (!candidateTree || !bestCandidate) return;
    const maxDepth = bestCandidate.branch.length;
    const newArrowSequences = extractArrowsFromTreeDFS(candidateTree, maxDepth) || [];
    setArrowTraversalQueue(newArrowSequences);
    setCurrentArrowStep(0);
  }, [candidateTree, bestCandidate, extractArrowsFromTreeDFS]);

  useEffect(() => {
    updateArrowsFromTree();
  }, [candidateTree, updateArrowsFromTree]);

  const nextArrowStep = useCallback(() => {
    setCurrentArrowStep(prev => {
      const nextStep = prev + 1;
      if (nextStep < arrowTraversalQueue.length) {
        setArrows(arrowTraversalQueue[nextStep].arrows || []);
        if (arrowTraversalQueue[nextStep].fen) {
          setGame(new Chess(arrowTraversalQueue[nextStep].fen));
        }
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
        if (arrowTraversalQueue[prevStep].fen) {
          setGame(new Chess(arrowTraversalQueue[prevStep].fen));
        }
        return prevStep;
      }
      return prev;
    });
  }, [arrowTraversalQueue]);

  const expandNext = useCallback(() => {
    if (!candidateTree || bfsQueue.length === 0) {
      alert("No more nodes to expand.");
      return;
    }
    const nextNode = bfsQueue.shift();
    nextNode.visible = true;
    setBfsQueue([...bfsQueue]);
    setCandidateTree({ ...candidateTree });
  }, [candidateTree, bfsQueue]);

  const expandFullTree = useCallback(() => {
    if (!candidateTree) return;
    const revealAllNodes = (node) => {
      node.visible = true;
      if (node.children && node.children.length > 0) {
        node.children.forEach(revealAllNodes);
      }
    };
    const expandedTree = { ...candidateTree };
    revealAllNodes(expandedTree);
    setCandidateTree(expandedTree);
  }, [candidateTree]);

  const treeData = useMemo(() => candidateTree ? transformTreeForD3(candidateTree) : null, [candidateTree]);

  const computeTraversal = useCallback((branch) => {
    const clone = new Chess(problemFEN);
    const fens = [clone.fen()];
    branch.forEach(move => {
      clone.move(move);
      fens.push(clone.fen());
    });
    return fens;
  }, [problemFEN]);

  const showFullTraversal = useCallback(() => {
    if (traversalFens && traversalFens.length > 0) {
      setTraversalFens([]);
      const dummy_holder = currentArrowStep === 0 ? [] : arrowTraversalQueue[currentArrowStep].arrows;
      setArrows(dummy_holder);
      return;
    }
    if (!bestCandidate) return;
    setSolutionBranch({ branch: bestCandidate.branch });
    const fens = computeTraversal(bestCandidate.branch);
    setTraversalFens(fens);
    setCurrentStep(0);
    setArrows(null);
  }, [traversalFens, currentArrowStep, arrowTraversalQueue, bestCandidate, computeTraversal]);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, traversalFens.length - 1));
  }, [traversalFens]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const computeCurrentArrows = useCallback(() => {
    if (!solutionBranch || !solutionBranch.branch) return [];
    const arrows = [];
    let currentFENLocal = problemFEN;
    const steps = Math.min(currentStep, solutionBranch.branch.length);
    for (let i = 0; i < steps; i++) {
      const color = i % 2 === 0 ? "rgba(0,255,0,0.6)" : "rgba(255,0,0,0.6)";
      const move = solutionBranch.branch[i];
      if (!move) break;
      const arrow = getArrowTuple(move, currentFENLocal, color);
      if (arrow) arrows.push(arrow);
      const clone = new Chess(currentFENLocal);
      if (clone.move(move)) {
        currentFENLocal = clone.fen();
      }
    }
    return arrows;
  }, [solutionBranch, currentStep, problemFEN]);

  const memoizedCurrentArrows = useMemo(() => computeCurrentArrows(), [computeCurrentArrows]);

  const onDrop = useCallback((sourceSquare, targetSquare) => {
    if (setupMode) return;
    const newGame = new Chess(game.fen());
    let move = newGame.move({ from: sourceSquare, to: targetSquare });
    if (!move) move = newGame.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    if (move) setGame(newGame);
    return move;
  }, [setupMode, game]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleBoardDrop = useCallback((e) => {
    e.preventDefault();
    if (!setupMode) return;
    const rect = boardContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const fileIndex = Math.floor((x / boardWidth) * 8);
    const rankIndex = Math.floor((y / boardWidth) * 8);
    const files = ['a','b','c','d','e','f','g','h'];
    const square = files[fileIndex] + (8 - rankIndex);
    const piece = e.dataTransfer.getData("piece");
    const newPosition = { ...positionObj };
    if (piece) newPosition[square] = piece;
    setPositionObj(newPosition);
  }, [setupMode, positionObj, boardWidth]);

  const handleSquareRightClick = useCallback((square) => {
    if (!setupMode) return;
    const newPosition = { ...positionObj };
    delete newPosition[square];
    setPositionObj(newPosition);
  }, [setupMode, positionObj]);

  const setCurrentBoardAsProblem = useCallback(() => {
    const fen = objectToFEN(positionObj);
    try {
      const newGame = new Chess(fen);
      setGame(newGame);
      setProblemFEN(fen);
      setSetupMode(false);
      setBestCandidate(null);
      setCandidateTree(null);
      setBfsQueue([]);
      setSolutionBranch(null);
      setTraversalFens([]);
      setCurrentStep(0);
      setArrowTraversalQueue([]);
      setShowTree(null)
    } catch (err) {
      alert("Invalid board setup! Please check the position.");
    }
  }, [positionObj]);

  const convertSANtoTargetSquares = useCallback((sanMoves) => {
    const chessInstance = new Chess(problemFEN);
    return sanMoves.map(sanMove => {
      const moveObj = chessInstance.move(sanMove);
      return moveObj ? moveObj.to : null;
    });
  }, [problemFEN]);

  const handleSetUp = useCallback(() => {
    setSetupMode(true);
    setShowTree(null);
  }, []);

  const playArrows = useCallback(() => {
    if (isPlaying) {
      clearInterval(playIntervalRef.current);
      setIsPlaying(false);
      return;
    }
    setTraversalFens([]);
    if (!arrowTraversalQueue.length) {
      console.warn("Arrow traversal queue is empty!");
      return;
    }
    const startingStep = currentArrowStep < arrowTraversalQueue.length ? currentArrowStep : 0;
    setArrows(arrowTraversalQueue[startingStep].arrows || []);
    if (!bestCandidate || !bestCandidate.branch || bestCandidate.branch.length === 0) {
      alert("Best candidate not yet found. Solve the problem first!");
      return;
    }
    setIsPlaying(true);
    const bestCandidateTargetSquares = convertSANtoTargetSquares(bestCandidate.branch);
    playIntervalRef.current = setInterval(() => {
      setCurrentArrowStep(prevStep => {
        if (!arrowTraversalQueue[prevStep]) {
          clearInterval(playIntervalRef.current);
          setIsPlaying(false);
          return prevStep;
        }
        const currentArrowSequence = arrowTraversalQueue[prevStep].arrows;
        const targetSquares = currentArrowSequence.map(arrow => arrow[1]);
        const match = bestCandidateTargetSquares.every((sq, i) => targetSquares[i] === sq);
        if (match) {
          clearInterval(playIntervalRef.current);
          setIsPlaying(false);
          return prevStep;
        }
        const nextStep = prevStep + 1;
        if (arrowTraversalQueue[nextStep]) {
          setArrows(arrowTraversalQueue[nextStep].arrows || []);
          if (arrowTraversalQueue[nextStep].fen) {
            setGame(new Chess(arrowTraversalQueue[nextStep].fen));
          }
          setCurrentStep(nextStep);
          return nextStep;
        } else {
          clearInterval(playIntervalRef.current);
          setIsPlaying(false);
          return prevStep;
        }
      });
    }, 10);
  }, [isPlaying, arrowTraversalQueue, currentArrowStep, bestCandidate, convertSANtoTargetSquares]);

  const clearArrowsOnStop = useCallback(() => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }
    setArrows([]);
    setIsPlaying(false);
    setCurrentArrowStep(0);
    setCurrentStep(0);
    setGame(new Chess(problemFEN));
  }, [problemFEN]);

  useEffect(() => {
    console.log(Arrows);
  }, [Arrows]);

  return (
    <>
      <Header />
      <div className="main-container dark-theme">
        <BoardSection
          setupMode={setupMode}
          positionObj={positionObj}
          boardContainerRef={boardContainerRef}
          palettePieces={palettePieces}
          pieceImages={pieceImages}
          boardWidth={boardWidth}
          onDrop={onDrop}
          handleDragOver={handleDragOver}
          handleBoardDrop={handleBoardDrop}
          handleSquareRightClick={handleSquareRightClick}
          game={game}
          traversalFens={traversalFens}
          currentStep={currentStep}
          Arrows={Arrows}
          memoizedCurrentArrows={memoizedCurrentArrows}
          handleSetUp={setupMode ? setCurrentBoardAsProblem : handleSetUp}
        />

        <ControlPanel
          allowedSteps={allowedSteps}
          setAllowedSteps={setAllowedSteps}
          setupMode={setupMode}
          solveProblem={solveProblem}
          bestCandidate={bestCandidate}
          showFullTraversal={showFullTraversal}
          traversalFens={traversalFens}
          currentStep={currentStep}
          nextStep={nextStep}
          prevStep={prevStep}
          arrowTraversalQueue={arrowTraversalQueue}
          currentArrowStep={currentArrowStep}
          nextArrowStep={nextArrowStep}
          prevArrowStep={prevArrowStep}
          playArrows={playArrows}
          isPlaying={isPlaying}
          clearArrowsOnStop={clearArrowsOnStop}
        />

        
      </div>
      {(candidateTree && !setupMode) ? (
        <TreeSection
          candidateTree={candidateTree}
          showTree={showTree}
          setShowTree={setShowTree}
          expandNext={expandNext}
          expandFullTree={expandFullTree}
          treeData={treeData}
          setupMode={setupMode}
        />
      ) :
      <div className="tree-section visible">
        <p style={{ textAlign: 'center', color: '#777' }}>
            {setupMode
            ? "Setup mode active. Solve a problem to generate tree logic."
            : "Solve a problem to generate tree logic."}
        </p>
      </div>
      }
    </>
  );
};

export default DecisionTreeImpPage;
