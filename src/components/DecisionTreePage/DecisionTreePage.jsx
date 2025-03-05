// DecisionTreePage.jsx
import React, { useState, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import TreeVisualization from './TreeVisualization';
import ChessBoardSetup from './ChessBoardSetup';
import Header from '../Header';
import { findMateInNCandidateTree, transformTreeForD3 } from './mateSolver';
import '../MateIn2Solver.css';

// --- Define piece images and palette pieces ---
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

// --- Helper: Convert a board object to FEN ---
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

// --- BFS helper: Collect all nodes from the tree in BFS order ---
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

// --- Helper: Convert a SAN move to an arrow tuple [from, to, color] ---
const getArrowTuple = (moveSan, fen, color) => {
  if (!moveSan) return null;
  const chessInstance = new Chess(fen);
  try {
    const moveObj = chessInstance.move(moveSan);
    if (!moveObj) return null;
    return [moveObj.from, moveObj.to, color];
  } catch (error) {
    console.error("getArrowTuple error for move", moveSan, "on FEN:", fen, error);
    return null;
  }
};

const DecisionTreePage = () => {
  // --- Board setup state ---
  const defaultPositionObj = {
    "a8": "bK",
    "b8": "bB",
    "c8": "wK",
    "a7": "bP",
    "b7": "bP",
    "b6": "wP",
    "a1": "wR"
  };
  
  const [setupMode, setSetupMode] = useState(true);
  const [positionObj, setPositionObj] = useState(defaultPositionObj);
  const [problemFEN, setProblemFEN] = useState(objectToFEN(defaultPositionObj));
  const [game, setGame] = useState(new Chess(problemFEN));

  // --- Mate solver state ---
  const [allowedSteps, setAllowedSteps] = useState(2);
  const [bestCandidate, setBestCandidate] = useState(null);
  const [candidateTree, setCandidateTree] = useState(null);
  const [bfsQueue, setBfsQueue] = useState([]);
  const [showTree, setShowTree] = useState(false);

  // --- Steps visualizer state ---
  const [solutionBranch, setSolutionBranch] = useState(null);
  const [traversalFens, setTraversalFens] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  const boardContainerRef = useRef(null);

  // --- Solve the problem and build the tree ---
  const solveProblem = () => {
    try {
      const chessInstance = new Chess(problemFEN);
      const { candidate, tree } = findMateInNCandidateTree(chessInstance, allowedSteps);
      console.log(candidate,tree)
      if (!candidate) {
        alert(`No mate‑in‑${allowedSteps} candidate found.`);
        setBestCandidate(null);
        setCandidateTree(null);
        setBfsQueue([]);
      } else {
        setBestCandidate(candidate);
        // Set the root node as visible.
        tree.visible = true;
        tree.children.forEach(child => (child.visible = false));
        setCandidateTree(tree);
        // Build a BFS queue from the tree (skip the root which is already visible)
        const nodesInBFS = bfsCollectNodes(tree);
        nodesInBFS.shift(); // Remove the root.
        setBfsQueue(nodesInBFS);
      }
    } catch (err) {
      alert("Invalid problem FEN. Please fix your board setup.");
    }
    // Reset the steps visualizer.
    setSolutionBranch(null);
    setTraversalFens([]);
    setCurrentStep(0);
  };

  // --- Expand the next node (incremental reveal) ---
  const expandNext = () => {
    if (!candidateTree || bfsQueue.length === 0) {
      alert("No more nodes to expand.");
      return;
    }
    const nextNode = bfsQueue[0];
    bfsQueue.shift();
    nextNode.visible = true;
    // Force re-render by updating state.
    setBfsQueue([...bfsQueue]);
    setCandidateTree({ ...candidateTree });
  };
  const expandFullTree = () => {
    if (!candidateTree) return;
  
    // Recursive function to make all nodes visible
    const revealAllNodes = (node) => {
      node.visible = true;
      if (node.children && node.children.length > 0) {
        node.children.forEach(revealAllNodes);
      }
    };
  
    // Clone the tree and reveal all nodes
    const expandedTree = { ...candidateTree };
    revealAllNodes(expandedTree);
  
    setCandidateTree(expandedTree);
  };
  
  // --- Get tree data for react-d3-tree (only visible nodes) ---
  const getTreeData = () => {
    if (!candidateTree) return null;
    return transformTreeForD3(candidateTree);
  };

  // --- Steps visualizer functions ---
  const computeTraversal = (branch) => {
    const clone = new Chess(problemFEN);
    const fens = [clone.fen()];
    for (let move of branch) {
      clone.move(move);
      fens.push(clone.fen());
    }
    return fens;
  };

  const showFullTraversal = () => {
    if (!bestCandidate) return;
    setSolutionBranch({ branch: bestCandidate.branch });
    const fens = computeTraversal(bestCandidate.branch);
    setTraversalFens(fens);
    setCurrentStep(0);
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, traversalFens.length - 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // --- Compute arrows for move visualization ---
  const computeCurrentArrows = () => {
    if (!solutionBranch || !solutionBranch.branch) return [];
    let arrows = [];
    let currentFEN = problemFEN;
    for (let i = 0; i < currentStep; i++) {
      const color = i % 2 === 0 ? "rgba(0,255,0,0.6)" : "rgba(255,0,0,0.6)";
      const arrow = getArrowTuple(solutionBranch.branch[i], currentFEN, color);
      if (arrow) arrows.push(arrow);
      const clone = new Chess(currentFEN);
      clone.move(solutionBranch.branch[i]);
      currentFEN = clone.fen();
    }
    return arrows;
  };

  const currentArrows = computeCurrentArrows();

  // --- Board move handler (for gameplay mode) ---
  const onDrop = (sourceSquare, targetSquare) => {
    if (setupMode) return;
    const newGame = new Chess(game.fen());
    let move = newGame.move({ from: sourceSquare, to: targetSquare });
    if (!move) move = newGame.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    if (move) setGame(newGame);
    return move;
  };

  // --- Setup mode handlers ---
  const handleDragOver = (e) => e.preventDefault();
  const handleBoardDrop = (e) => {
    e.preventDefault();
    if (!setupMode) return;
    const rect = boardContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const boardWidth = 500;
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
    console.log("Setting new problem with FEN:", fen); // Debugging

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

        console.log("New board set successfully!");
    } catch (err) {
        alert("Invalid board setup! Please check the position.");
    }};
  // --- Determine which board position to display ---
  const boardPosition = traversalFens.length > 0
    ? traversalFens[currentStep]
    : (setupMode ? positionObj : game.fen());

  return (
    <>
      <Header />
      <div className="container">
        <header className="header">
          <h1>Mate in N Solver</h1>
          <p>Solve your problem in N white moves</p>
          <div>
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
          <div className="button-group">
            <button className="button" onClick={() => setSetupMode(!setupMode)}>
              {setupMode ? "Exit Setup Mode" : "Enter Setup Mode"}
            </button>
          </div>
        </header>

        {setupMode ? (
          <>
            <ChessBoardSetup
              position={positionObj}
              boardWidth={500}
              setupMode={setupMode}
              onDragOver={handleDragOver}
              onDrop={handleBoardDrop}
              onSquareRightClick={handleSquareRightClick}
              boardContainerRef={boardContainerRef}
              palettePieces={palettePieces}
              pieceImages={pieceImages}
            />
            <div className="button-group" style={{ marginTop: '20px', textAlign: 'center' }}>
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
              boardWidth={500}
              boardOrientation="white"
              customArrows={currentArrows}
              customBoardStyle={{ borderRadius: "5px", boxShadow: "0 5px 15px rgba(0,0,0,0.5)" }}
            />
          </div>
        )}

        <div className="button-group" style={{ marginTop: '20px' }}>
          <button className="button" onClick={solveProblem}>Solve Problem</button>
        </div>

        {/* Candidate card and steps visualizer */}
        {bestCandidate && (
          <div className="candidate-card">
            <div className="candidate-info">
              <p>
                <strong>Best Candidate:</strong> {bestCandidate.branch.join(", ")}
              </p>
            </div>
            <button className="candidate-button" onClick={showFullTraversal}>
              Show Full Traversal
            </button>
          </div>
        )}

        {traversalFens.length > 0 && (
          <div className="navigation">
            <button className={currentStep === 0 ? "button disabled" : "button"}
              onClick={prevStep} disabled={currentStep === 0}>
              Previous
            </button>
            <button className={currentStep === traversalFens.length - 1 ? "button disabled" : "button"}
              onClick={nextStep} disabled={currentStep === traversalFens.length - 1}>
              Next
            </button>
            <p>Step {currentStep} of {traversalFens.length - 1}</p>
          </div>
        )}

        {/* Tree visualization controls */}
        {candidateTree && (
          <div className="tree-visualization" style={{ textAlign: 'center', marginTop: '20px' }}>
            <button className="button" onClick={() => setShowTree(!showTree)}>
              {showTree ? "Hide Search Tree" : "Show Search Tree"}
            </button>
            {showTree && (
            <>
            <button className="button" onClick={expandNext} style={{ marginLeft: '10px' }}>
                Expand Next
            </button>
            <button className="button" onClick={expandFullTree} style={{ marginLeft: '10px' }}>
                Show Full Tree
            </button>
            </>
         )}
          </div>
        )}

        {showTree && candidateTree && (
          <TreeVisualization treeData={getTreeData()} />
        )}
      </div>
    </>
  );
};

export default DecisionTreePage;
