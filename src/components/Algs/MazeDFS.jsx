import React, { useState, useEffect, useMemo } from 'react';

const MazeDFS = ({ resetCounter, startTraversal, mazeData }) => {
  const [step, setStep] = useState(0);

  // Convert mazeData into a grid (2D array of numbers)
  const grid = useMemo(() => {
    if (!mazeData) return [];
    return mazeData.map((row) => row.split('').map(Number));
  }, [mazeData]);

  // Compute DFS events based on the grid.
  // Each event is { row, col, status: 'visit' | 'backtrack' }
  const dfsEvents = useMemo(() => {
    if (grid.length === 0) return [];
    const events = [];
    const numRows = grid.length;
    const numCols = grid[0].length;
    const visited = Array(numRows)
      .fill(null)
      .map(() => Array(numCols).fill(false));
    const directions = [
      { dr: -1, dc: 0 },
      { dr: 0, dc: 1 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
    ];
    const start = { row: 1, col: 0 };
    const end = { row: numRows - 2, col: numCols - 1 };

    function dfs(r, c) {
      if (r < 0 || c < 0 || r >= numRows || c >= numCols) return false;
      if (grid[r][c] === 1 || visited[r][c]) return false;
      visited[r][c] = true;
      events.push({ row: r, col: c, status: 'visit' });
      if (r === end.row && c === end.col) return true;
      for (const { dr, dc } of directions) {
        if (dfs(r + dr, c + dc)) return true;
      }
      events.push({ row: r, col: c, status: 'backtrack' });
      return false;
    }
    dfs(start.row, start.col);
    return events;
  }, [grid]);

  // Reset DFS traversal progress when resetCounter changes.
  useEffect(() => {
    setStep(0);
  }, [resetCounter]);

  // DFS animation: advance one step every 50ms when traversal is active.
  useEffect(() => {
    if (step < dfsEvents.length && startTraversal === true) {
      const timeout = setTimeout(() => setStep(prev => prev + 1), 50);
      return () => clearTimeout(timeout);
    }
  }, [step, dfsEvents, startTraversal]);

  // Reconstruct DFS traversal call stack and visited cells.
  const currentStack = [];
  const visitedCells = new Set();
  for (let i = 0; i < step; i++) {
    const ev = dfsEvents[i];
    if (ev.status === 'visit') {
      currentStack.push(`${ev.row},${ev.col}`);
      visitedCells.add(`${ev.row},${ev.col}`);
    } else if (ev.status === 'backtrack') {
      currentStack.pop();
    }
  }

  // Render the maze grid with DFS traversal overlay.
  return (
    <div style={{ display: 'inline-block', margin: '20px' }}>
      {!mazeData && <div>Loading maze...</div>}
      <div style={{ marginTop: '10px', fontFamily: 'sans-serif' }}>
        {step < dfsEvents.length
          ? 'DFS Traversal in progress...'
          : 'DFS Traversal complete!'}
      </div>
      {mazeData &&
        grid.map((row, rIdx) => (
          <div key={rIdx} style={{ display: 'flex' }}>
            {row.map((cell, cIdx) => {
              const cellKey = `${rIdx},${cIdx}`;
              let background = 'white';
              if (cell === 1) {
                background = 'black';
              } else if (currentStack.includes(cellKey)) {
                background =
                  currentStack[currentStack.length - 1] === cellKey
                    ? 'red'
                    : 'lightgreen';
              } else if (visitedCells.has(cellKey)) {
                background = 'lightblue';
              }
              let text = '';
              if (rIdx === 1 && cIdx === 0) text = 'S';
              if (rIdx === grid.length - 2 && cIdx === grid[0].length - 1) text = 'E';
              return (
                <div
                  key={cIdx}
                  style={{
                    width: 20,
                    height: 20,
                    background,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                  }}
                >
                  {text}
                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
};

/**
 * Static method to run DFS on a maze without visualization.
 * Expects mazeData as an array of strings.
 * Returns an object: { runtime: <ms>, stepsTaken: <number> }.
 */
MazeDFS.solveMaze = async (mazeData) => {
  if (!mazeData) throw new Error("No maze data provided");

  // Convert mazeData into a grid (2D array of numbers)
  const grid = mazeData.map(row => row.split('').map(Number));
  const numRows = grid.length;
  const numCols = grid[0].length;
  const start = { row: 1, col: 0 };
  const end = { row: numRows - 2, col: numCols - 1 };

  // Create a visited matrix.
  const visited = Array(numRows).fill(null).map(() => Array(numCols).fill(false));
  let finalPath = [];
  let steps = 0; // Counter for steps taken (nodes processed)
  const directions = [
    { dr: -1, dc: 0 },
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
  ];

  // DFS function that tracks the current path.
  const dfs = (r, c, currentPath) => {
    if (r < 0 || c < 0 || r >= numRows || c >= numCols) return false;
    if (grid[r][c] === 1 || visited[r][c]) return false;
    visited[r][c] = true;
    steps++; // Count each cell processed
    currentPath.push({ row: r, col: c });
    if (r === end.row && c === end.col) {
      finalPath = [...currentPath]; // Save the found path.
      return true;
    }
    for (const { dr, dc } of directions) {
      if (dfs(r + dr, c + dc, currentPath)) return true;
    }
    currentPath.pop();
    return false;
  };

  const startTime = performance.now();
  const found = dfs(start.row, start.col, []);
  const endTime = performance.now();
  const formattedStarttime = parseFloat(startTime.toFixed(11));
  const formattedEndtime = parseFloat(endTime.toFixed(11));
  const runtime = formattedEndtime - formattedStarttime;
  // Return stepsTaken (total nodes processed) instead of the final path length.
  return { runtime, stepsTaken: steps };
};

export default MazeDFS;
