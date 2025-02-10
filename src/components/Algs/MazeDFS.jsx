import React, { useState, useEffect, useMemo } from 'react';

const MazeDFS = ({ mazeUrl, resetCounter, start }) => {
  const [mazeStr, setMazeStr] = useState(null);
  const [step, setStep] = useState(0);

  // Fetch the maze once (or on mazeUrl change)
  useEffect(() => {
    fetch(mazeUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        const rows = text
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        setMazeStr(rows);
      })
      .catch((error) => console.error('Error loading maze:', error));
  }, [mazeUrl]);

  // Convert mazeStr into a grid (2D array of numbers)
  const grid = useMemo(() => {
    if (!mazeStr) return [];
    return mazeStr.map((row) => row.split('').map(Number));
  }, [mazeStr]);

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

  // DFS animation: advance one step every 50ms.
  useEffect(() => {
    if (step < dfsEvents.length & start == true) {
      const timeout = setTimeout(() => {
        setStep(prev => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [step, dfsEvents, start]);

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
      {!mazeStr && <div>Loading maze...</div>}
      {mazeStr &&
        grid.map((row, rIdx) => (
          <div key={rIdx} style={{ display: 'flex' }}>
            {row.map((cell, cIdx) => {
              const cellKey = `${rIdx},${cIdx}`;
              let background = 'white';
              if (cell === 1) {
                background = 'black';
              } else if (currentStack.includes(cellKey)) {
                background = currentStack[currentStack.length - 1] === cellKey
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
      <div style={{ marginTop: '10px', fontFamily: 'sans-serif' }}>
        {step < dfsEvents.length
          ? 'DFS Traversal in progress...'
          : 'DFS Traversal complete!'}
      </div>
    </div>
  );
};

export default MazeDFS;
