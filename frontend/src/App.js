// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './components/HomePage';
import MazeSolvingPage from './pages/Maze/MazeSolvingPage';
import ChessGamePage from './pages/ChessGame/ChessGamePage';
import DecisionTreeImpPage from './pages/ChessDecisionTree/DecisionTreePage';
import BSTVisualizer from './components/bstPage/BSTVisualizer';
import MinimaxPage from './components/MinimaxPage/MinimaxPage';
import NNUEPage from './components/NnnuePage/NnuePage';
function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/maze" element={<MazeSolvingPage />} />
                <Route path="/chess" element={<ChessGamePage />} />
                <Route path="/AITree" element={< DecisionTreeImpPage />} />
                <Route path='/bst' element={<BSTVisualizer></BSTVisualizer>} />
                <Route path='/minimax' element={<MinimaxPage></MinimaxPage>} />
                <Route path='/nnue' element={<NNUEPage></NNUEPage>} />
            </Routes>
        </Router>
    );
}

export default App;
