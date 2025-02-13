// MazeSolvingPage.jsx 
import React, { useEffect, useState } from 'react';
import MazeBFS from './Algs/MazeBfs';
import MazeDFS from './Algs/MazeDFS';
import MazeDijkstra from './Algs/MazeDijkstra';
import MazeAStar from './Algs/MazeAStar';
import Benchmark from './BenchMarks/Benchmark';
import Header from './Header';
function MazeSolvingPage() {
  const [mazeData, setMazeData] = useState(null);
  const [resetCounter, setResetCounter] = useState(0);
  const [stopTraversal, setStopTraversal] = useState(true);
  const [mazeWidth, setMazeWidth] = useState(40);
  const [mazeHeight, setMazeHeight] = useState(20);
  const [alg, setAlg] = useState("DFS");

  // State to track which maze generation we are on.
  const [mazeGeneration, setMazeGeneration] = useState(0);

  // The maze URL uses the current dimensions.
  const mazeUrl = `http://localhost:8000/api/maze?width=${mazeWidth}&height=${mazeHeight}&tile=2`;

  const generateMaze = () => {
    fetch(mazeUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then(text => {
        const rows = text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        setMazeData(rows);
        // Increment the maze generation ID each time a new maze is generated.
        setMazeGeneration(prev => prev + 1);
      })
      .catch(error => console.error('Error fetching maze:', error));
  };

  useEffect(() => {
    generateMaze();
  }, []);

  const handleReset = () => {
    setResetCounter(prev => prev + 1);
  };

  const handleGen = () => {
    generateMaze();
  };

  const handleAlgChange = (alg) => {
    setAlg(alg);
  };

  const handleStop = () => {
    setStopTraversal(prev => !prev);
  };

  let context = <></>;
  if (alg === "DFS") {
    context = <MazeDFS mazeData={mazeData} resetCounter={resetCounter} startTraversal={stopTraversal} />;
  } else if (alg === "BFS") {
    context = <MazeBFS mazeData={mazeData} resetCounter={resetCounter} startTraversal={stopTraversal} />;
  } else if (alg === "Dijkstra") {
    context = <MazeDijkstra mazeData={mazeData} resetCounter={resetCounter} startTraversal={stopTraversal} />;
  } else if (alg === "A*") {
    context = <MazeAStar mazeData={mazeData} resetCounter={resetCounter} startTraversal={stopTraversal} />;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <Header></Header>

      {/* Algorithm Overview Section */}
      <section id="algorithms" className="py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">Algorithm Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-gray-200 rounded hover:shadow-lg transition duration-300" onClick={() => handleAlgChange("DFS")}>
              <h3 className="text-2xl font-semibold mb-2">Depth-First Search</h3>
              <p className="text-gray-700">
                A recursive approach that explores deeply before backtracking. Simple, yet may not always yield the optimal path.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded hover:shadow-lg transition duration-300" onClick={() => handleAlgChange("BFS")}>
              <h3 className="text-2xl font-semibold mb-2">Breadth-First Search</h3>
              <p className="text-gray-700">
                Begins with a node, then traverses all its adjacent nodes before moving deeper.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded hover:shadow-lg transition duration-300" onClick={() => handleAlgChange("A*")}>
              <h3 className="text-2xl font-semibold mb-2">A* Search</h3>
              <p className="text-gray-700">
                Combines path cost and heuristics for efficient, optimal path finding. Widely used in maze solving and robotics.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded hover:shadow-lg transition duration-300" onClick={() => handleAlgChange("Dijkstra")}>
              <h3 className="text-2xl font-semibold mb-2">Dijkstra Search</h3>
              <p className="text-gray-700">
                Explores paths uniformly to determine the shortest path. Computationally intensive for larger mazes.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded hover:shadow-lg transition duration-300">
              <h3 className="text-2xl font-semibold mb-2">Reinforcement Learning</h3>
              <p className="text-gray-700">
                Uses trial and error with rewards to learn optimal navigation policies over time. Adaptable but requires training.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-16 px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">Interactive Maze Demo</h2>
          <div className="w-full flex items-center justify-center rounded bg-white shadow p-4">
            {context}
          </div>
          <div className="mt-6 mx-auto w-full max-w-md">
            <div className="flex justify-center space-x-3 mb-4">
              <button onClick={handleGen} className="bg-black text-white font-medium py-2 px-4 rounded hover:bg-gray-800 transition">
                Generate
              </button>
              <button onClick={handleReset} className="bg-black text-white font-medium py-2 px-4 rounded hover:bg-gray-800 transition">
                Reset
              </button>
              <button onClick={handleStop} className={`py-2 px-4 font-medium rounded transition ${stopTraversal ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-300 text-black"}`}>
                {stopTraversal ? "Stop" : "Start"}
              </button>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <h3 className="text-lg font-semibold mb-3">Maze Settings</h3>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium text-sm mb-1">Width: {mazeWidth}</label>
                <input
                  type="range"
                  min="20"
                  max="40"
                  value={mazeWidth}
                  onChange={(e) => setMazeWidth(Number(e.target.value))}
                  className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-black"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium text-sm mb-1">Height: {mazeHeight}</label>
                <input
                  type="range"
                  min="20"
                  max="40"
                  value={mazeHeight}
                  onChange={(e) => setMazeHeight(Number(e.target.value))}
                  className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-black"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benchmarks Section */}
      <section id="benchmarks" className="py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <Benchmark mazeData={mazeData} mazeGeneration={mazeGeneration} />
        </div>
      </section>

      {/* Documentation & Code Section */}
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
