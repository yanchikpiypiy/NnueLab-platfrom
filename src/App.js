// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './components/HomePage';
import MazeSolvingPage from './components/MazeSolvingPage';
import ChessGamePage from './components/ChessGamePage';
import MultiPVChessBoard from './components/MultiPVChessBoard';
import DecisionTreePage from './components/DecisionTreePage/DecisionTreePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/maze" element={<MazeSolvingPage />} />
        <Route path="/chess" element={<ChessGamePage />} />
        <Route path="/AITree" element={< DecisionTreePage/>}/>
      </Routes>
    </Router>
  );
}

export default App;
