// DecisionTreePage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import TreeVisualization from './TreeVisualization';
import ChessBoardSetup from './ChessBoardSetup';
import Header from '../Header';
import { findMateInNCandidateTree, transformTreeForD3 } from './mateSolver';
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

// --- DFS: Extract Arrow Sequences from Tree (with FENs) ---
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
  const [playInterval, setPlayInterval] = useState(null);
  const [startingStep, setStartinstep] = useState(0)
  // --- Solver Functions ---
  const solveProblem = () => {
    try {
      const chessInstance = new Chess(problemFEN);
      const { candidate, tree } = findMateInNCandidateTree(chessInstance, allowedSteps);
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
  };

  const extractArrowsFromTreeDFS = (
    node, 
    maxDepth, 
    path = [], 
    arrowsQueue = [], 
    currentFEN = problemFEN, 
    depth = 0
  ) => {
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
  };

  const updateArrowsFromTree = () => {
    if (!candidateTree || !bestCandidate) return;
    const maxDepth = bestCandidate.branch.length;
    const newArrowSequences = extractArrowsFromTreeDFS(candidateTree, maxDepth) || [];
    setArrowTraversalQueue(newArrowSequences);
    setCurrentArrowStep(0);
  };

  useEffect(() => {
    updateArrowsFromTree();
  }, [candidateTree]);

  const nextArrowStep = () => {
    if (currentArrowStep < arrowTraversalQueue.length - 1) {
      const nextStep = currentArrowStep + 1;
      setCurrentArrowStep(nextStep);
      setArrows(arrowTraversalQueue[nextStep].arrows || []);
      if (arrowTraversalQueue[nextStep].fen) {
        setGame(new Chess(arrowTraversalQueue[nextStep].fen));
      }
    }
  };
  
  const prevArrowStep = () => {
    if (currentArrowStep > 0) {
      const prevStep = currentArrowStep - 1;
      setCurrentArrowStep(prevStep);
      setArrows(arrowTraversalQueue[prevStep].arrows || []);
      if (arrowTraversalQueue[prevStep].fen) {
        setGame(new Chess(arrowTraversalQueue[prevStep].fen));
      }
    }
  };
  

  const expandNext = () => {
    if (!candidateTree || bfsQueue.length === 0) {
      alert("No more nodes to expand.");
      return;
    }
    const nextNode = bfsQueue.shift();
    nextNode.visible = true;
    setBfsQueue([...bfsQueue]);
    setCandidateTree({ ...candidateTree });
  };

  const expandFullTree = () => {
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
  };

  const getTreeData = () => {
    if (!candidateTree) return null;
    return transformTreeForD3(candidateTree);
  };

  const computeTraversal = (branch) => {
    const clone = new Chess(problemFEN);
    const fens = [clone.fen()];
    branch.forEach(move => {
      clone.move(move);
      fens.push(clone.fen());
    });
    return fens;
  };
  
  

  const showFullTraversal = () => {
    if (traversalFens && traversalFens.length > 0) {
      setTraversalFens([]);
      let dummy_holder = 0
      if (currentArrowStep == 0){
        dummy_holder = []
      }
      else{
        dummy_holder = arrowTraversalQueue[currentArrowStep].arrows
      }
      setArrows(dummy_holder); // This explicitly clears arrows.
      return;
    }
  
    if (!bestCandidate) return;
    setSolutionBranch({ branch: bestCandidate.branch });
    const fens = computeTraversal(bestCandidate.branch);
    setTraversalFens(fens);
    setCurrentStep(0);
    setArrows(null);
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, traversalFens.length - 1));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const computeCurrentArrows = () => {
    if (!solutionBranch || !solutionBranch.branch) return [];
    const arrows = [];
    let currentFEN = problemFEN;
    const steps = Math.min(currentStep, solutionBranch.branch.length);
    for (let i = 0; i < steps; i++) {
      const color = i % 2 === 0 ? "rgba(0,255,0,0.6)" : "rgba(255,0,0,0.6)";
      const move = solutionBranch.branch[i];
      if (!move) break;
      const arrow = getArrowTuple(move, currentFEN, color);
      if (arrow) arrows.push(arrow);
      const clone = new Chess(currentFEN);
      if (clone.move(move)) {
        currentFEN = clone.fen();
      }
    }
    return arrows;
  };
  const currentArrows = computeCurrentArrows();

  const onDrop = (sourceSquare, targetSquare) => {
    if (setupMode) return;
    const newGame = new Chess(game.fen());
    let move = newGame.move({ from: sourceSquare, to: targetSquare });
    if (!move) move = newGame.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    if (move) setGame(newGame);
    return move;
  };

  // --- Setup Mode Handlers ---
  const handleDragOver = (e) => e.preventDefault();
  const handleBoardDrop = (e) => {
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
  };

  const handleSquareRightClick = (square) => {
    if (!setupMode) return;
    const newPosition = { ...positionObj };
    delete newPosition[square];
    setPositionObj(newPosition);
  };

  const setCurrentBoardAsProblem = () => {
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
  };

  const convertSANtoTargetSquares = (sanMoves) => {
    const chessInstance = new Chess(problemFEN);
    return sanMoves.map(sanMove => {
      const moveObj = chessInstance.move(sanMove);
      return moveObj ? moveObj.to : null;
    });
  };


