import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header'; // Adjust the path to your Header component

function NNUEPage() {
  return (
    <div className="bg-black text-white min-h-screen">
      {/* Page Header */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16 space-y-16">
        {/* Top Navigation Row */}
        <div className="flex justify-between items-center px-8">
          <Link
            to="/minimax"
            className="group text-red-500 underline hover:text-red-700 transition-all duration-200"
          >
            <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">
              ←
            </span>{" "}
            Previous: Minimax
          </Link>
          <Link
            to="/chess"
            className="group text-red-500 underline hover:text-red-700 transition-all duration-200"
          >
            Next: Chess{" "}
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        {/* Title Section */}
        <section className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
            <span className="text-green-500">NNUE</span> in Stockfish
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-300 leading-relaxed">
            Discover how <span className="text-green-500">Minimax</span> and 
            <span className="text-green-500"> tree searches</span> power a 
            cutting-edge <span className="text-green-500">neural-network 
            evaluation</span> to deliver world-class performance.
          </p>
        </section>

        {/*
          Zigzag Section 1:
          Explaining NNUE concept, relation to Minimax and BST 
        */}
        <section className="md:grid md:grid-cols-2 md:gap-12 items-center">
          {/* Left Block */}
          <div className="mb-8 md:mb-0">
            <h2 className="text-2xl font-bold mb-4">
              What is <span className="text-green-500">NNUE</span>?
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              <span className="text-green-500">NNUE</span> (efficiently 
              updatable neural network) is a revolutionary evaluation 
              method integrated into Stockfish. Unlike classic evaluation 
              functions that rely solely on handcrafted heuristics, 
              NNUE uses a neural network to assess board positions more 
              accurately, especially in <span className="text-green-500">
              complex or non-traditional</span> positions.
            </p>
            <p className="text-gray-300 leading-relaxed">
              This network is incrementally updated to reflect changes 
              in piece placement. The result? Faster and more <span className="text-green-500">
              nuanced</span> evaluations that push engine performance 
              beyond traditional boundaries.
            </p>
          </div>

          {/* Right Block */}
          <div className="bg-gray-900 p-6 rounded-md shadow-lg">
            <h3 className="text-xl font-bold mb-4">Relation to Minimax &amp; BST</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>
                <strong>Minimax Backbone</strong>: Stockfish still uses a minimax 
                (with alpha-beta pruning) search under the hood.
              </li>
              <li>
                <strong>BST-Like Tree</strong>: Moves are explored in a branching 
                structure (akin to a <span className="text-green-500">
                binary search tree</span>) to find the best line of play.
              </li>
              <li>
                <strong>Neural Evaluation</strong>: Instead of using a purely 
                handcrafted evaluation function, the engine integrates 
                the <span className="text-green-500">NNUE</span> network 
                for refined scoring.
              </li>
              <li>
                <strong>Faster Updates</strong>: Incremental updates let the engine 
                apply the NN quickly to each new position in the tree.
              </li>
            </ul>
          </div>
        </section>

        {/*
          Zigzag Section 2 (reversed on md+ screens):
          More details on how the engine uses NNUE 
        */}
        <section className="md:grid md:grid-cols-2 md:gap-12 items-center md:grid-flow-col-dense">
          {/* Left Block (will appear on the right in larger screens due to order) */}
          <div className="md:col-start-2 mb-8 md:mb-0">
            <h2 className="text-2xl font-bold mb-4">
              How <span className="text-green-500">Stockfish</span> Uses NNUE
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Stockfish integrates <span className="text-green-500">NNUE</span> 
              by replacing its classical “hand-tuned” evaluation with a neural 
              network. This network is trained on millions of positions, allowing 
              it to refine its scoring in scenarios where heuristics alone 
              might fall short.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Once integrated, every node on the <span className="text-green-500">
              search tree</span> (or partial BST) is assigned a more intelligent 
              score. Paired with techniques like <span className="text-green-500">
              alpha-beta pruning</span> and <span className="text-green-500">
              iterative deepening</span>, this approach yields a powerful 
              synergy—focusing computational power on only the most promising 
              moves, all while delivering deeper, more accurate evaluations.
            </p>
          </div>

          {/* Right Block (will appear on the left in larger screens) */}
          <div className="bg-gray-900 p-6 rounded-md shadow-lg md:col-start-1">
            <h3 className="text-xl font-bold mb-4">Key Takeaways</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>
                <strong>Neural Scoring</strong>: Deep learning model guides the 
                evaluation, offering richer strategic insights.
              </li>
              <li>
                <strong>Efficient Updates</strong>: The network updates incrementally, 
                maintaining speed in a deep search.
              </li>
              <li>
                <strong>Minimax + NNUE</strong>: Classic search algorithms combined 
                with advanced evaluation for state-of-the-art results.
              </li>
              <li>
                <strong>Continuous Evolution</strong>: Regular updates improve 
                the network’s strength over time.
              </li>
            </ul>
          </div>
        </section>

        {/* Placeholder Section for Graphs */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-center">
            NNUE Architecture &amp; Performance
          </h2>
          <p className="text-gray-300 leading-relaxed max-w-2xl mx-auto mb-6 text-center">
            Below, you could showcase diagrams or graphs illustrating 
            <span className="text-green-500"> NNUE's internal layers</span>, 
            incremental updates, or performance comparisons across 
            different versions of Stockfish.
          </p>

          {/* Replace the following DIV with your actual graph components or custom SVGs */}
          <div className="flex justify-center">
            <img 
              src="/SFNN.svg" 
              alt="Stockfish NNUE Diagram" 
              className="mx-auto w-1/3"
            />
          </div>

          <div className="mt-6 flex justify-center">
            <div className="w-full max-w-xl h-64 bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500">
              {/* Placeholder for Graph #2 */}
              <span>Graph or Diagram Placeholder 2</span>
            </div>
          </div>
        </section>

        {/* Closing Thoughts Section */}
        <section className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">
            Why It Matters
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            The fusion of <span className="text-green-500">Minimax</span>, 
            tree-based search structures, and <span className="text-green-500">
            NNUE</span> has propelled Stockfish to new heights. 
            By leveraging a neural network for evaluations, Stockfish 
            can handle complex, unorthodox positions more accurately, 
            all while maintaining its hallmark speed and efficiency.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            This blend of classical and modern AI approaches illustrates 
            a broader trend in <span className="text-green-500">
            game-playing algorithms</span>—showing us that even after 
            decades of research, there’s still plenty of room to refine 
            and reinvent how machines “think” about Chess.
          </p>

          {/* Mention the NNUE Resource in a visible, red color */}
          <p className="text-gray-300 leading-relaxed">
            For one of the best resources on NNUE development, check out{' '}
            <a 
              href="https://github.com/official-stockfish/nnue-pytorch/blob/master/docs/nnue.md" 
              className="text-red-500 font-bold underline" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              this comprehensive guide
            </a>.
          </p>
        </section>

        {/* Bottom Navigation Row */}
        <div className="flex justify-between items-center px-8">
          <Link
            to="/minimax"
            className="group text-red-500 underline hover:text-red-700 transition-all duration-200"
          >
            <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">
              ←
            </span>{" "}
            Previous: Minimax
          </Link>
          <Link
            to="/chess"
            className="group text-red-500 underline hover:text-red-700 transition-all duration-200"
          >
            Next: Chess{" "}
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-gray-800">
        <p className="text-gray-500">&copy; 2025 YourNameOrProject. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default NNUEPage;
