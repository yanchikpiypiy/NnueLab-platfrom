// HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css'; 
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
          Welcome to our platform, where you can explore chess concepts and algorithm visualizations in a guided, step-by-step manner.
        </p>
        
        {/* New "Choose Your Journey" Section */}
        <div className="flex flex-col md:flex-row gap-6 mt-8">
          <a
            href="/bst"
            className="inline-block bg-green-500 text-black font-bold py-3 px-6 rounded hover:bg-green-400 transition duration-300"
          >
            Guided Learning Path
          </a>
          <a
            href="#cards-section"
            className="inline-block bg-white text-black font-bold py-3 px-6 rounded hover:bg-gray-200 transition duration-300"
          >
            Quick Demos
          </a>
        </div>
        <p className="mt-4 max-w-2xl text-sm md:text-base text-gray-400 leading-relaxed">
          If you want to learn how to build a NNUE chess engine, start with our guided learning path – begin with BST fundamentals, move on to Minimax, and finish with NNUE mechanics.
        </p>
      </section>

      {/* Maze Visualizer Info Section */}
      <section className="flex flex-col items-center justify-center py-6 px-4 text-center">
        <p className="max-w-2xl text-lg md:text-xl text-gray-300 mb-6 leading-relaxed">
          Additionally, our platform offers an interactive <span className='text-red-500 font-extrabold'>Maze Visualizer</span> that lets you deepen your understanding of various algorithms. Explore different maze-solving strategies and compare performance in real-time!
        </p>
      </section>

      {/* Cards Section */}
      <section id="cards-section" className="py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 - Maze */}
          <Card
            imageUrl="alg.png"
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
            link="/AITree"
          />
        </div>
      </section>

      <section id="docs" className="py-16 px-8 bg-black">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center text-white">Documentation & Code</h2>
          <p className="text-lg text-gray-300 mb-6 text-center">
            Find detailed pseudocode, implementation notes, and source code snippets for every algorithm.
          </p>
          <div className="flex justify-center">
            <a
              href="https://github.com/yanchikpiypiy/final-year-project-frontend"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-black font-bold py-3 px-6 rounded hover:bg-gray-200 transition duration-300"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>
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
        className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
      />
      {/* Text Content */}
      <div className="relative z-10">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-400">{text}</p>
      </div>
      {/* Circle with plus sign */}
      <div
        className="absolute bottom-6 right-6 w-10 h-10 flex items-center justify-center rounded-full border border-gray-600 text-white"
      >
        +
      </div>
    </a>
  );
}

export default HomePage;
