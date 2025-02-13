// HomePage.jsx
import React from 'react';
import './HomePage.css'
import Header from './Header';
function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <Header></Header>

      {/* Hero Section */}
      <section className="hero flex items-center justify-center h-screen text-center px-4">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-extrabold mb-4">
            Exploring Maze and Game Solving with AI
          </h1>
          <p className="text-xl mb-8">
            Discover how traditional maze–solving algorithms compare with modern AI approaches in solving mazes and games like chess.
            Interactive demos, benchmarking, and deep analysis await.
          </p>
          <a
            href="#analysis"
            className="inline-block bg-black text-white font-bold py-3 px-6 rounded hover:bg-gray-800 transition duration-300"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-8 py-6 border-t border-gray-200 text-center">
        <p>&copy; 2025 Maze &amp; Game AI Project. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default HomePage;
