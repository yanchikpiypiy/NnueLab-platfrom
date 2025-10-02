import React, { useState, useRef, useEffect } from 'react';
import Header from '../../components/Header';
import ChessBoard from '../../components/chess/ChessBoard';
import Sidebar from '../../components/chess/Sidebar';
import Modal from '../../components/chess/Modal';
import EngineSelector from '../../components/chess/EngineSelector';
import { PIECE_IMAGES } from '../../constants/chess/pieceImages';
import { convertToSquare } from '../../utils/chess/chessUtils';
import { useChessGame } from '../../hooks/chess/useChessGame';
import { useChessTimer } from '../../hooks/chess/useChessTimer';
import { useChessEngine } from '../../hooks/chess/useChessEngine';
import { chessAPI } from '../../services/chess/chessAPI';

const ChessGamePage = () => {
    const [engineChoice, setEngineChoice] = useState('none');
    const moveHistoryRef = useRef(null);

    // Custom hooks
    const {
        gameRef,
        board,
        selected,
        legalMoves,
        message,
        moveHistory,
        gameStarted,
        whiteCaptures,
        blackCaptures,
        setMessage,
        handleSquareClick,
        handleEngineMove,
        resetGame: resetGameState,
    } = useChessGame();

    const { whiteTime, blackTime, resetTimers } = useChessTimer(
        gameRef,
        gameStarted
    );

    useChessEngine(gameRef, engineChoice, board, handleEngineMove);

    // Auto-scroll move history
    useEffect(() => {
        if (moveHistoryRef.current) {
            moveHistoryRef.current.scrollTop = moveHistoryRef.current.scrollHeight;
        }
    }, [moveHistory]);

    const resetGame = async () => {
        try {
            // Always reset yunfish backend (even if not currently selected)
            // This ensures clean state
            const data = await chessAPI.resetGame();

            if (data.status === 'ok') {
                resetGameState();
                resetTimers();
                console.log(' Game reset successfully');
            }
        } catch (err) {
            console.error(' Error resetting game:', err);
            // Still reset the frontend even if backend fails
            resetGameState();
            resetTimers();
        }
    };

    const dismissModal = () => {
        setMessage('');
    };

    const gameStartedAlready = gameRef.current.history().length > 0;

    return (
        <div className="min-h-screen bg-[#121212] text-gray-100 font-sans">
            <Header />

            {/* Info Section */}
            <div className="max-w-2xl mx-auto px-4 py-4 text-center">
                <p className="text-gray-300 leading-relaxed">
                    This page allows you to play chess against strong engines that use{' '}
                    <span className="text-green-500">NNUE</span> for evaluation, such as{' '}
                    <span className="text-green-500">Stockfish</span> and my very own{' '}
                    <span className="text-green-500">Yanfish</span>. You can choose to
          play against yourself, or let an{' '}
                    <span className="text-green-500">engine</span> challenge you with
          high-level tactics and strategies.
        </p>
            </div>

            {/* Engine Selection */}
            <EngineSelector
                engineChoice={engineChoice}
                setEngineChoice={setEngineChoice}
                gameStarted={gameStartedAlready}
            />

            {/* Main Game Area */}
            <main className="container mx-auto px-8 py-6 flex flex-col md:flex-row">
                <section className="w-75% md:w-2/3 rounded-lg shadow p-8">
                    <h3 className="text-4xl font-extrabold text-center mb-8 tracking-wide text-gray-100">
                        Interactive Chess Game
          </h3>

                    <ChessBoard
                        board={board}
                        legalMoves={legalMoves}
                        selected={selected}
                        onSquareClick={handleSquareClick}
                        pieceImages={PIECE_IMAGES}
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
                    </div>
                </section>

                <Sidebar
                    whiteTime={whiteTime}
                    blackTime={blackTime}
                    moveHistory={moveHistory}
                    whiteCaptures={whiteCaptures}
                    blackCaptures={blackCaptures}
                    pieceImages={PIECE_IMAGES}
                    ref={moveHistoryRef}
                />
            </main>

            {/* Modal */}
            {(message === 'Checkmate!' ||
                message === 'Stalemate!' ||
                message === 'Check!') && (
                    <Modal message={message} onDismiss={dismissModal} />
                )}
        </div>
    );
};

export default ChessGamePage;
