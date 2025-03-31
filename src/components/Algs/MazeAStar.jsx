import React, { useState, useEffect, useMemo } from 'react';

const MazeAStar = ({ mazeData, resetCounter, startTraversal }) => {
  // 1. Convert the maze strings into a grid (2D array of numbers).
  const grid = useMemo(() => {
    if (!mazeData) return [];
    return mazeData.map((row) => row.split('').map(Number));
  }, [mazeData]);

  const numRows = grid.length;
  const numCols = grid.length > 0 ? grid[0].length : 0;

  // 2. Define the start and exit positions.
  const start = useMemo(() => ({ row: 1, col: 0 }), []);
  const end = useMemo(() => ({ row: numRows - 2, col: numCols - 1 }), [numRows, numCols]);

  // 3. Precompute the A* search events.
  const aStarEvents = useMemo(() => {
    if (numRows === 0 || numCols === 0) return [];
    const events = [];
    const closedSet = Array(numRows)
      .fill(null)
      .map(() => Array(numCols).fill(false));
    const nodeInfo = Array(numRows)
      .fill(null)
      .map(() => Array(numCols).fill(null));
    const openSet = [];

    // Heuristic: Manhattan distance.
    const heuristic = (r, c) => Math.abs(r - end.row) + Math.abs(c - end.col);

    const startNode = {
      row: start.row,
      col: start.col,
      g: 0,
      h: heuristic(start.row, start.col)
    };
    startNode.f = startNode.g + startNode.h;
    startNode.parent = null;
    nodeInfo[start.row][start.col] = startNode;
    openSet.push(startNode);
    events.push({ row: start.row, col: start.col, status: 'open' });

    const directions = [
      { dr: -1, dc: 0 },
      { dr: 0, dc: 1 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 }
    ];

    let found = false;
    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      events.push({ row: current.row, col: current.col, status: 'visit' });
      closedSet[current.row][current.col] = true;

      if (current.row === end.row && current.col === end.col) {
        found = true;
        const path = [];
        let node = current;
        while (node) {
          path.push({ row: node.row, col: node.col });
          node = node.parent;
        }
        path.reverse();
        for (const cell of path) {
          events.push({ row: cell.row, col: cell.col, status: 'path' });
        }
        break;
      }

      for (const { dr, dc } of directions) {
        const nr = current.row + dr;
        const nc = current.col + dc;
        if (nr < 0 || nc < 0 || nr >= numRows || nc >= numCols) continue;
        if (grid[nr][nc] === 1) continue;
        if (closedSet[nr][nc]) continue;

        const tentativeG = current.g + 1;
        let neighbor = nodeInfo[nr][nc];
        if (!neighbor) {
          neighbor = {
            row: nr,
            col: nc,
            g: tentativeG,
            h: heuristic(nr, nc)
          };
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = current;
          nodeInfo[nr][nc] = neighbor;
          openSet.push(neighbor);
          events.push({ row: nr, col: nc, status: 'open' });
        } else if (tentativeG < neighbor.g) {
          neighbor.g = tentativeG;
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = current;
          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor);
            events.push({ row: nr, col: nc, status: 'open' });
          }
        }
      }
    }
    return events;
  }, [grid, numRows, numCols, start, end]);

  // 4. Animate the A* search events.
  const [step, setStep] = useState(0);
  useEffect(() => {
    setStep(0);
  }, [resetCounter]);
  useEffect(() => {
    if (step < aStarEvents.length && startTraversal === true) {
      const timeout = setTimeout(() => setStep(step + 1), 5);
      return () => clearTimeout(timeout);
    }
  }, [step, aStarEvents, startTraversal]);

  // 5. Process the events up to the current step.
  const openCells = new Set();
  const visitedCells = new Set();
  const pathCells = new Set();
  for (let i = 0; i < step; i++) {
    const event = aStarEvents[i];
    if (event.status === 'open') {
      openCells.add(`${event.row},${event.col}`);
    } else if (event.status === 'visit') {
      visitedCells.add(`${event.row},${event.col}`);
      openCells.delete(`${event.row},${event.col}`);
    } else if (event.status === 'path') {
      pathCells.add(`${event.row},${event.col}`);
    }
  }

  // 6. Render the maze grid.
  return (
    <div style={{ display: 'inline-block', margin: '20px' }}>
      {/* Current Algorithm Display */}
      <div className="text-center text-xl font-medium mb-4">
        Current Algorithm: <span className="text-indigo-600">A*</span>
      </div>
      {mazeData ? (
        grid.map((row, rIdx) => (
          <div key={rIdx} style={{ display: 'flex' }}>
            {row.map((cell, cIdx) => {
              const cellKey = `${rIdx},${cIdx}`;
              let background = 'white';
              if (cell === 1) {
                background = 'black';
              } else if (pathCells.has(cellKey)) {
                background = 'lightgreen';
              } else if (visitedCells.has(cellKey)) {
                background = 'lightblue';
              } else if (openCells.has(cellKey)) {
                background = 'red';
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
                  {cellKey === `${start.row},${start.col}`
                    ? 'S'
                    : cellKey === `${end.row},${end.col}` ? 'E' : ''}
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
 * Static method to run A* on a maze without visualization.
 * Expects mazeData as an array of strings.
 * Returns an object: { runtime: <ms>, stepsTaken: <number> }.
 */
MazeAStar.solveMaze = async (mazeData) => {
  if (!mazeData) throw new Error("No maze data available");

  // Convert mazeData into a grid of numbers.
  const grid = mazeData.map(row => row.split('').map(Number));
  const numRows = grid.length;
  const numCols = numRows > 0 ? grid[0].length : 0;
  const start = { row: 1, col: 0 };
  const end = { row: numRows - 2, col: numCols - 1 };

  // Create helper matrices.
  const closedSet = Array(numRows).fill(null).map(() => Array(numCols).fill(false));
  const nodeInfo = Array(numRows).fill(null).map(() => Array(numCols).fill(null));
  const openSet = [];

  // Heuristic: Manhattan distance.
  const heuristic = (r, c) => Math.abs(r - end.row) + Math.abs(c - end.col);

  // Initialize the start node.
  const startNode = {
    row: start.row,
    col: start.col,
    g: 0,
    h: heuristic(start.row, start.col)
  };
  startNode.f = startNode.g + startNode.h;
  startNode.parent = null;
  nodeInfo[start.row][start.col] = startNode;
  openSet.push(startNode);

  const directions = [
    { dr: -1, dc: 0 },
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
  ];

  const startTime = performance.now();
  let steps = 0; // Count of nodes processed.
  let found = false;
  let current = null;
  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    current = openSet.shift();
    if (closedSet[current.row][current.col]) continue;
    closedSet[current.row][current.col] = true;
    steps++; // Increment the step counter for each node processed.

    if (current.row === end.row && current.col === end.col) {
      found = true;
      break;
    }

    for (const { dr, dc } of directions) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      if (nr < 0 || nc < 0 || nr >= numRows || nc >= numCols) continue;
      if (grid[nr][nc] === 1) continue;
      if (closedSet[nr][nc]) continue;

      const tentativeG = current.g + 1;
      let neighbor = nodeInfo[nr][nc];
      if (!neighbor) {
        neighbor = {
          row: nr,
          col: nc,
          g: tentativeG,
          h: heuristic(nr, nc)
        };
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.parent = current;
        nodeInfo[nr][nc] = neighbor;
        openSet.push(neighbor);
      } else if (tentativeG < neighbor.g) {
        neighbor.g = tentativeG;
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.parent = current;
        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        }
      }
    }
  }
  const runtime = performance.now() - startTime;
  const formattedRuntime = parseFloat(runtime.toFixed(11));

  return { runtime: formattedRuntime, stepsTaken: steps };
};

export default MazeAStar;
