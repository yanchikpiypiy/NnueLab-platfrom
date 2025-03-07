import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import TreeVisualization from '../toberemoved/TreeVisualization';
import ChessBoardSetup from './ChessBoardSetup';
import Header from '../Header';
import { findMateInNCandidateTree, transformTreeForD3 } from './MateSolvingAlgs/mateSolver';
import { findMateInNCandidateTreeAlphaBeta } from './MateSolvingAlgs/mateSolverAlphaBeta';
import { findMateInNCandidateTreeAlphaBetaEnhanced } from './MateSolvingAlgs/mateSolverAlphaBetaEnhanced';
import ReactFlowTree from './ReactFlowTree';
import '../MateIn2Solver.css';

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

// --- Helper: Convert board object to FEN ---
function objectToFEN(boardObj) {
  const files = ['a','b','c','d','e','f','g','h'];
  let fenRows = [];
  for (let rank = 8; rank >= 1; rank--) {
    let row = "";
    let emptyCount = 0;
    for (let file of files) {
      const square = file + rank;
      const piece = boardObj[square] || "";
      if (piece === "") {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          row += emptyCount;
          emptyCount = 0;
        }
        let symbol = piece[1];
        symbol = piece[0] === 'w' ? symbol.toUpperCase() : symbol.toLowerCase();
        row += symbol;
      }
    }
    if (emptyCount > 0) row += emptyCount;
    fenRows.push(row);
  }
  return fenRows.join("/") + " w - - 0 1";
}

// --- Helper: BFS to Collect All Nodes ---
function bfsCollectNodes(root) {
  const queue = [];
  const result = [];
  if (!root) return result;
  queue.push(root);
  while (queue.length > 0) {
    const current = queue.shift();
    result.push(current);
    if (current.children && Array.isArray(current.children)) {
      queue.push(...current.children);
    }
  }
  return result;
}

// --- Helper: Get Arrow Tuple ---
const getArrowTuple = (moveSan, fen, color = "rgba(0,255,0,0.6)", verify = false) => {
  if (!moveSan) return null;
  const chessInstance = new Chess(fen);
  try {
    let moveObj;
    if (verify) {
      const legalMoves = chessInstance.moves({ verbose: true });
      moveObj = legalMoves.find(m => m.san === moveSan);
      if (!moveObj) {
        console.warn(`Invalid move: ${moveSan} on FEN: ${fen}`);
        return null;
      }
      chessInstance.move(moveSan);
    } else {
      moveObj = chessInstance.move(moveSan);
      if (!moveObj) return null;
    }
    return [moveObj.from, moveObj.to, color];
  } catch (error) {
    console.error("getArrowTuple error for move", moveSan, "on FEN:", fen, error);
    return null;
  }
};

