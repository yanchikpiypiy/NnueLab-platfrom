// DecisionTreeImpPage.jsx
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
import { findMateInNCandidateTree } from './MateSolvingAlgs/mateSolver';

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

// --- Helper: Convert FEN to Position Object ---
const fenToPosition = (fen) => {
  const [piecePlacement] = fen.split(" ");
  const rows = piecePlacement.split("/");
  const position = {};
  const files = ['a','b','c','d','e','f','g','h'];
  rows.forEach((row, r) => {
    let fileIndex = 0;
    for (const char of row) {
      if (!isNaN(char)) {
        fileIndex += parseInt(char, 10);
      } else {
        const rank = 8 - r;
        const square = files[fileIndex] + rank;
        position[square] = char === char.toUpperCase() ? "w" + char : "b" + char.toUpperCase();
        fileIndex++;
      }
    }
  });
  return position;
};

// --- Define Mate-in-2 Problems ---
const mateInTwoProblems = [
  { name: "Mate in 2 – Problem 1", fen: "kbK5/pp6/1P6/8/8/8/8/R7 w - - 0 1" },
  { name: "Mate in 2 – Problem 2", fen: "8/p4p2/Q7/3P4/1p1kB3/1K4N1/5R2/8 w - - 0 1" },
  { name: "Mate in 2 – Problem 3", fen: "2b3N1/8/1r2pN1b/1p2kp2/1P1R4/8/4K3/6Q1 w - - 0 1" }
];

// --- New Helper: assignHierarchicalIds ---
// This function assigns the raw candidate tree IDs so that the root is "root"
// and its immediate children are "root-0", "root-1", etc. Deeper nodes get IDs like "root-0-0", etc.
function assignHierarchicalIds(node) {
  node.id = "root";
  if (node.children && node.children.length > 0) {
    node.children.forEach((child, index) => {
      child.id = `root-${index}`;
      assignIdsRecursively(child, child.id);
    });
  }
}
function assignIdsRecursively(node, parentId) {
  if (node.children && node.children.length > 0) {
    node.children.forEach((child, index) => {
      child.id = `${parentId}-${index}`;
      assignIdsRecursively(child, child.id);
    });
  }
}

