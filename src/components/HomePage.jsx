// HomePage.jsx
import React from 'react';
import './HomePage.css'; // We'll place our custom .DifferentCard_differentCard__UUiB8 CSS here
import Header from './Header';

function HomePage() {
  return (
    <div className="bg-black text-white min-h-screen">
      <Header />

      {/* Intro Section */}
      <section className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
          My Chess Engine & NNUE Adventures
        </h1>
        <p className="max-w-2xl text-lg md:text-xl text-gray-300 mb-6 leading-relaxed">
          {/* Replace with your own explanation about NNUE, etc. */}
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed a fermentum 
          lorem. Integer consequat bibendum lacus, vitae pulvinar ipsum lobortis in.
        </p>
        <p className="max-w-2xl text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
          {/* More placeholder text */}
          Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere 
          cubilia curae; Aenean sodales, sapien id venenatis laoreet, nunc dui 
          facilisis nisl, a dictum metus ex non enim.
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
            text="Purpose-built for puzzle solving"
            link="/maze"
          />

          {/* Card 2 - Chess */}
          <Card
            imageUrl="fish.png"
            title="Chess Section"
            text="Designed to move fast"
            link="/chess"
          />

          {/* Card 3 - Minimax */}
          <Card
            imageUrl="minimax.png"
            title="Minimax Visualization"
            text="Crafted to perfection"
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
