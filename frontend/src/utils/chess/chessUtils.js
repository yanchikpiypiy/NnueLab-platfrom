
export const convertToSquare = (row, col) => {
    const files = 'abcdefgh';
    return `${files[col]}${8 - row}`;
};

export const isPawnPromotion = (piece, toSquare) => {
    if (!piece || piece.type !== 'p') return false;
    return (
        (piece.color === 'w' && toSquare.endsWith('8')) ||
        (piece.color === 'b' && toSquare.endsWith('1'))
    );
};

export const createMoveConfig = (from, to, piece) => {
    const config = { from, to };
    if (isPawnPromotion(piece, to)) {
        config.promotion = 'q';
    }
    return config;
};

export const getCapturedPieceKey = (move) => {
    if (!move.captured) return null;
    const capturedPiece = move.captured.toUpperCase();
    return move.color === 'w' ? `b${capturedPiece}` : `w${capturedPiece}`;
};
