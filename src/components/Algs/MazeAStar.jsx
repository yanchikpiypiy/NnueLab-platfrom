import React, { useState, useEffect, useMemo } from 'react';

const MazeAStar = () => {
  // 1. Load the maze from a text file (e.g., public/maze.txt)
  const [mazeStr, setMazeStr] = useState(null);

  useEffect(() => {
    fetch('/maze.txt')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        // Split by newlines, trim, and filter out any empty lines.
        const rows = text
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        setMazeStr(rows);
      })
      .catch((error) => console.error('Error loading maze:', error));
  }, []);

  // 2. Define the start and exit positions with stable references.
  // Start: cell [1,0]; Exit: cell [19,20].
  const start = useMemo(() => ({ row: 1, col: 0 }), []);
  const end = useMemo(() => ({ row: 19, col: 20 }), []);

  // 3. Convert the maze strings into a grid (2D array of numbers).
  const grid = useMemo(() => {
    if (!mazeStr) return [];
    return mazeStr.map((row) => row.split('').map(Number));
  }, [mazeStr]);

  const numRows = grid.length;
  const numCols = grid[0]?.length || 0;

  // 4. Precompute the A* search events using useMemo.
  // Each event is an object { row, col, status } where:
  //   - "open": the cell is added to the open set (frontier)
  //   - "visit": the cell is taken from the open set and processed (closed set)
  //   - "path": the cell is part of the final reconstructed path.
  const aStarEvents = useMemo(() => {
    if (numRows === 0 || numCols === 0) return [];
    const events = [];
    // Create arrays for the closed set and to store node information.
    const closedSet = Array(numRows)
      .fill(null)
      .map(() => Array(numCols).fill(false));
    const nodeInfo = Array(numRows)
      .fill(null)
      .map(() => Array(numCols).fill(null));
    const openSet = [];

    // Heuristic: Manhattan distance from (r, c) to the exit.
    const heuristic = (r, c) =>
      Math.abs(r - end.row) + Math.abs(c - end.col);

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
    events.push({ row: start.row, col: start.col, status: 'open' });

    // Define neighbor directions: up, right, down, left.
    const directions = [
      { dr: -1, dc: 0 },
      { dr: 0,  dc: 1 },
      { dr: 1,  dc: 0 },
      { dr: 0,  dc: -1 }
    ];

    let found = false;
    while (openSet.length > 0) {
      // Sort the open set by f-value (g + h) so that the lowest is first.
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      // Record that we are processing (visiting) this cell.
      events.push({ row: current.row, col: current.col, status: 'visit' });
      closedSet[current.row][current.col] = true;

      // If we have reached the exit, reconstruct the path.
      if (current.row === end.row && current.col === end.col) {
        found = true;
        const path = [];
        let node = current;
        while (node) {
          path.push({ row: node.row, col: node.col });
          node = node.parent;
        }
        path.reverse();
        // Record the final path events.
        for (const cell of path) {
          events.push({ row: cell.row, col: cell.col, status: 'path' });
        }
        break;
      }

      // Explore each neighbor.
      for (const { dr, dc } of directions) {
        const nr = current.row + dr;
        const nc = current.col + dc;
        // Skip if out of bounds or if it's a wall.
        if (nr < 0 || nc < 0 || nr >= numRows || nc >= numCols) continue;
        if (grid[nr][nc] === 1) continue;
        if (closedSet[nr][nc]) continue;

        const tentativeG = current.g + 1;
        let neighbor = nodeInfo[nr][nc];
        if (!neighbor) {
          // Create the neighbor node.
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
          // Found a better path to this neighbor.
          neighbor.g = tentativeG;
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = current;
          // If the neighbor is not already in the open set, add it.
          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor);
            events.push({ row: nr, col: nc, status: 'open' });
          }
        }
      }
    }
    return events;
  }, [grid, numRows, numCols, start, end]);

  // 5. Animate the A* search events one step at a time.
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step < aStarEvents.length) {
      const timeout = setTimeout(() => setStep(step + 1), 20);
      return () => clearTimeout(timeout);
    }
  }, [step, aStarEvents]);

  // 6. Process the events up to the current step.
  const openCells = new Set();
  const visitedCells = new Set();
  const pathCells = new Set();
  for (let i = 0; i < step; i++) {
    const event = aStarEvents[i];
    if (event.status === 'open') {
      openCells.add(`${event.row},${event.col}`);
    } else if (event.status === 'visit') {
      visitedCells.add(`${event.row},${event.col}`);
      // Once visited, remove the cell from the open set.
      openCells.delete(`${event.row},${event.col}`);
    } else if (event.status === 'path') {
      pathCells.add(`${event.row},${event.col}`);
    }
  }

  // 7. Render the maze grid.
  return (
    <div style={{ display: 'inline-block', margin: '20px' }}>
      {mazeStr ? (
        grid.map((row, rIdx) => (
          <div key={rIdx} style={{ display: 'flex' }}>
            {row.map((cell, cIdx) => {
              const cellKey = `${rIdx},${cIdx}`;
              let background = 'white';
              if (cell === 1) {
                background = 'black';
              } else if (cellKey === `${start.row},${start.col}`) {
                background = 'lightgreen'; // Start cell.
              } else if (cellKey === `${end.row},${end.col}`) {
                background = 'red'; // Exit cell.
              } else if (pathCells.has(cellKey)) {
                background = 'lightgreen'; // Final path.
              } else if (visitedCells.has(cellKey)) {
                background = 'lightblue'; // Visited (closed set).
              } else if (openCells.has(cellKey)) {
                background = 'red'; // Frontier (open set).
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
      <div style={{ marginTop: '10px', fontFamily: 'sans-serif' }}>
        {step < aStarEvents.length
          ? "A* Search in progress..."
          : "A* Search complete!"}
      </div>
    </div>
  );
};

export default MazeAStar;
