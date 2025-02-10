// HomePage.jsx
import React from 'react';
import './HomePage.css'
function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="container mx-auto px-8 py-6 flex items-center">
        <div className="logo pb-2">
          <h2 className="text-2xl font-bold">Maze &amp; Game AI</h2>
        </div>
        <nav className="pl-20">
          <ul className="flex space-x-6">
            <li>
              <a href="#maze-solving" className="nav-link hover:text-gray-600">
                Maze Solving
              </a>
            </li>
            <li>
              <a href="#chess-ai" className="nav-link hover:text-gray-600">
                Chess &amp; Game AI
              </a>
            </li>
            <li>
              <a href="#analysis" className="nav-link hover:text-gray-600">
                Analysis
              </a>
            </li>
            <li>
              <a href="#docs" className="nav-link hover:text-gray-600">
                Docs
              </a>
            </li>
            <li>
              <a href="#contact" className="nav-link hover:text-gray-600">
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </header>

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
