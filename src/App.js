// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './components/HomePage';
import MazeSolvingPage from './components/MazeSolvingPage';
import ChessGamePage from './components/ChessGamePage';
import DecisionTreePage from './components/DecisionTreePage/temp_storage/DecisionTreePage';
import pain from "./components/DecisionTreePage/temp_storage/pain"
import DecisionTreeImpPage from './components/DecisionTreePage/DecisionTreeImpPage';
import BSTVisualizer from './components/bst/BSTVisualizer';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/maze" element={<MazeSolvingPage />} />
        <Route path="/chess" element={<ChessGamePage />} />
        <Route path="/AITree"  element={< DecisionTreeImpPage/>}/>
        <Route path='fuck' element={<BSTVisualizer></BSTVisualizer>}/>
      </Routes>
    </Router>
  );
}

export default App;
