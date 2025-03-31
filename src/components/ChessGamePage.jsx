import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import Header from './Header';
import ChessBoard from './ChessGameComps/ChessBoard';
import Sidebar from './ChessGameComps/SideBar';
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
  // Change capture states to arrays that hold the keys of captured pieces.
  const [whiteCaptures, setWhiteCaptures] = useState([]);
  const [blackCaptures, setBlackCaptures] = useState([]);
  // Engine can be "stockfish", "sunfish", or "none"
  const [engineChoice, setEngineChoice] = useState('none');
  const [gameStarted, setGameStarted] = useState(false); // New state for game start

  const moveHistoryRef = useRef(null);

  useEffect(() => {
    if (!gameStarted) return;
    const timer = setInterval(() => {
      if (gameRef.current.isGameOver()) {
        clearInterval(timer);
        return;
      }
      if (gameRef.current.turn() === 'w') {
        setWhiteTime((prev) => (prev > 0 ? prev - 1 : 0));
      } else {
        setBlackTime((prev) => (prev > 0 ? prev - 1 : 0));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStarted]);

  useEffect(() => {
    if (moveHistoryRef.current) {
      moveHistoryRef.current.scrollTop = moveHistoryRef.current.scrollHeight;
    }
  }, [moveHistory]);

  const convertToSquare = (row, col) => {
    const files = 'abcdefgh';
    return `${files[col]}${8 - row}`;
  };

  const renderEngineCards = () => {
    const gameStartedAlready = gameRef.current.history().length > 0;
    return (
      <div className="flex gap-4 justify-center mb-4">
        <div
          className={`cursor-pointer border rounded p-4 transition transform duration-200 
            hover:shadow-xl hover:-translate-y-1 
            ${engineChoice === 'stockfish' 
              ? 'shadow-xl -translate-y-1 bg-blue-600 border-blue-600 text-white'
              : 'bg-gray-800 border-gray-700'} 
            ${gameStartedAlready ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => {
            if (!gameStartedAlready) {
              setEngineChoice('stockfish');
            }
          }}
        >
          <h3 className="text-xl font-bold">Stockfish</h3>
          <p className="text-sm">Stockfish Engine</p>
        </div>
        <div
          className={`cursor-pointer border rounded p-4 transition transform duration-200 
            hover:shadow-xl hover:-translate-y-1 
            ${engineChoice === 'sunfish' 
              ? 'shadow-xl -translate-y-1 bg-green-600 border-green-600 text-white'
              : 'bg-gray-800 border-gray-700'} 
            ${gameStartedAlready ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => {
            if (!gameStartedAlready) {
              setEngineChoice('sunfish');
            }
          }}
        >
          <h3 className="text-xl font-bold">Sunfish Improvement</h3>
          <p className="text-sm">My Own Engine</p>
        </div>
      </div>
    );
  };

  // When handling a user move, update captured arrays if a capture occurs.
  const handleSquareClick = (row, col) => {
    const square = convertToSquare(row, col);
    if (selected) {
      if (legalMoves.includes(square)) {
        const piece = gameRef.current.get(selected);
        let moveConfig = { from: selected, to: square };
        if (
          piece &&
          piece.type === 'p' &&
          ((piece.color === 'w' && square.endsWith('8')) ||
            (piece.color === 'b' && square.endsWith('1')))
        ) {
          moveConfig.promotion = 'q';
        }
        const move = gameRef.current.move(moveConfig);
        if (move) {
          if (move.captured) {
            // Determine captured piece key.
            const capturedKey = move.color === 'w'
              ? 'b' + move.captured.toUpperCase()
              : 'w' + move.captured.toUpperCase();
            if (move.color === 'w') {
              setWhiteCaptures((prev) => [...prev, capturedKey]);
            } else {
              setBlackCaptures((prev) => [...prev, capturedKey]);
            }
          }
          if (!gameStarted) setGameStarted(true);
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

  // Similar update for engine moves.
  const handleEngineMove = useCallback((bestMove) => {
    if (!bestMove) return;
    const from = bestMove.substring(0, 2);
    const to = bestMove.substring(2, 4);
    let moveConfig = { from, to };
    if (bestMove.length === 5) {
      moveConfig.promotion = bestMove.substring(4, 5);
    }
    const move = gameRef.current.move(moveConfig);
    if (move) {
      if (move.captured) {
        const capturedKey = move.color === 'w'
          ? 'b' + move.captured.toUpperCase()
          : 'w' + move.captured.toUpperCase();
        if (move.color === 'w') {
          setWhiteCaptures((prev) => [...prev, capturedKey]);
        } else {
          setBlackCaptures((prev) => [...prev, capturedKey]);
        }
      }
      if (!gameStarted) setGameStarted(true);
      setBoard(gameRef.current.board());
      setMoveHistory(gameRef.current.history());
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
  }, [gameStarted]);

  const requestStockfishMove = () => {
    const stockfishWorker = new Worker('/stockfish.js');
    stockfishWorker.onmessage = (event) => {
      const line = event.data;
      if (line.startsWith("bestmove")) {
        const bestMove = line.split(" ")[1];
        handleEngineMove(bestMove);
        stockfishWorker.terminate();
      }
    };
    stockfishWorker.postMessage(`position fen ${gameRef.current.fen()}`);
    stockfishWorker.postMessage("go depth 15");
  };

  const requestSunfishMove = async () => {
    const movesVerbose = gameRef.current.history({ verbose: true });
    if (movesVerbose.length === 0) return;
    const lastMoveObj = movesVerbose[movesVerbose.length - 1];
    const userMove =
      lastMoveObj.from +
      lastMoveObj.to +
      (lastMoveObj.promotion ? lastMoveObj.promotion : "");
    try {
      const response = await fetch("http://127.0.0.1:8000/chess/makemove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ move: userMove })
      });
      const data = await response.json();
      if (data.status === "ok") {
        handleEngineMove(data.engine_move);
      }
    } catch (err) {
      console.error("Error calling process_move endpoint:", err);
    }
  };

  useEffect(() => {
    if (gameRef.current.isGameOver()) return;
    if (engineChoice !== 'none' && gameRef.current.turn() === 'b') {
      if (engineChoice === 'stockfish') {
        requestStockfishMove();
      } else if (engineChoice === 'sunfish') {
        requestSunfishMove();
      }
    }
  }, [board, engineChoice]);

  const toggleEngineChoice = () => {
    if (gameRef.current.history().length > 0) return;
    if (engineChoice === 'none') {
      setEngineChoice('stockfish');
    } else if (engineChoice === 'stockfish') {
      setEngineChoice('sunfish');
    } else {
      setEngineChoice('none');
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
    setGameStarted(false);
    setWhiteCaptures([]);
    setBlackCaptures([]);
  };

  const dismissModal = () => {
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-[#121212] text-gray-100 font-sans">
      <Header />
      {renderEngineCards()}
      <main className="container mx-auto px-8 py-6 flex flex-col md:flex-row gap-8">
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
          <div className="mt-8 flex flex-col items-center gap-6">
            <button
              onClick={resetGame}
              className="bg-gray-700 text-white px-6 py-3 rounded hover:bg-gray-600 transition shadow-md"
            >
              Reset Game
            </button>
            <button
              onClick={toggleEngineChoice}
              className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition shadow-md"
            >
              Engine: {engineChoice.toUpperCase()}
            </button>
          </div>
        </section>
        <Sidebar
          whiteTime={whiteTime}
          blackTime={blackTime}
          moveHistory={moveHistory}
          whiteCaptures={whiteCaptures}
          blackCaptures={blackCaptures}
          pieceImages={pieceImages}
          ref={moveHistoryRef}
        />
      </main>
      {(message === 'Checkmate!' || message === 'Stalemate!' || message === 'Check!') && (
        <Modal message={message} onDismiss={dismissModal} />
      )}
      <section id="docs" className="py-16 px-8 bg-[#1c1c1c]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-100">Documentation &amp; Code</h2>
          <p className="text-lg text-gray-300 mb-6">
            This example shows toggling between Stockfish and Sunfish engines and displaying captured pieces.
          </p>
        </div>
      </section>
    </div>
  );
};

export default ChessGamePageWithImages;
