// HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css'; // We'll place our custom .DifferentCard_differentCard__UUiB8 CSS here
import Header from './Header';

function HomePage() {
  return (
    <div className="bg-black text-white min-h-screen">
      <Header />

      {/* Intro Section */}
      <section className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-green-500">
          My Chess Engine & NNUE Adventures
        </h1>
        <p className="max-w-2xl text-lg md:text-xl text-gray-300 mb-6 leading-relaxed">
          Welcome to our platform, where you can explore our chess and algorithm concepts in a guided, step-by-step manner.
        </p>
        <p className="max-w-2xl text-lg md:text-xl text-gray-300 mb-6 leading-relaxed">
          For a complete understanding, we recommend following this order:
          <br /><br />
          1. Start with the <span className="text-green-500">BST fundamentals</span> on the{' '}
          <Link 
            to="/bst" 
            className="text-red-500 font-bold underline"
          >
            /bst
          </Link>{' '}
          page.<br />
          2. Move on to the <span className="text-green-500">Minimax explanation</span> on the{' '}
          <Link 
            to="/minimax" 
            className="text-red-500 font-bold underline"
          >
            /minimax
          </Link>{' '}
          page.<br />
          3. Next, explore the <span className="text-green-500">NNUE mechanics</span> on the{' '}
          <Link 
            to="/nnue" 
            className="text-red-500 font-bold underline"
          >
            /nnue
          </Link>{' '}
          page.<br />
          4. Finally, dive into our visualization pages to see mazes and minimax decision trees in action.
        </p>
        <p className="max-w-2xl text-lg md:text-xl text-gray-300 mb-6 leading-relaxed">
          This platform was created to help you understand how NNUE is built and utilized in modern chess engines. Through interactive tutorials, detailed explanations, and engaging visualizations, we aim to demystify the mechanics behind NNUE and its impact on chess strategy.
        </p>
        <p className="max-w-2xl text-lg md:text-xl text-gray-300 mb-6 leading-relaxed">
          Moreover, our platform provides advanced visualization tools and benchmarks for mazes, allowing you to observe how different algorithms work and compare their performance under varying conditions.
        </p>
        <p className="max-w-2xl text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
          If you're specifically here for visualizations like the Maze or Minimax demos, feel free to click the "Dive In" button below to go directly to those pages.
        </p>
        <a
          href="#cards-section"
          className="inline-block bg-white text-black font-bold py-3 px-6 rounded hover:bg-gray-200 transition duration-300"
        >
          Dive In
        </a>
      </section>

      {/* Cards Section */}
      <section id="cards-section" className="py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 - Maze */}
          <Card
            imageUrl="tree.png"
            title="Maze Visualization"
            text="Explore our maze solving algorithms"
            link="/maze"
          />

          {/* Card 2 - Chess */}
          <Card
            imageUrl="fish.png"
            title="Chess Section"
            text="Play against various chess engines"
            link="/chess"
          />

          {/* Card 3 - Minimax */}
          <Card
            imageUrl="minimax.png"
            title="Minimax Visualization"
            text="Discover the decision tree in chess problems"
            link="/minimax"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-gray-800">
        <p className="text-gray-500">&copy; 2025 YourNameOrProject. All rights reserved.</p>
      </footer>
    </div>
  );
}

/**
 * Card Component
 * 
 * - Applies the .DifferentCard_differentCard__UUiB8 class for styling.
 * - Uses an <img> background overlay (with partial opacity).
 * - Keeps the plus icon in the bottom-right corner.
 */
function Card({ imageUrl, title, text, link }) {
  return (
    <a
      href={link}
      className="DifferentCard_differentCard__UUiB8 relative"
    >
      {/* Background Image */}
      <img
        src={imageUrl}
        alt={title}
        className="
          absolute inset-0 w-full h-full object-cover
          opacity-20 pointer-events-none
        "
      />
      {/* Text Content */}
      <div className="relative z-10">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-400">{text}</p>
      </div>
      {/* Circle with plus sign */}
      <div
        className="
          absolute bottom-6 right-6 w-10 h-10 flex items-center justify-center
          rounded-full border border-gray-600 text-white
        "
      >
        +
      </div>
    </a>
  );
}

export default HomePage;
