// MazeSolvingPage.jsx
import MazeDFS from './Algs/MazeDFS';
import React, { useState } from 'react';

function MazeSolvingPage() {
  const [resetCounter, setResetCounter] = useState(0);
  const [stopTraversal, setStopTraversal] = useState(true);
  const [mazeWidth, setMazeWidth] = useState(40);
  const [mazeHeight, setMazeHeight] = useState(20);

  // The maze URL uses the current dimensions.
  // Maze width is capped at a maximum of 40.
  const mazeUrl = `http://localhost:8000/api/maze?width=${mazeWidth}&height=${mazeHeight}&tile=2`;

  const handleReset = () => {
    // Reset traversal: clear stop flag and increment resetCounter
    setStopTraversal(false);
    setResetCounter(prev => prev + 1);
  };

  const handleStop = () => {
    // Set the flag to stop DFS traversal.
    setStopTraversal((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="container mx-auto px-8 py-6 flex items-center">
        <div className="logo pb-2">
          <h2 className="text-2xl font-bold">Maze Solving Algorithms</h2>
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

      {/* Overview Section */}
      <section id="overview" className="py-16 px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold mb-4">Maze Solving with AI</h1>
          <p className="text-xl mb-8">
            Explore a range of maze-solving techniques—from classic search methods like DFS and A* to modern reinforcement learning approaches.
          </p>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-16 px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">Interactive Maze Demo</h2>
          {/* Maze Display */}
          <div className="w-full flex items-center justify-center rounded bg-white shadow p-4">
            <MazeDFS
              mazeUrl={mazeUrl}
              resetCounter={resetCounter}
              start={stopTraversal}
            />
          </div>
          {/* Control Panel under the Maze */}
          <div className="mt-8 flex flex-col items-center">
            <div className="flex space-x-4 mb-8">
              <button
                onClick={handleReset}
                className="bg-black text-white font-bold py-3 px-6 rounded hover:bg-gray-800 transition duration-300"
              >
                Reset Maze
              </button>
              <button
                onClick={handleStop}
                className="bg-red-600 text-white font-bold py-3 px-6 rounded hover:bg-red-700 transition duration-300"
              >
                {stopTraversal ? "Stop traversal" : "Start traversal"}
              </button>
            </div>
            <div className="w-full max-w-sm">
              <h3 className="text-xl font-bold mb-4 text-center">Maze Settings</h3>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Width: {mazeWidth}</label>
                {/* Maze width slider capped at 40 */}
                <input
                  type="range"
                  min="20"
                  max="40"
                  value={mazeWidth}
                  onChange={(e) => setMazeWidth(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Height: {mazeHeight}</label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={mazeHeight}
                  onChange={(e) => setMazeHeight(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional sections (Benchmarks, Docs, Footer, etc.) */}
      <section id="benchmarks" className="py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">Performance Benchmarks</h2>
          <div className="space-y-6">
            {/* Runtime Comparison */}
            <div className="p-6 border border-gray-200 rounded">
              <h3 className="text-xl font-semibold mb-2">Runtime Comparison</h3>
              <p className="text-gray-700">
                Compare how runtime scales for different maze complexities across algorithms.
              </p>
              {/* Chart placeholder */}
              <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center">
                <p className="text-gray-500">[Chart Placeholder]</p>
              </div>
            </div>
            {/* Path Optimality */}
            <div className="p-6 border border-gray-200 rounded">
              <h3 className="text-xl font-semibold mb-2">Path Optimality</h3>
              <p className="text-gray-700">
                Analyze the quality of the paths found by each algorithm in terms of length and efficiency.
              </p>
              {/* Chart placeholder */}
              <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center">
                <p className="text-gray-500">[Chart Placeholder]</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="docs" className="py-16 px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">Documentation & Code</h2>
          <p className="text-lg text-gray-700 mb-6 text-center">
            Find detailed pseudocode, implementation notes, and source code snippets for every algorithm.
          </p>
          <div className="flex justify-center">
            <a
              href="https://github.com/yourusername/maze-game-ai"
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
}

export default MazeSolvingPage;
