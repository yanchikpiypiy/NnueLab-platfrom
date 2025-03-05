import React, { useState, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import Tree from 'react-d3-tree';
import Header from './Header';
import './MateIn2Solver.css';

// Mapping from piece codes to image URLs.
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

// Palette pieces.
const palettePieces = ["wK", "wQ", "wR", "wB", "wN", "wP", "bK", "bQ", "bR", "bB", "bN", "bP"];

// Helper: Convert a board object (mapping square → piece code) to a FEN string.
const objectToFEN = (boardObj) => {
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
};

// NEW: Modified recursive search that builds a search tree.
const findMateInNCandidateTree = (chessInstance, n) => {
  // Create the root node for the current position.
  const rootNode = {
    fen: chessInstance.fen(),
    move: null, // starting position
    children: []
  };

  // Base case: mate in one move.
  if (n === 1) {
    const moves = chessInstance.moves();
    for (let m of moves) {
      const clone = new Chess(chessInstance.fen());
      clone.move(m);
      const childNode = {
        move: m,
        fen: clone.fen(),
        children: []
      };
      rootNode.children.push(childNode);
      if (clone.isCheckmate()) {
        return { candidate: { branch: [m] }, tree: rootNode };
      }
    }
    return { candidate: null, tree: rootNode };
  } else {
    const whiteMoves = chessInstance.moves();
    for (let wm of whiteMoves) {
      const cloneWhite = new Chess(chessInstance.fen());
      if (!cloneWhite.move(wm)) continue;
      const whiteNode = {
        move: wm,
        fen: cloneWhite.fen(),
        children: []
      };
      rootNode.children.push(whiteNode);

      let validForAllBlack = true;
      let branchCandidate = [wm];

      const blackMoves = cloneWhite.moves();
      if (blackMoves.length === 0) continue;
      for (let bm of blackMoves) {
        const cloneBlack = new Chess(cloneWhite.fen());
        if (!cloneBlack.move(bm)) continue;
        const blackNode = {
          move: bm,
          fen: cloneBlack.fen(),
          children: []
        };
        whiteNode.children.push(blackNode);

        const result = findMateInNCandidateTree(cloneBlack, n - 1);
        if (!result.candidate) {
          validForAllBlack = false;
          // Attach explored subtree even if mate not found.
          blackNode.children = result.tree.children;
          break;
        } else {
          branchCandidate.push(bm, ...result.candidate.branch);
          blackNode.children = result.tree.children;
        }
      }
      if (validForAllBlack) {
        return { candidate: { branch: branchCandidate }, tree: rootNode };
      }
    }
    return { candidate: null, tree: rootNode };
  }
};

// Helper: Transform our search tree to a format compatible with react-d3-tree.
const transformTreeForD3 = (node) => {
  return {
    name: node.move ? node.move : 'start',
    attributes: { fen: node.fen },
    children: node.children.map(transformTreeForD3)
  };
};

const MateIn2Solver = () => {
  // Default mate-in-2 position.
  const defaultPositionObj = { "d3": "wQ", "c1": "wK", "a1": "bK" };
  const [setupMode, setSetupMode] = useState(true);
  const [positionObj, setPositionObj] = useState(defaultPositionObj);
  const [problemFEN, setProblemFEN] = useState(objectToFEN(defaultPositionObj));
  const [game, setGame] = useState(new Chess(problemFEN));

  // Other state.
  const [bestCandidate, setBestCandidate] = useState(null);
  const [solutionBranch, setSolutionBranch] = useState(null);
  const [traversalFens, setTraversalFens] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [allowedSteps, setAllowedSteps] = useState(2);
  // NEW: State for the search tree.
  const [candidateTree, setCandidateTree] = useState(null);
  // NEW: Toggle for displaying the search tree.
  const [showTree, setShowTree] = useState(false);

  // Ref for the board container.
  const boardContainerRef = useRef(null);

  // Helper: Convert a SAN move to an arrow tuple [from, to, color].
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

  const debugLog = (msg) => { console.log(msg); };

  // --- Solver functions ---

  // Original simplified recursive mate-in-N search (kept for reference)
  const findMateInNCandidate = (chessInstance, n) => {
    if (n === 1) {
      const moves = chessInstance.moves();
      for (let m of moves) {
        const clone = new Chess(chessInstance.fen());
        clone.move(m);
        if (clone.isCheckmate()) {
          return { branch: [m] };
        }
      }
      return null;
    } else {
      const whiteMoves = chessInstance.moves();
      for (let wm of whiteMoves) {
        const cloneWhite = new Chess(chessInstance.fen());
        if (!cloneWhite.move(wm)) continue;
        let validForAllBlack = true;
        let branchCandidate = [wm];
        const blackMoves = cloneWhite.moves();
        if (blackMoves.length === 0) continue;
        for (let bm of blackMoves) {
          const cloneBlack = new Chess(cloneWhite.fen());
          if (!cloneBlack.move(bm)) continue;
          const response = findMateInNCandidate(cloneBlack, n - 1);
          if (!response) {
            validForAllBlack = false;
            break;
          } else {
            branchCandidate.push(bm, ...response.branch);
          }
        }
        if (validForAllBlack) {
          return { branch: branchCandidate };
        }
      }
      return null;
    }
  };

  // NEW: Modified solveProblem that uses the tree-building function.
  const solveProblem = () => {
    try {
      const chessInstance = new Chess(problemFEN);
      const { candidate, tree } = findMateInNCandidateTree(chessInstance, allowedSteps);
      debugLog("Mate-in-" + allowedSteps + " candidate: " + JSON.stringify(candidate));
      if (!candidate) {
        alert("No mate‑in‑" + allowedSteps + " candidate found. Try a different problem or reduce allowed steps.");
        setBestCandidate(null);
        setCandidateTree(null);
      } else {
        setBestCandidate(candidate);
        setCandidateTree(tree);
      }
    } catch (err) {
      alert("Invalid problem FEN. Please fix your board setup.");
    }
    setSolutionBranch(null);
    setTraversalFens([]);
    setCurrentStep(0);
  };

  const onDrop = (sourceSquare, targetSquare) => {
    if (setupMode) return;
    const newGame = new Chess(game.fen());
    let move = newGame.move({ from: sourceSquare, to: targetSquare });
    if (!move) move = newGame.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    if (move) setGame(newGame);
    return move;
  };

  // --- Setup Mode Handlers ---
  const handleDragOver = (e) => { e.preventDefault(); };
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
    const file = files[fileIndex];
    const rank = 8 - rankIndex;
    const square = file + rank;
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
    setProblemFEN(fen);
    try {
      const newGame = new Chess(fen);
      setGame(newGame);
      setSetupMode(false);
    } catch (err) {
      alert("Invalid board setup!");
    }
  };

  const computeTraversal = (branch) => {
    const fens = [];
    let currentFEN = problemFEN;
    fens.push(currentFEN);
    const clone = new Chess(currentFEN);
    for (let move of branch) {
      try {
        const result = clone.move(move);
        if (!result) {
          console.error("Invalid move encountered: " + move);
          break;
        }
        currentFEN = clone.fen();
        fens.push(currentFEN);
      } catch (e) {
        console.error("Error during move " + move + ": ", e);
        break;
      }
    }
    return fens;
  };

  const showFullTraversal = () => {
    if (!bestCandidate) return;
    setSolutionBranch({ branch: bestCandidate.branch });
    const fens = computeTraversal(bestCandidate.branch);
    setTraversalFens(fens);
    setCurrentStep(0);
    debugLog("Computed traversal FENs: " + JSON.stringify(fens));
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, traversalFens.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const computeCurrentArrows = () => {
    if (!solutionBranch || !solutionBranch.branch) return [];
    let arrows = [];
    let currentFEN = problemFEN;
    for (let i = 0; i < currentStep; i++) {
      const color = i % 2 === 0 ? "rgba(0,255,0,0.6)" : "rgba(255,0,0,0.6)";
      try {
        const arrow = getArrowTuple(solutionBranch.branch[i], currentFEN, color);
        if (arrow) arrows.push(arrow);
      } catch (e) {
        console.error(e);
      }
      const clone = new Chess(currentFEN);
      clone.move(solutionBranch.branch[i]);
      currentFEN = clone.fen();
    }
    return arrows;
  };

  const currentArrows = computeCurrentArrows();
  // Use positionObj when in setup mode; otherwise, use game or traversal position.
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
          <div>
            {/* Board and palette side by side */}
            <div 
              className="setup-container" 
              style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '20px' }}
            >
              <div className="board-wrapper">
                <div 
                  ref={boardContainerRef} 
                  onDragOver={handleDragOver} 
                  onDrop={handleBoardDrop}
                >
                  <Chessboard 
                    position={positionObj}
                    boardWidth={500}
                    boardOrientation="white"
                    customBoardStyle={{ borderRadius: "5px", boxShadow: "0 5px 15px rgba(0,0,0,0.5)" }}
                    onSquareRightClick={handleSquareRightClick}
                  />
                </div>
              </div>
              <div className="palette">
                <h3 className="palette-header">Palette</h3>
                {palettePieces.map((piece) => (
                  <div key={piece} className="palette-item" draggable="true"
                    onDragStart={(e) => { e.dataTransfer.setData("piece", piece); }}>
                    <img src={pieceImages[piece]} alt={piece} className="palette-image" />
                  </div>
                ))}
              </div>
            </div>
            {/* "Set Current Board as Problem" button at the bottom */}
            <div className="button-group" style={{ marginTop: '20px', textAlign: 'center' }}>
              <button className="button" onClick={setCurrentBoardAsProblem}>
                Set Current Board as Problem
              </button>
            </div>
          </div>
        ) : (
          // When not in setup mode, display the board only.
          <div className="board-wrapper">
            <div ref={boardContainerRef}>
              <Chessboard 
                position={boardPosition}
                onPieceDrop={onDrop}
                boardWidth={500}
                boardOrientation="white"
                customArrows={currentArrows}
                customBoardStyle={{ borderRadius: "5px", boxShadow: "0 5px 15px rgba(0,0,0,0.5)" }}
              />
            </div>
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

        <div className="button-group">
          <button className="button" onClick={solveProblem}>Solve Problem</button>
        </div>

        {bestCandidate && (
          <div className="candidate-card">
            <div className="candidate-info">
              <p>
                <strong>Best Candidate:</strong><br/>
                White move: {bestCandidate.branch ? bestCandidate.branch[0] : bestCandidate.whiteMove}<br/>
                Black reply: {bestCandidate.branch ? bestCandidate.branch[1] : bestCandidate.blackMove}<br/>
                White mate: {bestCandidate.branch ? bestCandidate.branch[2] : bestCandidate.mateMove}
              </p>
            </div>
            <button className="candidate-button" onClick={showFullTraversal}>
              Show Full Traversal
            </button>
          </div>
        )}

        {/* NEW: Button to toggle search tree visualization */}
        {candidateTree && (
          <div className="tree-visualization" style={{ textAlign: 'center', marginTop: '20px' }}>
            <button className="button" onClick={() => setShowTree(!showTree)}>
              {showTree ? "Hide Search Tree" : "Show Search Tree"}
            </button>
          </div>
        )}

        {/* NEW: Render the search tree if toggled on */}
        {showTree && candidateTree && (
          <div id="treeWrapper" style={{ width: '100%', height: '500px', marginTop: '20px' }}>
            <Tree data={transformTreeForD3(candidateTree)} orientation="vertical" />
          </div>
        )}
      </div>
    </>
  );
};

export default MateIn2Solver;
