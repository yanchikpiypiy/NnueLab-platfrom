// GameAITechniquesPage.jsx
import React, { useState } from 'react';

// --- Dummy Game Tree ---
const dummyGameTree = {
  id: 'root',
  children: [
    {
      id: 'child1',
      children: [
        { id: 'child1-1', value: 3 },
        { id: 'child1-2', value: 5 },
      ],
    },
    {
      id: 'child2',
      children: [
        { id: 'child2-1', value: 2 },
        { id: 'child2-2', value: 9 },
      ],
    },
  ],
};

// --- Alpha-Beta Pruning ---
function runAlphaBeta(node, depth, alpha, beta, maximizingPlayer, counter) {
  counter.steps++;
  if (depth === 0 || !node.children) {
    return node.value !== undefined ? node.value : 0;
  }
  if (maximizingPlayer) {
    let value = -Infinity;
    for (const child of node.children) {
      const childVal = runAlphaBeta(child, depth - 1, alpha, beta, false, counter);
      value = Math.max(value, childVal);
      alpha = Math.max(alpha, value);
      if (beta <= alpha) break; // prune branch
    }
    return value;
  } else {
    let value = Infinity;
    for (const child of node.children) {
      const childVal = runAlphaBeta(child, depth - 1, alpha, beta, true, counter);
      value = Math.min(value, childVal);
      beta = Math.min(beta, value);
      if (beta <= alpha) break; // prune branch
    }
    return value;
  }
}

// --- Monte Carlo Tree Search (MCTS) ---
function simulatePlayout(node, counter) {
  counter.steps++;
  if (!node.children || node.children.length === 0) {
    return node.value !== undefined ? node.value : 0;
  }
  const randomIndex = Math.floor(Math.random() * node.children.length);
  return simulatePlayout(node.children[randomIndex], counter);
}

function runMCTS(node, iterations, counter) {
  let total = 0;
  for (let i = 0; i < iterations; i++) {
    total += simulatePlayout(node, counter);
  }
  return total / iterations;
}

