import React, { useState, useEffect, useMemo } from 'react';

const MazeDijkstra = () => {
  // 1. Load the maze text file.
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
        // Split the text into rows, trim, and filter out any empty lines.
        const rows = text
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        setMazeStr(rows);
      })
      .catch((error) => console.error('Error loading maze:', error));
  }, []);

  // 2. Define 'start' and 'end' using useMemo so they are stable across renders.
  const start = useMemo(() => ({ row: 1, col: 0 }), []);
  const end = useMemo(() => ({ row: 19, col: 40 }), []);

  // 3. Always call hooks unconditionally.
  // Create the grid from mazeStr; if mazeStr isn’t ready, use an empty array.
  const grid = useMemo(
    () => (mazeStr ? mazeStr.map((row) => row.split('').map(Number)) : []),
    [mazeStr]
  );
  const numRows = grid.length;
  const numCols = grid[0]?.length || 0;

  // 4. Compute Dijkstra’s algorithm events.
  // If the grid isn’t ready (empty), simply return an empty list.
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

    // Reconstruct the final shortest path if one was found.
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

  // 5. Use a step state to “play back” the events.
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step < dijkstraEvents.length) {
      const timeout = setTimeout(() => {
        setStep((prevStep) => prevStep + 1);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [step, dijkstraEvents]);

  // 6. Process the events (up to 'step') to compute visited and path cells.
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

  // 7. In the render, if the maze isn’t loaded yet, show a loading indicator.
  if (!mazeStr) {
    return <div>Loading maze...</div>;
  }

  // 8. Render the maze grid.
  return (
    <div style={{ display: 'inline-block', margin: '20px' }}>
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
      {/* <div style={{ marginTop: '10px', fontFamily: 'sans-serif' }}>
        {step < dijkstraEvents.length
          ? "Dijkstra's Algorithm in progress..."
          : "Dijkstra's Algorithm complete!"}
      </div> */}
    </div>
  );
};

export default MazeDijkstra;
