import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header'; // Adjust the path to your Header component

function MinimaxPage() {
  return (
    <div className="bg-black text-white min-h-screen">
      {/* Page Header */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16 space-y-16">
        {/* Top Navigation Row */}
        <div className="flex justify-between items-center px-8">
          <Link
            to="/bst"
            className="group text-red-500 underline hover:text-red-700 transition-all duration-200"
          >
            <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">
              ←
            </span>{" "}
            Previous: BST
          </Link>
          <Link
            to="/nnue"
            className="group text-red-500 underline hover:text-red-700 transition-all duration-200"
          >
            Next: NNUE{" "}
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        {/* Title Section */}
        <section className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
            The <span className="text-green-500">Minimax Algorithm</span> in Chess
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-300 leading-relaxed">
            Experience how this core algorithm navigates the complex world 
            of <span className="text-green-500">turn-based strategy</span>, 
            ensuring optimal moves by balancing risk and reward.
          </p>
        </section>

        {/* Zigzag Section 1 */}
        <section className="md:grid md:grid-cols-2 md:gap-12 items-center">
          {/* Left Block */}
          <div className="mb-8 md:mb-0">
            <h2 className="text-2xl font-bold mb-4">
              What is <span className="text-green-500">Minimax?</span>
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              At its core, <span className="text-green-500">Minimax</span> is a 
              decision-making algorithm used in <span className="text-green-500">Chess</span>, 
              Checkers, and other turn-based games. One player tries to 
              <span className="text-green-500"> maximize</span> their advantage 
              (score), while the other tries to <span className="text-green-500">minimize</span> it. By exhaustively exploring possible moves and their 
              counter-moves, the algorithm approximates the best strategy 
              from a given board state.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Though it sounds straightforward, exploring every possible move 
              quickly becomes enormous. Hence, modern implementations rely on 
              <span className="text-green-500"> heuristics and optimizations</span> 
              to handle the vast complexity of Chess.
            </p>
          </div>

          {/* Right Block */}
          <div className="bg-gray-900 p-6 rounded-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">Core Concept</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>
                **Maximizing Player (White)**: Strives to improve the board 
                evaluation.
              </li>
              <li>
                **Minimizing Player (Black)**: Counters moves to reduce White’s 
                advantage.
              </li>
              <li>
                **Optimal Play**: Both sides are assumed to play flawlessly.
              </li>
              <li>
                **Recursive Exploration**: Searches deeper levels for best 
                possible moves.
              </li>
            </ul>
          </div>
        </section>

        {/* Zigzag Section 2 (reversed on md+ screens) */}
        <section className="md:grid md:grid-cols-2 md:gap-12 items-center md:grid-flow-col-dense">
          {/* Left Block (will appear on the right in larger screens due to order) */}
          <div className="md:col-start-2 mb-8 md:mb-0">
            <h2 className="text-2xl font-bold mb-4">
              <span className="text-green-500">Minimax</span> in Chess
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              In Chess, each move branches into multiple responses. 
              By exploring these branching moves, the algorithm 
              identifies lines of play that most benefit White (if 
              White is the maximizing player). <span className="text-green-500">
              Board evaluations</span> often account for piece material, king 
              safety, pawn structure, and positional factors.
            </p>
            <p className="text-gray-300 leading-relaxed">
              To manage the immense complexity of real games, engines incorporate 
              <span className="text-green-500"> alpha-beta pruning</span>, 
              <span className="text-green-500"> iterative deepening</span>, 
              and advanced heuristics. These refinements prune unpromising 
              branches, allowing the computer to search deeper within 
              strict time constraints.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Our platform supports visualization of a minimax tree on a specific chess problem. You can see all the moves on the board on the&nbsp;
              <a 
                href="/AITree" 
                className="text-red-500 font-bold underline" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                AITree page
              </a>.
            </p>
          </div>

          {/* Right Block (will appear on the left in larger screens) */}
          <div className="bg-gray-900 p-6 rounded-md shadow-lg md:col-start-1">
            <h3 className="text-xl font-bold mb-4">Key Techniques</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>
                **Alpha-Beta Pruning**: Skips branches that cannot influence 
                the final decision.
              </li>
              <li>
                **Iterative Deepening**: Searches shallow levels first, then 
                progressively deeper.
              </li>
              <li>
                **Heuristic Evaluation**: Assigns value to positions based on 
                known “best practices.”
              </li>
              <li>
                **Move Ordering**: Tests the most promising moves earlier to 
                optimize pruning.
              </li>
            </ul>
          </div>
        </section>

        {/* Simple Inline SVG Minimax Graph with Chess Moves */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-center">
            Sample Minimax Tree
          </h2>
          <p className="text-gray-300 leading-relaxed max-w-2xl mx-auto mb-6 text-center">
            A tiny slice of a chess move tree showing White’s initial move 
            choices (<span className="text-green-500">1. e4</span>, for example), 
            Black’s responses (<span className="text-green-500">1... c5</span> or 
            <span className="text-green-500">1... e6</span>), and so on. 
            Real engines search far deeper, but this diagram highlights the 
            alternating structure of <span className="text-green-500">Minimax</span>.
          </p>

          <div className="flex justify-center">
            <svg
              width="600"
              height="400"
              viewBox="0 0 600 400"
              className="mx-auto border border-gray-700 rounded shadow-lg bg-gray-800"
            >
              {/* Lines from root to children */}
              <line x1="300" y1="70" x2="150" y2="130" stroke="white" strokeWidth="2" />
              <line x1="300" y1="70" x2="450" y2="130" stroke="white" strokeWidth="2" />

              {/* Lines from child A to grandchildren */}
              <line x1="150" y1="170" x2="50" y2="230" stroke="white" strokeWidth="2" />
              <line x1="150" y1="170" x2="250" y2="230" stroke="white" strokeWidth="2" />

              {/* Lines from child B to grandchildren */}
              <line x1="450" y1="170" x2="350" y2="230" stroke="white" strokeWidth="2" />
              <line x1="450" y1="170" x2="550" y2="230" stroke="white" strokeWidth="2" />

              {/* Root Node (White Move) */}
              <circle cx="300" cy="50" r="20" fill="#111827" stroke="white" strokeWidth="2" />
              <text
                x="300"
                y="55"
                fill="white"
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
              >
                1. e4
              </text>

              {/* Child Node A (Black response) */}
              <circle cx="150" cy="150" r="20" fill="#111827" stroke="white" strokeWidth="2" />
              <text
                x="150"
                y="155"
                fill="white"
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
              >
                1... e6
              </text>

              {/* Child Node B (Black response) */}
              <circle cx="450" cy="150" r="20" fill="#111827" stroke="white" strokeWidth="2" />
              <text
                x="450"
                y="155"
                fill="white"
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
              >
                1... c5
              </text>

              {/* Grandchild Nodes (White's next moves) */}
              <circle cx="50" cy="250" r="20" fill="#111827" stroke="white" strokeWidth="2" />
              <text
                x="50"
                y="255"
                fill="white"
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
              >
                2. d4
              </text>

              <circle cx="250" cy="250" r="20" fill="#111827" stroke="white" strokeWidth="2" />
              <text
                x="250"
                y="255"
                fill="white"
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
              >
                2. Nf3
              </text>

              <circle cx="350" cy="250" r="20" fill="#111827" stroke="white" strokeWidth="2" />
              <text
                x="350"
                y="255"
                fill="white"
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
              >
                2. d4
              </text>

              <circle cx="550" cy="250" r="20" fill="#111827" stroke="white" strokeWidth="2" />
              <text
                x="550"
                y="255"
                fill="white"
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
              >
                2. Nc3
              </text>
            </svg>
          </div>
        </section>

        {/* Bottom Navigation Row */}
        <div className="flex justify-between items-center px-8">
          <Link
            to="/bst"
            className="group text-red-500 underline hover:text-red-700 transition-all duration-200"
          >
            <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">
              ←
            </span>{" "}
            Previous: BST
          </Link>
          <Link
            to="/nnue"
            className="group text-red-500 underline hover:text-red-700 transition-all duration-200"
          >
            Next: NNUE{" "}
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </main>

      <footer className="text-center py-6 border-t border-gray-800">
        <p className="text-gray-500">
          &copy; 2025 YourNameOrProject. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default MinimaxPage;
