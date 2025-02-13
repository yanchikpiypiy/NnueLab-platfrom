import React, { useState, useEffect, useMemo } from 'react';

const MazeBFS = ({ mazeData, resetCounter, startTraversal }) => {
  // 1. State to hold the current step in the animation.
  const [step, setStep] = useState(0);

  // 2. Convert the maze strings into a 2D grid of numbers.
  const grid = useMemo(() => {
    if (!mazeData) return [];
    return mazeData.map((row) => row.split('').map(Number));
  }, [mazeData]);

  const numRows = grid.length;
  const numCols = grid.length > 0 ? grid[0].length : 0;

  // 3. Define start and end positions.
  const start = useMemo(() => ({ row: 1, col: 0 }), []);
  const end = useMemo(() => ({ row: numRows - 2, col: numCols - 1 }), [numRows, numCols]);

  // 4. Precompute the BFS "events" using useMemo so that BFS runs only once.
  // Each event is an object: { row, col, status }
  // "visit" events occur when a cell is processed,
  // "path" events are added after the exit is found to highlight the final path.
  const bfsEvents = useMemo(() => {
    if (numRows === 0 || numCols === 0) return [];

    const events = [];
    const visited = Array(numRows)
      .fill(null)
      .map(() => Array(numCols).fill(false));
    const parent = Array(numRows)
      .fill(null)
      .map(() => Array(numCols).fill(null));
    // Define neighbor directions: up, right, down, left.
    const directions = [
      { dr: -1, dc: 0 },
      { dr: 0,  dc: 1 },
      { dr: 1,  dc: 0 },
      { dr: 0,  dc: -1 }
    ];
    
    // Initialize the queue for BFS.
    const queue = [];
    queue.push({ row: start.row, col: start.col });
    visited[start.row][start.col] = true;

    while (queue.length > 0) {
      const current = queue.shift();
      // Record the event when a cell is processed.
      events.push({ row: current.row, col: current.col, status: 'visit' });
      
      // Stop if we have reached the exit.
      if (current.row === end.row && current.col === end.col) {
        break;
      }
      
      // Process all valid neighbors.
      for (const { dr, dc } of directions) {
        const nr = current.row + dr;
        const nc = current.col + dc;
        if (nr < 0 || nc < 0 || nr >= numRows || nc >= numCols) continue;
        if (grid[nr][nc] === 1) continue;
        if (!visited[nr][nc]) {
          visited[nr][nc] = true;
          parent[nr][nc] = { row: current.row, col: current.col };
          queue.push({ row: nr, col: nc });
        }
      }
    }

    // After BFS, if the exit was reached, reconstruct the shortest path.
    if (visited[end.row][end.col]) {
      let path = [];
      let cur = { row: end.row, col: end.col };
      while (cur !== null) {
        path.push(cur);
        cur = parent[cur.row][cur.col];
      }
      path.reverse();
      // Append path events so the final path can be highlighted.
      for (const cell of path) {
        events.push({ row: cell.row, col: cell.col, status: 'path' });
      }
    }
    return events;
  }, [grid, numRows, numCols, start, end]);

  // 5. Reset the BFS traversal progress when resetCounter changes.
  useEffect(() => {
    setStep(0);
  }, [resetCounter]);

  // 6. Playback of BFS events: advance one step every 50ms when traversal is active.
  useEffect(() => {
    if (step < bfsEvents.length && startTraversal === true) {
      const timeout = setTimeout(() => {
        setStep((prev) => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [step, bfsEvents, startTraversal]);

  // 7. Reconstruct the current state from the events up to the current step.
  let currentCell = null;
  const visitedCells = new Set();
  const pathCells = new Set();
  for (let i = 0; i < step; i++) {
    const ev = bfsEvents[i];
    if (ev.status === 'visit') {
      visitedCells.add(`${ev.row},${ev.col}`);
      currentCell = `${ev.row},${ev.col}`; // Update current cell to the most recent processed cell.
    } else if (ev.status === 'path') {
      pathCells.add(`${ev.row},${ev.col}`);
    }
  }

  // 8. Render the maze.
  return (
    <div style={{ display: 'inline-block', margin: '20px' }}>
      <div style={{ marginTop: '10px', fontFamily: 'sans-serif' }}>
        {step < bfsEvents.length
          ? "BFS Traversal in progress..."
          : "BFS Traversal complete!"}
      </div>
      {mazeData ? (
        grid.map((row, rIdx) => (
          <div key={rIdx} style={{ display: 'flex' }}>
            {row.map((cell, cIdx) => {
              const cellKey = `${rIdx},${cIdx}`;
              let background = 'white';
              if (cell === 1) {
                background = 'black';
              } else if (cellKey === currentCell) {
                background = 'red'; // Current cell being processed.
              } else if (pathCells.has(cellKey)) {
                background = 'lightgreen'; // Part of the final shortest path.
              } else if (visitedCells.has(cellKey)) {
                background = 'lightblue'; // Visited cells.
              }
              
              // Mark the start ("S") and exit ("E") cells.
              let text = '';
              if (rIdx === start.row && cIdx === start.col) {
                text = 'S';
              } else if (rIdx === end.row && cIdx === end.col) {
                text = 'E';
              }
              
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
                    fontSize: '12px'
                  }}
                >
                  {text}
                </div>
              );
            })}
          </div>
        ))
      ) : (
        <div>Loading maze...</div>
      )}
    </div>
  );
};

/**
 * Static method to run BFS on a maze without visualization.
 * Expects mazeData as an array of strings.
 * Returns an object: { runtime: <ms>, stepsTaken: <number> }.
 */
MazeBFS.solveMaze = async (mazeData) => {
  if (!mazeData) throw new Error("No maze data provided");

  // Convert mazeData into a grid (2D array of numbers)
  const grid = mazeData.map(row => row.split('').map(Number));
  const numRows = grid.length;
  const numCols = grid[0].length;
  const start = { row: 1, col: 0 };
  const end = { row: numRows - 2, col: numCols - 1 };

  // Initialize visited and parent matrices.
  const visited = Array(numRows).fill(null).map(() => Array(numCols).fill(false));
  const parent = Array(numRows).fill(null).map(() => Array(numCols).fill(null));
  const directions = [
    { dr: -1, dc: 0 },
    { dr: 0,  dc: 1 },
    { dr: 1,  dc: 0 },
    { dr: 0,  dc: -1 }
  ];
  
  // Initialize BFS queue.
  const queue = [];
  queue.push(start);
  visited[start.row][start.col] = true;
  
  let steps = 0; // Counter for steps taken (nodes processed)
  const startTime = performance.now();
  let reached = false;

  // Run BFS loop.
  while (queue.length > 0) {
    const current = queue.shift();
    steps++; // Count each processed cell as a step.
    if (current.row === end.row && current.col === end.col) {
      reached = true;
      break;
    }
    for (const { dr, dc } of directions) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      if (nr < 0 || nc < 0 || nr >= numRows || nc >= numCols) continue;
      if (grid[nr][nc] === 1) continue;
      if (!visited[nr][nc]) {
        visited[nr][nc] = true;
        parent[nr][nc] = current;
        queue.push({ row: nr, col: nc });
      }
    }
  }
  const endTime = performance.now();
  const formattedStarttime = parseFloat(startTime.toFixed(11));
  const formattedEndtime = parseFloat(endTime.toFixed(11));
  const runtime = formattedEndtime - formattedStarttime;

  // Instead of reconstructing the path length, we return the total steps taken.
  return { runtime, stepsTaken: steps };
};

export default MazeBFS;
