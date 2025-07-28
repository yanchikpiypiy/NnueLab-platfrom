import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header'; 

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
            Discover how <span className="text-green-500">Minimax</span> and{" "}
            <span className="text-green-500">tree searches</span> power a
            cutting-edge <span className="text-green-500">neural-network evaluation</span> to deliver world-class performance.
          </p>
        </section>

        {/* Zigzag Section 1: Explaining NNUE concept, relation to Minimax and BST */}
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

        {/* Zigzag Section 2 (reversed on md+ screens): More details on how the engine uses NNUE */}
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
            <h3 className="text-xl font-bold mb-4">Key Techniques</h3>
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

        {/* NNUE Architecture & Overview Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-center">
            NNUE Architecture &amp; Overview
          </h2>
          <p className="text-gray-300 leading-relaxed max-w-2xl mx-auto mb-6 text-center">
            Here is an overview of the <span className="text-green-500">NNUE architecture</span>. It provides a look into how <span className="text-green-500">Stockfish</span> uses its <span className="text-green-500">neural network</span> to evaluate board positions.
          </p>
          <div className="flex justify-center">
            <img 
              src="/SFNN.svg" 
              alt="Stockfish NNUE Diagram" 
              className="mx-auto w-2/5"
            />
          </div>
          <div className="max-w-4xl mx-auto mt-8 space-y-12">
            <p className="text-gray-300 leading-relaxed text-center">
              The <span className="text-green-500">HALFKP2</span> architecture is a variant of <span className="text-green-500">NNUE</span> designed for optimal efficiency and rapid updates. It begins with advanced <span className="text-green-500">feature extraction</span> where raw board positions are transformed into numerical input vectors via precise <span className="text-green-500">feature engineering</span>. These inputs are then processed through <span className="text-green-500">dense layers</span> that capture complex board dynamics, while <span className="text-green-500">accumulators</span> cache intermediate activations for swift incremental updates. Furthermore, <span className="text-green-500">shifting</span> normalizes the data and <span className="text-green-500">clamping</span> ensures numerical stability, collectively enabling a robust and high-performance evaluation engine.
            </p>

            {/* Accumulators */}
            <div className="flex flex-col md:flex-row items-start gap-6 bg-gray-900 p-6 rounded-md shadow-lg">
              <div className="md:w-1/2">
                <h3 className="text-xl font-bold text-green-500">Accumulators</h3>
                <h4 className="font-bold mt-2">What They Are</h4>
                <p className="text-gray-300">
                  Accumulators are components that store intermediate neural activations. They cache partial sums and results from earlier layers to avoid redundant computations.
                </p>
              </div>
              <div className="md:w-1/2">
                <h4 className="font-bold mt-2">How They’re Used</h4>
                <p className="text-gray-300">
                  In HALFKP2, accumulators enable incremental updates. When only a few pieces change on the board, the engine reuses stored activations instead of recalculating the entire network, thus saving precious computation time.
                </p>
              </div>
            </div>

            {/* Dense Layers */}
            <div className="flex flex-col md:flex-row items-start gap-6 bg-gray-900 p-6 rounded-md shadow-lg">
              <div className="md:w-1/2">
                <h3 className="text-xl font-bold text-green-500">Dense Layers</h3>
                <h4 className="font-bold mt-2">What They Are</h4>
                <p className="text-gray-300">
                  Dense layers, also known as fully connected layers, connect every neuron from the previous layer to each neuron in the current layer. They perform linear transformations followed by non-linear activations.
                </p>
              </div>
              <div className="md:w-1/2">
                <h4 className="font-bold mt-2">How They’re Used</h4>
                <p className="text-gray-300">
                  In HALFKP2, dense layers transform the extracted features into higher-level abstractions. They capture complex patterns in the chessboard and build the foundation for accurate position evaluations.
                </p>
              </div>
            </div>

            {/* Shifting */}
            <div className="flex flex-col md:flex-row items-start gap-6 bg-gray-900 p-6 rounded-md shadow-lg">
              <div className="md:w-1/2">
                <h3 className="text-xl font-bold text-green-500">Shifting</h3>
                <h4 className="font-bold mt-2">What It Is</h4>
                <p className="text-gray-300">
                  Shifting is the operation of adjusting numerical values. It can involve bias addition or bit-shifting, which effectively re-centers and scales activations.
                </p>
              </div>
              <div className="md:w-1/2">
                <h4 className="font-bold mt-2">How It’s Used</h4>
                <p className="text-gray-300">
                  In HALFKP2, shifting normalizes the outputs from each layer, ensuring that the values fall within an optimal range. This helps improve convergence during training and maintains precision in fixed-point arithmetic.
                </p>
              </div>
            </div>

            {/* Clamping */}
            <div className="flex flex-col md:flex-row items-start gap-6 bg-gray-900 p-6 rounded-md shadow-lg">
              <div className="md:w-1/2">
                <h3 className="text-xl font-bold text-green-500">Clamping</h3>
                <h4 className="font-bold mt-2">What It Is</h4>
                <p className="text-gray-300">
                  Clamping is the process of restricting values to a specific range. It ensures that outputs from neurons do not exceed predefined limits.
                </p>
              </div>
              <div className="md:w-1/2">
                <h4 className="font-bold mt-2">How It’s Used</h4>
                <p className="text-gray-300">
                  In HALFKP2, clamping is applied after activations to prevent extreme values, maintaining numerical stability and preventing saturation. This control is essential for consistent and reliable evaluations.
                </p>
              </div>
            </div>
            
            <p className="text-gray-300 leading-relaxed text-center">
              Overall, the integration of these techniques—robust feature extraction, optimized <span className="text-green-500">dense layers</span>, dynamic <span className="text-green-500">accumulators</span>, and precise <span className="text-green-500">shifting</span> and <span className="text-green-500">clamping</span> operations—allows the HALFKP2 architecture to deliver rapid, incremental updates and high-accuracy evaluations, even during deep searches.
            </p>
          </div>
        </section>

        {/* HALFKAV2 Architecture & Overview Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-center">
            HALFKAV2 Architecture &amp; Overview
          </h2>
          <div className="max-w-4xl mx-auto mt-8 space-y-12">
            <p className="text-gray-300 leading-relaxed text-center">
              The <span className="text-green-500">HALFKAV2</span> architecture builds upon the principles of NNUE and HALFKP2, but is specifically designed to be more space-efficient. It achieves this by incorporating a <span className="text-green-500">bucketing</span> strategy that groups similar features together, saving valuable memory on a PC.
            </p>
            <div className="flex justify-center">
              <img 
                src="/SFNN2.svg" 
                alt="Stockfish HALFKAV2 Diagram" 
                className="mx-auto w"
              />
            </div>
            <p className="text-gray-300 leading-relaxed text-center">
              In <span className="text-green-500">HALFKAV2</span>, <span className="text-green-500">bucketing</span> is employed to reduce the overall memory footprint by grouping similar activations and features into discrete buckets. This approach streamlines the evaluation process by allowing the network to approximate computations using pre-computed bucket values, thereby enhancing performance.
            </p>
            <div className="flex flex-col md:flex-row items-start gap-6 bg-gray-900 p-6 rounded-md shadow-lg">
              <div className="md:w-1/2">
                <h3 className="text-xl font-bold text-green-500">Bucketing</h3>
                <h4 className="font-bold mt-2">What It Is</h4>
                <p className="text-gray-300">
                  Bucketing is a technique that groups similar neural activations and features into predefined intervals or buckets. This quantization simplifies the range of values the network must process.
                </p>
              </div>
              <div className="md:w-1/2">
                <h4 className="font-bold mt-2">How It Improves Performance</h4>
                <p className="text-gray-300">
                  In HALFKAV2, bucketing reduces memory usage and speeds up evaluations by allowing the network to substitute complex computations with pre-computed bucket values. This not only saves space on a PC but also accelerates processing, enhancing overall performance.
                </p>
              </div>
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
            This blend of classic and modern AI techniques shows that there is always room for improvement in game-playing algorithms.
          </p>
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

      <footer className="text-center py-6 border-t border-gray-800">
        <p className="text-gray-500">
          &copy; 2025 YourNameOrProject. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default NNUEPage;
