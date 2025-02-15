// ChessGamePageWithImages.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import Header from './Header';
import StockfishEngine from './engine/StockFishEngine'; // Import our updated Stockfish component

// Mapping for chess piece image paths. Adjust paths as needed.
const pieceImages = {
  wK: '/images/chess/wK.png',
  wQ: '/images/chess/wQ.png',
  wR: '/images/chess/wR.png',
  wB: '/images/chess/wB.png',
  wN: '/images/chess/wN.png',
  wP: '/images/chess/wP.png',
  bK: '/images/chess/bK.png',
  bQ: '/images/chess/bQ.png',
  bR: '/images/chess/bR.png',
  bB: '/images/chess/bB.png',
  bN: '/images/chess/bN.png',
  bP: '/images/chess/bP.png',
};

const ChessGamePageWithImages = () => {
  // Create and store the Chess instance.
  const gameRef = useRef(new Chess());
  // Board state derived from chess.js.
  const [board, setBoard] = useState(gameRef.current.board());
  // Selected square in algebraic notation (e.g., "e2").
  const [selected, setSelected] = useState(null);
  // Legal moves for the selected piece.
  const [legalMoves, setLegalMoves] = useState([]);
  // Message for game status.
  const [message, setMessage] = useState('');
  // Move history (array of SAN strings).
  const [moveHistory, setMoveHistory] = useState([]);
  // Timer states (in seconds); starting with 5 minutes (300 seconds) each.
  const [whiteTime, setWhiteTime] = useState(300);
  const [blackTime, setBlackTime] = useState(300);
  // When set, triggers the StockfishEngine to compute a move.
  // Null means no pending engine move.
  const [engineFen, setEngineFen] = useState(null);

  // Determine active color ('w' for human, 'b' for Stockfish).
  const activeColor = gameRef.current.turn();

  // Update the active player's timer every second.
  useEffect(() => {
    const timer = setInterval(() => {
      if (gameRef.current.isGameOver()) {
        clearInterval(timer);
        return;
      }
      if (activeColor === 'w') {
        setWhiteTime(prev => (prev > 0 ? prev - 1 : 0));
      } else {
        setBlackTime(prev => (prev > 0 ? prev - 1 : 0));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeColor]);

  // Convert board coordinates (row, col) to algebraic notation.
  const convertToSquare = (row, col) => {
    const files = 'abcdefgh';
    return `${files[col]}${8 - row}`;
  };

  // Handle square click for human moves.
  const handleSquareClick = (row, col) => {
    const square = convertToSquare(row, col);
    if (selected) {
      if (legalMoves.includes(square)) {
        const move = gameRef.current.move({ from: selected, to: square, promotion: 'q' });
        if (move) {
          setBoard(gameRef.current.board());
          setMoveHistory(gameRef.current.history());
          setMessage('');
          if (gameRef.current.isCheckmate()) {
            setMessage('Checkmate!');
          } else if (gameRef.current.isStalemate()) {
            setMessage('Stalemate!');
          } else if (gameRef.current.isCheck()) {
            setMessage('Check!');
          }
        } else {
          setMessage('Illegal move!');
        }
      }
      setSelected(null);
      setLegalMoves([]);
    } else {
      // No piece is selected.
      const moves = gameRef.current.moves({ square, verbose: true });
      if (moves.length > 0) {
        setSelected(square);
        setLegalMoves(moves.map(m => m.to));
      }
    }
  };

  // Memoized callback for handling Stockfish's best move.
  const handleEngineBestMove = useCallback((bestMove) => {
    console.log("handleEngineBestMove triggered with:", bestMove);
    const from = bestMove.substring(0, 2);
    const to = bestMove.substring(2, 4);
    const move = gameRef.current.move({ from, to, promotion: 'q' });
    if (move) {
      setBoard(gameRef.current.board());
      setMoveHistory(gameRef.current.history());
      if (gameRef.current.isCheckmate()) {
        setMessage('Checkmate!');
      } else if (gameRef.current.isStalemate()) {
        setMessage('Stalemate!');
      } else if (gameRef.current.isCheck()) {
        setMessage('Check!');
      }
    }
    // Clear the engine request.
    setEngineFen(null);
  }, []);

  // Request Stockfish to calculate the best move.
  const requestStockfishMove = () => {
    const fen = gameRef.current.fen();
    console.log("Requesting Stockfish move for FEN:", fen);
    setEngineFen(fen);
  };

  // Automatically trigger engine move if it's Stockfish's turn.
  useEffect(() => {
    // Assuming Stockfish plays as Black.
    if (gameRef.current.turn() === 'b' && engineFen === null && !gameRef.current.isGameOver()) {
      // Adding a slight delay can sometimes help with smoother transitions.
      const timeout = setTimeout(() => {
        requestStockfishMove();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [board, engineFen]);

  // Reset the game.
  const resetGame = () => {
    gameRef.current.reset();
    setBoard(gameRef.current.board());
    setSelected(null);
    setLegalMoves([]);
    setMessage('');
    setMoveHistory([]);
    setWhiteTime(300);
    setBlackTime(300);
    setEngineFen(null);
  };

  // Render the chess board as an 8x8 grid.
  const renderChessBoard = () => {
    const rows = [];
    for (let i = 0; i < 8; i++) {
      const cells = [];
      for (let j = 0; j < 8; j++) {
        const isDark = (i + j) % 2 === 1;
        const pieceObj = board[i][j];
        let displayPiece = null;
        if (pieceObj) {
          // Build key like "wK" from piece color and uppercase type.
          const key = `${pieceObj.color}${pieceObj.type.toUpperCase()}`;
          displayPiece = (
            <img
              src={pieceImages[key]}
              alt={key}
              className="w-16 h-16 object-contain"
            />
          );
        }
        const square = convertToSquare(i, j);
        const isLegal = legalMoves.includes(square);
        const isSelected = selected === square;
        cells.push(
          <div
            key={j}
            onClick={() => handleSquareClick(i, j)}
            className={`w-20 h-20 flex items-center justify-center border border-gray-300 cursor-pointer transition transform hover:scale-105
              ${isDark ? 'bg-[#769656]' : 'bg-[#eeeed2]'}
              ${isLegal ? 'ring-2 ring-blue-400' : ''} 
              ${isSelected ? 'ring-2 ring-yellow-400' : ''}`}
          >
            {displayPiece}
          </div>
        );
      }
      rows.push(
        <div key={i} className="flex">
          {cells}
        </div>
      );
    }
    return rows;
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 text-gray-900">
      {/* Header with Title */}
      <Header />

      {/* Main Content: Board on left, Sidebar on right */}
      <main className="container mx-auto px-8 py-8 flex flex-col md:flex-row gap-8">
        {/* Chess Board Section */}
        <section className="w-full md:w-2/3 bg-white shadow-lg rounded-lg p-8">
          <h3 className="text-3xl font-bold text-center mb-6">Interactive Chess Game</h3>
          <div className="flex flex-col items-center">{renderChessBoard()}</div>
          {message && <div className="mt-4 text-center text-red-500 text-xl">{message}</div>}
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={resetGame}
              className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition"
            >
              Reset Game
            </button>
            <button
              onClick={() => {
                setSelected(null);
                setLegalMoves([]);
                setMessage('');
              }}
              className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition"
            >
              Clear Selection
            </button>
          </div>
        </section>

        {/* Sidebar: Timers and Move History */}
        <aside className="w-full md:w-1/3 bg-white shadow-lg rounded-lg p-8 flex flex-col">
          <h3 className="text-3xl font-bold mb-6">Status</h3>
          <div className="mb-6">
            <div className="text-2xl">White: {whiteTime}s</div>
            <div className="text-2xl">Black: {blackTime}s</div>
          </div>
          <h3 className="text-2xl font-bold mb-4">Move History</h3>
          <div className="flex-1 overflow-y-auto border p-4 rounded">
            {moveHistory.length === 0 ? (
              <p className="text-gray-500 italic">No moves yet.</p>
            ) : (
              moveHistory.map((move, index) => (
                <div key={index} className="text-lg">
                  {index % 2 === 0 ? `${Math.floor(index / 2) + 1}. ` : ''}{move}
                </div>
              ))
            )}
          </div>
        </aside>
      </main>

      {/* Always render the StockfishEngine component */}
      <StockfishEngine fen={engineFen} onBestMove={handleEngineBestMove} />

      {/* Documentation Section */}
      <section id="docs" className="py-16 px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Documentation & Code</h2>
          <p className="text-lg text-gray-700 mb-6">
            This chess game uses chess.js for full game logic, including move generation, check, checkmate,
            castling, en passant, and promotion. Chess piece images provide a polished look, and the sidebar displays
            timers and a full move history. Stockfish is integrated via a web worker for computing moves.
          </p>
          <a
            href="https://github.com/yourusername/chess-game-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-black text-white font-bold py-3 px-6 rounded hover:bg-gray-800 transition duration-300"
          >
            View on GitHub
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-8 py-6 border-t border-gray-300 text-center">
        <p>&copy; 2025 Maze &amp; Game AI Project. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ChessGamePageWithImages;