const GameAITechniquesPage = () => {
  const [abMetrics, setAbMetrics] = useState(null);
  const [mctsMetrics, setMctsMetrics] = useState(null);
  const [running, setRunning] = useState(false);

  const runComparison = () => {
    setRunning(true);

    // Run Alpha-Beta with depth 2.
    const abCounter = { steps: 0 };
    const abStart = performance.now();
    const abEvaluation = runAlphaBeta(dummyGameTree, 2, -Infinity, Infinity, true, abCounter);
    const abRuntime = performance.now() - abStart;

    // Run MCTS with 100 iterations.
    const mctsCounter = { steps: 0 };
    const mctsStart = performance.now();
    const mctsEvaluation = runMCTS(dummyGameTree, 100, mctsCounter);
    const mctsRuntime = performance.now() - mctsStart;

    setAbMetrics({
      evaluation: abEvaluation,
      runtime: abRuntime,
      steps: abCounter.steps,
    });
    setMctsMetrics({
      evaluation: mctsEvaluation,
      runtime: mctsRuntime,
      steps: mctsCounter.steps,
    });
    setRunning(false);
  };

  // Render a minimalistic 8x8 chess board.
  const renderChessBoard = () => {
    const board = [];
    for (let i = 0; i < 8; i++) {
      const row = [];
      for (let j = 0; j < 8; j++) {
        const isDark = (i + j) % 2 === 1;
        row.push(
          <div
            key={j}
            className="w-10 h-10 border border-gray-400"
            style={{ backgroundColor: isDark ? '#769656' : '#eeeed2' }}
          ></div>
        );
      }
      board.push(
        <div key={i} className="flex">
          {row}
        </div>
      );
    }
    return board;
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="container mx-auto px-8 py-6 flex items-center">
        <div className="logo pb-2">
          <h2 className="text-2xl font-bold">Game AI Techniques</h2>
        </div>
        <nav className="pl-20">
          <ul className="flex space-x-6">
            <li>
              <a href="#overview" className="nav-link hover:text-gray-600">
                Overview
              </a>
            </li>
            <li>
              <a href="#algorithms" className="nav-link hover:text-gray-600">
                Algorithms
              </a>
            </li>
            <li>
              <a href="#demo" className="nav-link hover:text-gray-600">
                Demo
              </a>
            </li>
            <li>
              <a href="#benchmarks" className="nav-link hover:text-gray-600">
                Benchmarks
              </a>
            </li>
            <li>
              <a href="#docs" className="nav-link hover:text-gray-600">
                Docs
              </a>
            </li>
          </ul>
        </nav>
      </header>

      {/* Algorithm Overview Section */}
      <section id="algorithms" className="py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">Algorithm Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div
              className="p-6 border border-gray-200 rounded hover:shadow-lg transition duration-300"
            >
              <h3 className="text-2xl font-semibold mb-2">Alpha-Beta Pruning</h3>
              <p className="text-gray-700">
                A minimax search algorithm enhanced by alpha-beta pruning to reduce the number
                of nodes evaluated.
              </p>
            </div>
            <div
              className="p-6 border border-gray-200 rounded hover:shadow-lg transition duration-300"
            >
              <h3 className="text-2xl font-semibold mb-2">Monte Carlo Tree Search</h3>
              <p className="text-gray-700">
                A simulation-based method that uses random playouts to estimate the value of moves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-16 px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">Interactive Demo</h2>
          <div className="w-full flex flex-col items-center justify-center rounded bg-white shadow p-4">
            {renderChessBoard()}
          </div>
          <div className="mt-6 mx-auto w-full max-w-md flex justify-center">
            <button
              onClick={runComparison}
              className="bg-black text-white font-medium py-2 px-4 rounded hover:bg-gray-800 transition"
              disabled={running}
            >
              {running ? "Running Comparison..." : "Run Comparison"}
            </button>
          </div>
        </div>
      </section>

      {/* Benchmarks Section */}
      <section id="benchmarks" className="py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">Benchmark Results</h2>
          {abMetrics && mctsMetrics ? (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="border border-gray-200 p-3">Algorithm</th>
                  <th className="border border-gray-200 p-3">Evaluation</th>
                  <th className="border border-gray-200 p-3">Runtime (ms)</th>
                  <th className="border border-gray-200 p-3">Steps Taken</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 p-3">Alpha-Beta</td>
                  <td className="border border-gray-200 p-3">{abMetrics.evaluation}</td>
                  <td className="border border-gray-200 p-3">
                    {abMetrics.runtime.toFixed(5)}
                  </td>
                  <td className="border border-gray-200 p-3">{abMetrics.steps}</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3">MCTS</td>
                  <td className="border border-gray-200 p-3">{mctsMetrics.evaluation}</td>
                  <td className="border border-gray-200 p-3">
                    {mctsMetrics.runtime.toFixed(5)}
                  </td>
                  <td className="border border-gray-200 p-3">{mctsMetrics.steps}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="text-center">No benchmark data. Click "Run Comparison" to generate data.</p>
          )}
        </div>
      </section>

      {/* Documentation & Code Section */}
      <section id="docs" className="py-16 px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">Documentation & Code</h2>
          <p className="text-lg text-gray-700 mb-6 text-center">
            Find detailed pseudocode, implementation notes, and source code snippets for the game AI techniques.
          </p>
          <div className="flex justify-center">
            <a
              href="https://github.com/yourusername/game-ai-techniques"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-black text-white font-bold py-3 px-6 rounded hover:bg-gray-800 transition duration-300"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      <footer className="container mx-auto px-8 py-6 border-t border-gray-200 text-center">
        <p>&copy; 2025 Maze &amp; Game AI Project. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default GameAITechniquesPage;
