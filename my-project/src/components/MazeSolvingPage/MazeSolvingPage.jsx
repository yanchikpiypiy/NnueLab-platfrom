import React, { useEffect, useState, useRef, useCallback } from 'react';
import MazeBFS from './Algs/MazeBfs';
import MazeDFS from './Algs/MazeDFS';
import MazeDijkstra from './Algs/MazeDijkstra';
import MazeAStar from './Algs/MazeAStar';
import Benchmark from './BenchMarks/Benchmark';
import Header from '../Header';

function MazeSolvingPage() {
  const [mazeData, setMazeData] = useState(null);
  const [resetCounter, setResetCounter] = useState(0);
  const [stopTraversal, setStopTraversal] = useState(false);

  // Maze dimensions
  const [mazeWidth, setMazeWidth] = useState(40);
  const [mazeHeight, setMazeHeight] = useState(20);
  const [speed, setSpeed] = useState(100);

  // Algorithm choice
  const [alg, setAlg] = useState("DFS");

  // Trigger for benchmarks or generation states
  const [mazeGeneration, setMazeGeneration] = useState(0);

  // Show/hide the custom editor
  const [showCustomEditor, setShowCustomEditor] = useState(false);

  // Refs for smooth scrolling
  const customEditorRef = useRef(null);
  const demoControlsRef = useRef(null);

  // Maze API endpoint
  const mazeUrl = `http://localhost:8000/api/maze?width=${mazeWidth}&height=${mazeHeight}&tile=2`;

  const generateMaze = () => {
    fetch(mazeUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        const rows = text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        setMazeData(rows);
        setMazeGeneration((prev) => prev + 1);
      })
      .catch((error) => console.error("Error fetching maze:", error));
  };

  useEffect(() => {
    // On mount, fetch a generated maze
    generateMaze();
  }, []);

  const handleReset = () => {
    setResetCounter((prev) => prev + 1);
  };

  const handleGen = () => {
    generateMaze();
    handleReset();
    setStopTraversal(false);
  };

  const handleStop = () => {
    setStopTraversal((prev) => !prev);
  };

  // When user selects an algorithm card, set the alg and scroll to the button group
  const handleAlgChange = (selectedAlg) => {
    setAlg(selectedAlg);

    setTimeout(() => {
      if (demoControlsRef.current) {
        demoControlsRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // -----------------------------------------------
  //   BFS/DFS/A*/Dijkstra Visualization
  // -----------------------------------------------
  let context = null;
  if (alg === "DFS") {
    context = (
      <MazeDFS
        mazeData={mazeData}
        resetCounter={resetCounter}
        startTraversal={stopTraversal}
        speed={speed}
      />
    );
  } else if (alg === "BFS") {
    context = (
      <MazeBFS
        mazeData={mazeData}
        resetCounter={resetCounter}
        startTraversal={stopTraversal}
        speed={speed}
      />
    );
  } else if (alg === "Dijkstra") {
    context = (
      <MazeDijkstra
        mazeData={mazeData}
        resetCounter={resetCounter}
        startTraversal={stopTraversal}
        speed={speed}
      />
    );
  } else if (alg === "A*") {
    context = (
      <MazeAStar
        mazeData={mazeData}
        resetCounter={resetCounter}
        startTraversal={stopTraversal}
        speed={speed}
      />
    );
  }

  // -----------------------------------------------
  //   Custom Maze Editor State & Logic
  // -----------------------------------------------
  const gridRef = useRef([]);
  const [customGrid, setCustomGrid] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const animationFrameRef = useRef(null);
  const gridContainerRef = useRef(null);

  // Maze Editor layout
  const cellSize = 20;
  const gap = 2;
  const effectiveSize = cellSize + gap;

  const containerWidth = mazeWidth * cellSize + (mazeWidth - 1) * gap;
  const containerHeight = mazeHeight * cellSize + (mazeHeight - 1) * gap;

  // We store which cells we have toggled this pointer-down cycle
  const toggledCellsRef = useRef(new Set());

  const initCustomGrid = useCallback(() => {
    const newGrid = [];
    for (let i = 0; i < mazeHeight; i++) {
      const row = [];
      for (let j = 0; j < mazeWidth; j++) {
        row.push("0");
      }
      newGrid.push(row);
    }
    return newGrid;
  }, [mazeWidth, mazeHeight]);

  useEffect(() => {
    // Create a new blank grid whenever maze dims change
    const blank = initCustomGrid();
    gridRef.current = blank;
    setCustomGrid(blank);
  }, [mazeWidth, mazeHeight, initCustomGrid]);

  // Entrance/Exit
  const isFixedCell = (row, col) => {
    return (
      (row === 1 && col === 0) ||
      (row === mazeHeight - 2 && col === mazeWidth - 1)
    );
  };

  // Toggle a cell from "0" to "1", or "1" to "0"
  const toggleCellValue = (rowIndex, colIndex) => {
    const currentVal = gridRef.current[rowIndex][colIndex];
    const newVal = currentVal === "1" ? "0" : "1";
    gridRef.current[rowIndex][colIndex] = newVal;
  };

  // Rerender after toggling
  const requestRerender = () => {
    if (!animationFrameRef.current) {
      animationFrameRef.current = window.requestAnimationFrame(() => {
        setCustomGrid([...gridRef.current]);
        animationFrameRef.current = null;
      });
    }
  };

  const updateCellFromPointerEvent = (e) => {
    e.preventDefault();
    const rect = gridContainerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    let colIndex = Math.floor((offsetX + gap / 2) / effectiveSize);
    let rowIndex = Math.floor((offsetY + gap / 2) / effectiveSize);

    // clamp
    if (
      rowIndex < 0 || rowIndex >= mazeHeight ||
      colIndex < 0 || colIndex >= mazeWidth
    ) {
      return;
    }

    // skip if entrance or exit
    if (isFixedCell(rowIndex, colIndex)) {
      return;
    }

    // We only want to toggle each cell once per pointer-down cycle
    const cellKey = `${rowIndex}-${colIndex}`;
    if (!toggledCellsRef.current.has(cellKey)) {
      toggledCellsRef.current.add(cellKey);
      toggleCellValue(rowIndex, colIndex);
      requestRerender();
    }
  };

  const handlePointerDown = (e) => {
    setIsDrawing(true);

    // Start a fresh set of toggled cells for this drag
    toggledCellsRef.current = new Set();

    // Capture pointer so we can drag outside
    gridContainerRef.current.setPointerCapture(e.pointerId);

    // Toggle the cell we initially clicked
    updateCellFromPointerEvent(e);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    updateCellFromPointerEvent(e);
  };

  const handlePointerUp = (e) => {
    setIsDrawing(false);
    toggledCellsRef.current = new Set(); // reset the set
    gridContainerRef.current.releasePointerCapture(e.pointerId);
  };

  // "Apply" the custom-drawn maze
  const applyCustomMaze = () => {
    const rows = gridRef.current.map((row) => row.join(""));
    setMazeData(rows);
    setMazeGeneration((prev) => prev + 1);
    setStopTraversal(false);
  };

  // -----------------------------------------------
  //   Toggle Editor + Scroll
  // -----------------------------------------------
  const handleToggleCustomEditor = () => {
    if (!showCustomEditor) {
      // Show, then scroll
      setShowCustomEditor(true);
      setTimeout(() => {
        if (customEditorRef.current) {
          customEditorRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      setShowCustomEditor(false);
    }
  };

  // -----------------------------------------------
  //   Algorithm Card UI
  // -----------------------------------------------
  const cardClasses = (currentAlg) =>
    `p-6 border border-gray-600 rounded transition transform duration-300 cursor-pointer hover:scale-105 active:scale-95 ${
      alg === currentAlg ? "bg-gray-700 -translate-y-2 white-shadow" : "bg-gray-800"
    }`;

  // -----------------------------------------------
  //   Render
  // -----------------------------------------------
  return (
    <div className="min-h-screen bg-black">
      <Header />

      {/* 1) ALGORITHM OVERVIEW */}
      <section id="algorithms" className="py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">Algorithm Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={cardClasses("DFS")} onClick={() => handleAlgChange("DFS")}>
              <h3 className="text-2xl font-semibold mb-2">Depth-First Search</h3>
              <p className="text-gray-300 text-sm">
                Explores deeply before backtracking. May not yield shortest path.
              </p>
            </div>
            <div className={cardClasses("BFS")} onClick={() => handleAlgChange("BFS")}>
              <h3 className="text-2xl font-semibold mb-2">Breadth-First Search</h3>
              <p className="text-gray-300 text-sm">
                Guaranteed shortest path on unweighted graphs.
              </p>
            </div>
            <div className={cardClasses("A*")} onClick={() => handleAlgChange("A*")}>
              <h3 className="text-2xl font-semibold mb-2">A* Search</h3>
              <p className="text-gray-300 text-sm">
                Combines cost + heuristic for efficient optimal paths.
              </p>
            </div>
            <div className={cardClasses("Dijkstra")} onClick={() => handleAlgChange("Dijkstra")}>
              <h3 className="text-2xl font-semibold mb-2">Dijkstra Search</h3>
              <p className="text-gray-300 text-sm">
                Finds shortest paths in weighted graphs with non-negative edges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2) MAZE DEMO */}
      <section id="demo" className="py-16 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">Interactive Maze Demo</h2>
          
          <div className="w-full flex items-center justify-center rounded text-black bg-white shadow">
            {context}
          </div>

          <div className="mt-6 mx-auto w-full max-w-md">
            {/* Attach ref to this button group so we can scroll here */}
            <div className="flex justify-center space-x-3 mb-4" ref={demoControlsRef}>
              <button
                onClick={handleGen}
                className="bg-gray-700 text-white font-medium py-2 px-4 rounded hover:bg-gray-600 transition"
              >
                Generate
              </button>
              <button
                onClick={handleReset}
                className="bg-gray-700 text-white font-medium py-2 px-4 rounded hover:bg-gray-600 transition"
              >
                Reset
              </button>
              <button
                onClick={handleStop}
                className={`py-2 px-4 font-medium rounded text-white transition ${
                  stopTraversal
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {stopTraversal ? "Stop" : "Start"}
              </button>
              {/* Button to toggle custom editor */}
              <button
                onClick={handleToggleCustomEditor}
                className="bg-violet-800 text-white font-medium py-2 px-4 rounded hover:bg-violet-600 transition"
              >
                {showCustomEditor ? "Hide Editor" : "Custom Editor"}
              </button>
            </div>

            {/* Maze Settings */}
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 text-center mt-4">
              <h3 className="text-lg font-semibold mb-3">Maze Settings</h3>
              <div className="mb-4">
                <label className="block text-gray-300 font-medium text-sm mb-1">
                  Width: {mazeWidth}
                </label>
                <input
                  type="range"
                  min="20"
                  max="40"
                  value={mazeWidth}
                  onChange={(e) => setMazeWidth(Number(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 font-medium text-sm mb-1">
                  Height: {mazeHeight}
                </label>
                <input
                  type="range"
                  min="20"
                  max="40"
                  value={mazeHeight}
                  onChange={(e) => setMazeHeight(Number(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium text-sm mb-1">
                  Speed: {speed}
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3) CUSTOM MAZE EDITOR SECTION (conditionally visible) */}
      {showCustomEditor && (
        <section id="custom-maze-editor" className="py-16 px-8" ref={customEditorRef}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-center">Custom Maze Editor</h2>
            <p className="text-sm text-center text-gray-300 mb-6">
              Click or drag on cells to toggle them between wall and open space. <br />
              <span className="text-gray-500">
                Entrance is green (top-left), Exit is red (bottom-right).
              </span>
            </p>

            <div
              style={{
                width: `${containerWidth}px`,
                margin: "0 auto"
              }}
            >
              <div
                ref={gridContainerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${mazeWidth}, ${cellSize}px)`,
                  gap: `${gap}px`,
                  width: `${containerWidth}px`,
                  height: `${containerHeight}px`,
                  userSelect: "none",
                  touchAction: "none",
                }}
              >
                {customGrid.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    let bgColor = cell === "1" ? "black" : "white";
                    if (rowIndex === 1 && colIndex === 0) {
                      bgColor = "lightgreen"; // Entrance
                    }
                    if (
                      rowIndex === mazeHeight - 2 &&
                      colIndex === mazeWidth - 1
                    ) {
                      bgColor = "tomato"; // Exit
                    }
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        style={{
                          width: `${cellSize}px`,
                          height: `${cellSize}px`,
                          backgroundColor: bgColor,
                          border: "1px solid gray",
                          pointerEvents: "none"
                        }}
                      />
                    );
                  })
                )}
              </div>
            </div>

            <div className="text-center mt-6">
              <button
                onClick={applyCustomMaze}
                className="bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-500 transition"
              >
                Apply Custom Maze
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 4) BENCHMARKS */}
      <section id="benchmarks" className="py-16 px-8">
        <div className="max-w-5xl mx-auto text-white">
          <Benchmark mazeData={mazeData} mazeGeneration={mazeGeneration} />
        </div>
      </section>
    </div>
  );
}

export default MazeSolvingPage;
