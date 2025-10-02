import { useState, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { INITIAL_TIME } from '../../constants/chess/pieceImages';
import {
    convertToSquare,
    createMoveConfig,
    getCapturedPieceKey,
} from '../../utils/chess/chessUtils';

export const useChessGame = () => {
    const gameRef = useRef(new Chess());
    const [board, setBoard] = useState(gameRef.current.board());
    const [selected, setSelected] = useState(null);
    const [legalMoves, setLegalMoves] = useState([]);
    const [message, setMessage] = useState('');
    const [moveHistory, setMoveHistory] = useState([]);
    const [gameStarted, setGameStarted] = useState(false);
    const [whiteCaptures, setWhiteCaptures] = useState([]);
    const [blackCaptures, setBlackCaptures] = useState([]);

    const updateCaptures = useCallback((move) => {
        const capturedKey = getCapturedPieceKey(move);
        if (!capturedKey) return;

        if (move.color === 'w') {
            setWhiteCaptures((prev) => [...prev, capturedKey]);
        } else {
            setBlackCaptures((prev) => [...prev, capturedKey]);
        }
    }, []);

    const updateGameState = useCallback(() => {
        if (!gameStarted) setGameStarted(true);
        setBoard(gameRef.current.board());
        setMoveHistory(gameRef.current.history());

        if (gameRef.current.isCheckmate()) {
            setMessage('Checkmate!');
        } else if (gameRef.current.isStalemate()) {
            setMessage('Stalemate!');
        } else if (gameRef.current.isCheck()) {
            setMessage('Check!');
        } else {
            setMessage('');
        }
    }, [gameStarted]);

    const makeMove = useCallback(
        (from, to) => {
            const piece = gameRef.current.get(from);
            const moveConfig = createMoveConfig(from, to, piece);
            const move = gameRef.current.move(moveConfig);

            if (move) {
                updateCaptures(move);
                updateGameState();
                return true;
            } else {
                setMessage('Illegal move!');
                return false;
            }
        },
        [updateCaptures, updateGameState]
    );

    const handleSquareClick = useCallback(
        (row, col) => {
            const square = convertToSquare(row, col);

            if (selected) {
                if (legalMoves.includes(square)) {
                    makeMove(selected, square);
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
        },
        [selected, legalMoves, makeMove]
    );

    const handleEngineMove = useCallback(
        (bestMove) => {
            if (!bestMove) return;

            const from = bestMove.substring(0, 2);
            const to = bestMove.substring(2, 4);
            let moveConfig = { from, to };

            if (bestMove.length === 5) {
                moveConfig.promotion = bestMove.substring(4, 5);
            }

            const move = gameRef.current.move(moveConfig);
            if (move) {
                updateCaptures(move);
                updateGameState();
            } else {
                setMessage('Illegal move!');
                console.error('❌ Illegal engine move:', bestMove);
            }
        },
        [updateCaptures, updateGameState]
    );

    const resetGame = useCallback(() => {
        gameRef.current.reset();
        setBoard(gameRef.current.board());
        setSelected(null);
        setLegalMoves([]);
        setMessage('');
        setMoveHistory([]);
        setGameStarted(false);
        setWhiteCaptures([]);
        setBlackCaptures([]);
    }, []);

    return {
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
        resetGame,
    };
};
