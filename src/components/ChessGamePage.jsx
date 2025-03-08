// ChessGamePageWithImages.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import Header from './Header';
import StockfishEngine from './engine/StockFishEngine';
import ChessBoard from './ChessGameComps/ChessBoard';
import Sidebar from './ChessGameComps/SideBar';
import AISettings from './ChessGameComps/Aisettings';
import Modal from './ChessGameComps/Modal';

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
  const gameRef = useRef(new Chess());
  const [board, setBoard] = useState(gameRef.current.board());
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [message, setMessage] = useState('');
  const [moveHistory, setMoveHistory] = useState([]);
  const [whiteTime, setWhiteTime] = useState(300);
  const [blackTime, setBlackTime] = useState(300);
  const [aiDepth, setAIDepth] = useState(15);
  const [aiMoveTime, setAIMoveTime] = useState(1000);
  const [engineFen, setEngineFen] = useState(null);
  const activeColor = gameRef.current.turn();

  // Ref for the move history container
  const moveHistoryRef = useRef(null);

  // Update timers
  useEffect(() => {
    const timer = setInterval(() => {
      if (gameRef.current.isGameOver()) {
        clearInterval(timer);
        return;
      }
      if (activeColor === 'w') {
        setWhiteTime((prev) => (prev > 0 ? prev - 1 : 0));
      } else {
        setBlackTime((prev) => (prev > 0 ? prev - 1 : 0));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeColor]);

  // Scroll move history to the bottom when it updates
  useEffect(() => {
    if (moveHistoryRef.current) {
      moveHistoryRef.current.scrollTop = moveHistoryRef.current.scrollHeight;
    }
  }, [moveHistory]);

  const convertToSquare = (row, col) => {
    const files = 'abcdefgh';
    return `${files[col]}${8 - row}`;
  };

  const handleSquareClick = (row, col) => {
    const square = convertToSquare(row, col);
    if (selected) {
      if (legalMoves.includes(square)) {
        const move = gameRef.current.move({
          from: selected,
          to: square,
          promotion: 'q',
        });
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
      const moves = gameRef.current.moves({ square, verbose: true });
      if (moves.length > 0) {
        setSelected(square);
        setLegalMoves(moves.map((m) => m.to));
      }
    }
  };

  const handleAIMove = useCallback((bestMove) => {
    console.log("handleAIMove triggered with:", bestMove);
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
    setEngineFen(null);
  }, []);

  const requestAIMove = () => {
    const fen = gameRef.current.fen();
    console.log("Requesting AI move for FEN:", fen, "with depth:", aiDepth, "and moveTime:", aiMoveTime);
    setEngineFen(fen);
  };

  useEffect(() => {
    if (
      gameRef.current.turn() === 'b' &&
      !gameRef.current.isGameOver() &&
      engineFen === null
    ) {
      const timeout = setTimeout(() => {
        requestAIMove();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [board, engineFen]);

  const requestPlayerAIMove = () => {
    if (gameRef.current.turn() === 'w' && !gameRef.current.isGameOver()) {
      requestAIMove();
    }
  };

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

  const dismissModal = () => {
    setMessage('');
  };

  return (
    // Entire page in a dark theme
    <div className="min-h-screen bg-[#121212] text-gray-100 font-sans">
      <Header />

      <AISettings
        aiDepth={aiDepth}
        aiMoveTime={aiMoveTime}
        setAIDepth={setAIDepth}
        setAIMoveTime={setAIMoveTime}
      />

      <main className="container mx-auto px-8 py-6 flex flex-col md:flex-row gap-8">
        {/* Chess board + controls */}
        <section className="w-full md:w-2/3 bg-[#1c1c1c] rounded-lg shadow p-8">
          <h3 className="text-4xl font-extrabold text-center mb-8 tracking-wide text-gray-100">
            Interactive Chess Game
          </h3>

          <ChessBoard
            board={board}
            legalMoves={legalMoves}
            selected={selected}
            onSquareClick={handleSquareClick}
            pieceImages={pieceImages}
            convertToSquare={convertToSquare}
          />

          {message && (
            <div className="mt-6 text-center">
              <p className="text-2xl text-red-500 font-semibold">{message}</p>
            </div>
          )}

          <div className="mt-8 flex justify-center gap-6">
            <button
              onClick={resetGame}
              className="bg-gray-700 text-white px-6 py-3 rounded hover:bg-gray-600 transition shadow-md"
            >
              Reset Game
            </button>
            <button
              onClick={() => {
                setSelected(null);
                setLegalMoves([]);
                setMessage('');
              }}
              className="bg-gray-700 text-white px-6 py-3 rounded hover:bg-gray-600 transition shadow-md"
            >
              Clear Selection
            </button>
            <button
              onClick={requestPlayerAIMove}
              disabled={gameRef.current.turn() !== 'w'}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition shadow-md disabled:bg-blue-900"
            >
              Player Best Move
            </button>
          </div>
        </section>

        {/* Sidebar with timers and move history */}
        <Sidebar
          whiteTime={whiteTime}
          blackTime={blackTime}
          moveHistory={moveHistory}
          ref={moveHistoryRef}
        />
      </main>

      {/* Stockfish integration */}
      <StockfishEngine
        fen={engineFen}
        depth={aiDepth}
        movetime={aiMoveTime}
        onBestMove={handleAIMove}
      />

      {/* Modal for game-end messages */}
      {(message === 'Checkmate!' || message === 'Stalemate!' || message === 'Check!') && (
        <Modal message={message} onDismiss={dismissModal} />
      )}

      {/* Documentation & Code */}
      <section id="docs" className="py-16 px-8 bg-[#1c1c1c]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-100">Documentation &amp; Code</h2>
          <p className="text-lg text-gray-300 mb-6">
            This chess game uses chess.js for game logic and integrates the Stockfish engine as a
            web worker. Users can adjust the engine's search depth and move time using the AI settings
            panel. Black's moves are computed automatically, while White's best move can be requested
            using the "Player Best Move" button.
          </p>
          <a
            href="https://github.com/yourusername/chess-game-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gray-700 text-white font-bold py-3 px-6 rounded hover:bg-gray-600 transition duration-300"
          >
            View on GitHub
          </a>
        </div>
      </section>

      <footer className="container mx-auto px-8 py-6 border-t border-gray-700 text-center">
        <p className="text-sm text-gray-500">
          &copy; 2025 Maze &amp; Game AI Project. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default ChessGamePageWithImages;