const DecisionTreePage = () => {
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

  // Mate Solver State
  const [allowedSteps, setAllowedSteps] = useState(2);
  const [bestCandidate, setBestCandidate] = useState(null);
  const [candidateTree, setCandidateTree] = useState(null);
  const [bfsQueue, setBfsQueue] = useState([]);
  const [showTree, setShowTree] = useState(false);

  // Steps Visualizer State
  const [solutionBranch, setSolutionBranch] = useState(null);
  const [traversalFens, setTraversalFens] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  // Refs & Arrow State
  const boardContainerRef = useRef(null);
  const [Arrows, setArrows] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef(null);
  const [startingStep, setStartinstep] = useState(0);

  // --- Solver Functions ---
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
      setArrows(dummy_holder); // Explicitly clear arrows.
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
    const boardWidth = 400;
    const fileIndex = Math.floor((x / boardWidth) * 8);
    const rankIndex = Math.floor((y / boardWidth) * 8);
    const files = ['a','b','c','d','e','f','g','h'];
    const square = files[fileIndex] + (8 - rankIndex);
    const piece = e.dataTransfer.getData("piece");
    const newPosition = { ...positionObj };
    if (piece) newPosition[square] = piece;
    setPositionObj(newPosition);
  }, [setupMode, positionObj]);

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
  const handleSetUp = () => {
    setSetupMode(true)
  }
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
    setStartinstep(startingStep);
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

  const boardPosition = traversalFens.length > 0 ? traversalFens[currentStep] : (setupMode ? positionObj : game.fen());
  const boardWidth = 400;

  return (
    <>
      <Header />
      <div className="main-container">
        <div className="board-section">
          {setupMode ? (
            <>
              <div className={`palette-container ${setupMode ? '' : 'hidden'}`}>
                <ChessBoardSetup
                  position={positionObj}
                  boardWidth={boardWidth}
                  setupMode={setupMode}
                  onDragOver={handleDragOver}
                  onDrop={handleBoardDrop}
                  onSquareRightClick={handleSquareRightClick}
                  boardContainerRef={boardContainerRef}
                  palettePieces={palettePieces}
                  pieceImages={pieceImages}
                />
              </div>
              <div className="button-group center">
                <button className="button" onClick={setCurrentBoardAsProblem}>
                  Set Current Board as Problem
                </button>
              </div>
            </>
          ) : (
            <>
            <div className="board-wrapper" ref={boardContainerRef}>
              <Chessboard 
                position={boardPosition}
                onPieceDrop={onDrop}
                boardWidth={boardWidth}
                boardOrientation="white"
                customArrows={Arrows !== null ? Arrows : memoizedCurrentArrows}
                customBoardStyle={{ borderRadius: "5px", boxShadow: "0 5px 15px rgba(0,0,0,0.5)" }}
              />
            </div>
            <div className="button-group center">
                <button className="button" onClick={handleSetUp}>
                  Setup mode
                </button>
              </div>
            </>
          )}
        </div>

        <div className="control-panel">
          <h2>Control Panel</h2>

          {/* Board Setup Controls */}
          <div className="control-section">
            <h3>Board Setup</h3>
            <div className="control-group">
              <label>
                Allowed Steps:&nbsp;
                <input 
                  type="number" 
                  min="1" 
                  value={allowedSteps}
                  onChange={(e) => setAllowedSteps(parseInt(e.target.value, 10))} 
                  className="steps-input" 
                />
              </label>
            </div>
            {setupMode && (
              <div className="control-group">
                <button className="button" onClick={setCurrentBoardAsProblem}>
                  Set Board as Problem
                </button>
              </div>
            )}
          </div>

          {/* Solver Controls */}
          <div className="control-section">
            <h3>Solver</h3>
            <div className="control-group">
              <button className="button" onClick={solveProblem}>Solve Problem</button>
            </div>
          </div>

          {bestCandidate && (
            <div className="control-section">
              <h3>Candidate & Traversal</h3>
              <div className="control-group">
                <p className="info">
                  <strong>Best Candidate:</strong> {bestCandidate.branch.join(", ")}
                </p>
                <button className="button" onClick={showFullTraversal}>
                  {traversalFens.length > 0 ? "Stop Full Traversal" : "Show Full Traversal"}
                </button>
              </div>
              {traversalFens.length > 0 && (
                <>
                  <div className="control-group">
                    <button className="button" onClick={prevStep}>Previous Step</button>
                    <button className="button" onClick={nextStep}>Next Step</button>
                  </div>
                  <div className="control-group">
                    <p className="info">Step: {currentStep} / {traversalFens.length - 1}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Arrow Navigation Controls */}
          {arrowTraversalQueue.length > 0 && (
            <div className="control-section">
              <h3>Arrow Navigation</h3>
              <div className="control-group">
                <button className="button" onClick={prevArrowStep}>Previous Arrow Step</button>
                <button className="button" onClick={nextArrowStep}>Next Arrow Step</button>
              </div>
              <div className="control-group">
                <button className="button" onClick={playArrows}>
                  {isPlaying ? "Stop" : "Play Arrows"}
                </button>
                <button className="button" onClick={clearArrowsOnStop}>
                  Reset
                </button>
              </div>
              <div className="control-group">
                <p className="info">Arrow Step: {currentArrowStep + 1} / {arrowTraversalQueue.length}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tree Controls */}
        {candidateTree && (
          <div className="tree-controls">
            <div className="control-section">
              <h3>Search Tree</h3>
              <div className="control-group">
                <button className="button" onClick={() => setShowTree(!showTree)}>
                  {showTree ? "Hide Tree" : "Show Tree"}
                </button>
              </div>
              {showTree && (
                <div className="control-group">
                  <button className="button" onClick={expandNext}>Expand Next Node</button>
                  <button className="button" onClick={expandFullTree}>Expand Full Tree</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tree Visualization */}
      {showTree && candidateTree ? (
        <div className="tree-section visible">
          <ReactFlowTree treeData={treeData} />
        </div>
      ) : (
        <div className="tree-section">
          <p style={{ textAlign: 'center', color: '#777' }}>
            Solve a problem to generate tree logic.
          </p>
        </div>
      )}
    </>
  );
};

export default DecisionTreePage;
