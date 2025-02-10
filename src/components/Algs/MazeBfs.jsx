import React, { useState, useEffect, useMemo } from 'react';

const MazeBFS = () => {
  // 1. State to hold the maze strings loaded from a file.
  const [mazeStr, setMazeStr] = useState(null);

  // Load the maze from the text file (e.g., public/maze.txt) on mount.
  useEffect(() => {
    fetch('/maze.txt')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        // Split the file by newlines, trim, and remove any empty lines.
        const rows = text
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        setMazeStr(rows);
      })
      .catch((error) => console.error('Error loading maze:', error));
  }, []);

  // 2. Define start and exit positions with stable references.
  const start = useMemo(() => ({ row: 1, col: 0 }), []);
  const end = useMemo(() => ({ row: 19, col: 20 }), []);

  // 3. Convert the maze strings into a 2D grid of numbers.
  const grid = useMemo(() => {
    if (!mazeStr) return [];
    return mazeStr.map((row) => row.split('').map(Number));
  }, [mazeStr]);

  const numRows = grid.length;
  const numCols = grid[0]?.length || 0;

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

  // 5. Use state to "play back" the BFS events one at a time.
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step < bfsEvents.length) {
      const timeout = setTimeout(() => {
        setStep((prev) => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [step, bfsEvents]);

  // 6. Reconstruct the current state from the events up to the current step.
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

  // 7. Render the maze.
  // Colors:
  // - Black: walls.
  // - White: unvisited open cells.
  // - Light blue: cells that have been visited.
  // - Red: the current cell being processed.
  // - Light green: cells that are part of the final shortest path.
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
      <div style={{ marginTop: '10px', fontFamily: 'sans-serif' }}>
        {step < bfsEvents.length
          ? "BFS Traversal in progress..."
          : "BFS Traversal complete!"}
      </div>
    </div>
  );
};

export default MazeBFS;