const DecisionTreeImpPage = () => {
  // --- State Declarations ---
  const defaultFen = mateInTwoProblems[0].fen;
  const defaultPositionObj = fenToPosition(defaultFen);
  const [selectedProblemIndex, setSelectedProblemIndex] = useState(0);
  const [arrowTraversalQueue, setArrowTraversalQueue] = useState([]);
  const [currentArrowStep, setCurrentArrowStep] = useState(0);
  const [setupMode, setSetupMode] = useState(true);
  const [positionObj, setPositionObj] = useState(defaultPositionObj);
  const [problemFEN, setProblemFEN] = useState(defaultFen);
  const [game, setGame] = useState(new Chess(defaultFen));
  const [allowedSteps, setAllowedSteps] = useState(2);
  const [bestCandidate, setBestCandidate] = useState(null);
  const [candidateTree, setCandidateTree] = useState(null);
  const [bfsQueue, setBfsQueue] = useState([]);
  const [showTree, setShowTree] = useState(false);
  const [solutionBranch, setSolutionBranch] = useState(null);
  const [traversalFens, setTraversalFens] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const boardContainerRef = useRef(null);
  const treeContainerRef = useRef(null); // <-- Added ref for tree container
  const [Arrows, setArrows] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef(null);
  const boardWidth = 400;

  // --- Compute the transformed tree for React Flow ---
  const treeData = useMemo(() => candidateTree ? transformTreeForD3(candidateTree) : null, [candidateTree]);

  // --- Function to show tree and scroll to tree container ---
  const handleShowTree = useCallback(() => {
    setShowTree(true);
  }, []);
  
  // useEffect that scrolls the page when showTree changes to true
  useEffect(() => {
    if (showTree && treeContainerRef.current) {
      const offset =-75; // adjust offset as needed
      const top =
        treeContainerRef.current.getBoundingClientRect().top +
        window.pageYOffset -
        offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, [showTree]);
  
  

  // --- Problem Selector ---
  const handleProblemChange = useCallback((e) => {
    const index = parseInt(e.target.value, 10);
    setSelectedProblemIndex(index);
    const newFen = mateInTwoProblems[index].fen;
    setProblemFEN(newFen);
    const newPosition = fenToPosition(newFen);
    setPositionObj(newPosition);
    setGame(new Chess(newFen));
  }, []);

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
        if (tree.children) {
          tree.children.forEach(child => (child.visible = false));
        }
        // Assign hierarchical IDs: root is "root", children "root-0", "root-1", etc.
        assignHierarchicalIds(tree);
        setCandidateTree(tree);
        const nodesInBFS = bfsCollectNodes(tree);
        nodesInBFS.shift(); // remove root from BFS queue
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
      setShowTree(null);
    } catch (err) {
      alert("Invalid board setup! Please check your position.");
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

  // --- Double-click handler: toggle expansion/collapse ---
  const handleNodeDoubleClick = useCallback((event, flowNode) => {
    console.log("Double-click fired from React Flow with node:", flowNode);
    console.log("Searching for node with ID:", flowNode.id);
    if (!candidateTree) {
      console.log("No candidateTree available.");
      return;
    }
    // Deep copy candidateTree to avoid direct mutation
    const newCandidateTree = JSON.parse(JSON.stringify(candidateTree));
    
    // Recursive function to toggle children visibility for the target node
    const toggleNode = (nodeObj, targetId) => {
      console.log("Examining node:", nodeObj.id, "with target:", targetId);
      if (nodeObj.id === targetId) {
        console.log("Found matching node:", nodeObj.id);
        if (nodeObj.children && nodeObj.children.length > 0) {
          // Toggle: if first child is visible, collapse; otherwise, expand.
          const expanded = nodeObj.children[0].visible;
          if (expanded) {
            console.log("Collapsing children for node:", nodeObj.id);
            nodeObj.children.forEach(child => child.visible = false);
          } else {
            console.log("Expanding children for node:", nodeObj.id, "Children IDs:", nodeObj.children.map(child => child.id));
            nodeObj.children.forEach(child => child.visible = true);
          }
        } else {
          console.log("Node", nodeObj.id, "has no children to toggle.");
        }
        return true;
      }
      if (nodeObj.children) {
        for (const child of nodeObj.children) {
          if (toggleNode(child, targetId)) {
            return true;
          }
        }
      }
      return false;
    };

    const found = toggleNode(newCandidateTree, flowNode.id);
    console.log("Was node found and toggled?", found);
    setCandidateTree(newCandidateTree);
  }, [candidateTree]);

  return (
    <>
      <Header />
      {/* Updated Informational Text */}
      <div className="visualization-info" style={{ maxWidth: '600px', margin: '1rem auto', textAlign: 'center' }}>
        <p className="text-gray-300 leading-relaxed">
          This page visualizes the decision-making process of an algorithm solving a mate-in-2 chess problem.
          In reality, similar algorithmic decisions occur on every move during a game.
          Here, you can set up a problem, then click <span className="text-green-500">solve</span> to generate and visualize the minimax search tree.
        </p>
      </div>
      
      {/* Show Tree Button */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <button onClick={handleShowTree} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>
          Show Tree
        </button>
      </div>
      
      <div className="main-container dark-theme">
        {setupMode ? (
          <div className="setup-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '1rem' }}>
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
            <div className="setup-sidebar" style={{ backgroundColor: '#222', padding: '1rem', borderRadius: '4px', color: 'white', minWidth: '200px' }}>
              <div className="problem-selector" style={{ marginBottom: '1rem' }}>
                <label style={{ marginRight: '0.5rem' }}>Select Mate in 2 Problem:</label>
                <select
                  value={selectedProblemIndex}
                  onChange={handleProblemChange}
                  style={{ backgroundColor: '#222', color: 'white', border: '1px solid white', padding: '0.2rem' }}
                >
                  {mateInTwoProblems.map((prob, idx) => (
                    <option key={idx} value={idx}>{prob.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : (
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
        )}

        {!setupMode && (
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
        )}
      </div>
      
      {/* New instructions above the tree */}
      <div style={{ maxWidth: '600px', margin: '1rem auto', textAlign: 'center' }}>
        <p className="text-gray-300 leading-relaxed">
          Use double‑click on a node to toggle (expand or collapse) its children.
          You can also use the "Expand Full Tree" option from the control panel.Please also make sure to use center-root button to simplify your navigation
        </p>
      </div>
      
      {/* Tree container with ref attached for scrolling */}
      <div ref={treeContainerRef} className="tree-container" style={{ margin: '1rem auto', maxWidth: '800px', width: '90%' }}>
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

export default DecisionTreeImpPage;
