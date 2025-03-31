import React, { useState, useEffect, useMemo } from 'react';

const MazeDijkstra = ({ mazeData, resetCounter, startTraversal }) => {
  const [step, setStep] = useState(0);
  
  const grid = useMemo(
    () => (mazeData ? mazeData.map((row) => row.split('').map(Number)) : []),
    [mazeData]
  );
  
  const numRows = grid.length;
  const numCols = grid[0]?.length || 0;
  const start = useMemo(() => ({ row: 1, col: 0 }), []);
  const end = useMemo(() => ({ row: numRows - 2, col: numCols - 1 }), [numRows, numCols]);
  
  const dijkstraEvents = useMemo(() => {
    if (numRows === 0 || numCols === 0) return [];
    const events = [];
    const distances = Array(numRows)
      .fill(null)
      .map(() => Array(numCols).fill(Infinity));
    const visited = Array(numRows)
      .fill(null)
      .map(() => Array(numCols).fill(false));
    const previous = Array(numRows)
      .fill(null)
      .map(() => Array(numCols).fill(null));

    distances[start.row][start.col] = 0;
    let queue = [{ row: start.row, col: start.col, dist: 0 }];

    const directions = [
      { dr: -1, dc: 0 },
      { dr: 0, dc: 1 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
    ];

    while (queue.length > 0) {
      queue.sort((a, b) => a.dist - b.dist);
      const current = queue.shift();
      const { row, col, dist } = current;
      if (visited[row][col]) continue;
      visited[row][col] = true;
      events.push({ row, col, status: 'visit' });
      if (row === end.row && col === end.col) break;

      for (const { dr, dc } of directions) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr < 0 || nc < 0 || nr >= numRows || nc >= numCols) continue;
        if (grid[nr][nc] === 1) continue;
        if (visited[nr][nc]) continue;
        const newDist = dist + 1;
        if (newDist < distances[nr][nc]) {
          distances[nr][nc] = newDist;
          previous[nr][nc] = { row, col };
          queue.push({ row: nr, col: nc, dist: newDist });
        }
      }
    }

    // If a path was found, reconstruct it to show on the visualization.
    if (visited[end.row][end.col]) {
      let path = [];
      let cur = end;
      while (cur) {
        path.push(cur);
        cur = previous[cur.row][cur.col];
      }
      path.reverse();
      for (const cell of path) {
        events.push({ row: cell.row, col: cell.col, status: 'path' });
      }
    }
    return events;
  }, [grid, numRows, numCols, start, end]);

  useEffect(() => {
    setStep(0);
  }, [resetCounter]);

  useEffect(() => {
    if (step < dijkstraEvents.length && startTraversal === true) {
      const timeout = setTimeout(() => {
        setStep((prevStep) => prevStep + 1);
      }, 5);
      return () => clearTimeout(timeout);
    }
  }, [step, dijkstraEvents, startTraversal]);

  const visitedCells = useMemo(() => {
    const cells = new Set();
    for (let i = 0; i < step; i++) {
      const ev = dijkstraEvents[i];
      if (ev.status === 'visit') {
        cells.add(`${ev.row},${ev.col}`);
      }
    }
    return cells;
  }, [step, dijkstraEvents]);

  const pathCells = useMemo(() => {
    const cells = new Set();
    for (let i = 0; i < step; i++) {
      const ev = dijkstraEvents[i];
      if (ev.status === 'path') {
        cells.add(`${ev.row},${ev.col}`);
      }
    }
    return cells;
  }, [step, dijkstraEvents]);

  const currentCell = useMemo(() => {
    let cell = null;
    for (let i = 0; i < step; i++) {
      const ev = dijkstraEvents[i];
      if (ev.status === 'visit') {
        cell = `${ev.row},${ev.col}`;
      }
    }
    return cell;
  }, [step, dijkstraEvents]);

  if (!mazeData) {
    return <div>Loading maze...</div>;
  }

  return (
    <div style={{ display: 'inline-block', margin: '20px' }}>
      {/* Current Algorithm Display */}
      <div className="text-center text-xl font-medium mb-4">
        Current Algorithm: <span className="text-indigo-600">Dijkstra</span>
      </div>
      {grid.map((row, rIdx) => (
        <div key={rIdx} style={{ display: 'flex' }}>
          {row.map((cell, cIdx) => {
            const cellKey = `${rIdx},${cIdx}`;
            let background = 'white';
            if (cell === 1) {
              background = 'black';
            } else if (pathCells.has(cellKey)) {
              background = 'lightgreen';
            } else if (visitedCells.has(cellKey)) {
              background = cellKey === currentCell ? 'red' : 'lightblue';
            }
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
 * Static method to run Dijkstra's algorithm on a maze without visualization.
 * Expects mazeData as an array of strings.
 * Returns an object: { runtime: <ms>, stepsTaken: <number> }.
 */
MazeDijkstra.solveMaze = async (mazeData) => {
  if (!mazeData) throw new Error("No maze data available");

  // Convert mazeData into a grid of numbers.
  const grid = mazeData.map(row => row.split('').map(Number));
  const numRows = grid.length;
  const numCols = grid[0]?.length || 0;
  const start = { row: 1, col: 0 };
  const end = { row: numRows - 2, col: numCols - 1 };

  const distances = Array(numRows)
    .fill(null)
    .map(() => Array(numCols).fill(Infinity));
  const visited = Array(numRows)
    .fill(null)
    .map(() => Array(numCols).fill(false));
  const previous = Array(numRows)
    .fill(null)
    .map(() => Array(numCols).fill(null));

  distances[start.row][start.col] = 0;
  let queue = [{ row: start.row, col: start.col, dist: 0 }];
  const directions = [
    { dr: -1, dc: 0 },
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
  ];

  const startTime = performance.now();
  let steps = 0; // Count of nodes processed.
  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist);
    const current = queue.shift();
    const { row, col, dist } = current;
    if (visited[row][col]) continue;
    visited[row][col] = true;
    steps++; // Increment steps counter for each node processed.
    if (row === end.row && col === end.col) break;

    for (const { dr, dc } of directions) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nc < 0 || nr >= numRows || nc >= numCols) continue;
      if (grid[nr][nc] === 1) continue;
      if (visited[nr][nc]) continue;
      const newDist = dist + 1;
      if (newDist < distances[nr][nc]) {
        distances[nr][nc] = newDist;
        previous[nr][nc] = { row, col };
        queue.push({ row: nr, col: nc, dist: newDist });
      }
    }
  }
  const runtime = performance.now() - startTime;
  const formattedRuntime = parseFloat(runtime.toFixed(11));
  // Instead of reconstructing the final path length, we now return the total steps taken.
  return { runtime: formattedRuntime, stepsTaken: steps };
};

export default MazeDijkstra;