const playArrows = () => {
  // If already playing, then simply stop playback without resetting state.
  if (isPlaying) {
    clearInterval(playInterval);
    setIsPlaying(false);
    setPlayInterval(null);
    return;
  }
  setTraversalFens([]);
  if (!arrowTraversalQueue.length) {
    console.warn("Arrow traversal queue is empty!");
    return;
  }
  
  // Do not reset traversal indices—resume from the currentArrowStep.
  const startingStep = currentArrowStep < arrowTraversalQueue.length
    ? currentArrowStep
    : 0;
  setArrows(arrowTraversalQueue[startingStep].arrows || []);
  setStartinstep(startingStep)
  if (!bestCandidate || !bestCandidate.branch || bestCandidate.branch.length === 0) {
    alert("Best candidate not yet found. Solve the problem first!");
    return;
  }
  
  setIsPlaying(true);
  const bestCandidateTargetSquares = convertSANtoTargetSquares(bestCandidate.branch);
  const interval = setInterval(() => {
    setStartinstep(currentArrowStep)
    setCurrentArrowStep(prevStep => {
      // If no arrow exists for the current step, stop.
      if (!arrowTraversalQueue[prevStep]) {
        clearInterval(interval);
        setIsPlaying(false);
        setPlayInterval(null);
        return prevStep;
      }
      
      const currentArrowSequence = arrowTraversalQueue[prevStep].arrows;
      const targetSquares = currentArrowSequence.map(arrow => arrow[1]);
      const match = bestCandidateTargetSquares.every(
        (sq, i) => targetSquares[i] === sq
      );
      
      if (match) {
        // Best candidate reached: stop playback, but leave the arrows intact.
        clearInterval(interval);
        setIsPlaying(false);
        setPlayInterval(null);
        return prevStep;
      }
      
      const nextStep = prevStep + 1;
      if (arrowTraversalQueue[nextStep]) {
        // Update arrows and board state using the next step.
        setArrows(arrowTraversalQueue[nextStep].arrows || []);
        if (arrowTraversalQueue[nextStep].fen) {
          setGame(new Chess(arrowTraversalQueue[nextStep].fen));
        }
        setCurrentStep(nextStep);
        return nextStep;
      } else {
        // No more steps: stop playback.
        clearInterval(interval);
        setIsPlaying(false);
        setPlayInterval(null);
        return prevStep;
      }
    });
  }, 10);
  
  setPlayInterval(interval);
};

    
    
    // This effect tracks when arrows are updated
  useEffect(() => {
    console.log(Arrows); // This will show the updated value of Arrows
  }, [Arrows]);  // Tracks changes to Arrows state
  const clearArrowsOnStop = () => {
    // If an interval is active, clear it.
    if (playInterval) {
      clearInterval(playInterval);
    }
    // Clear arrows and reset states.
    setArrows([]);
    setIsPlaying(false);
    setPlayInterval(null);
    setCurrentArrowStep(0);
    setCurrentStep(0);
    setGame(new Chess(problemFEN));
  };
      
  // --- Determine Board Position to Display ---
  const boardPosition = traversalFens.length > 0
    ? traversalFens[currentStep]
    : (setupMode ? positionObj : game.fen());

  const boardWidth = 400;

  return (
    <>
      <Header />
      <div className="main-container">
        <div className="board-section">
          {setupMode ? (
            <>
              {/* Wrap ChessBoardSetup in a container that can toggle the palette visibility */}
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
            <div className="board-wrapper" ref={boardContainerRef}>
              <Chessboard 
                position={boardPosition}
                onPieceDrop={onDrop}
                boardWidth={boardWidth}
                boardOrientation="white"
                customArrows={ Arrows !== null ? Arrows  : currentArrows }
                customBoardStyle={{ borderRadius: "5px", boxShadow: "0 5px 15px rgba(0,0,0,0.5)" }}
              />
            </div>
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
                  {/* Step Navigation */}
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

        {/* Only render Tree Controls if a candidate tree exists */}
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
          <TreeVisualization treeData={getTreeData()} />
        </div>
      ) : (
        // Optionally, show a placeholder message if needed
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
