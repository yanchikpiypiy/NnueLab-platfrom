// ChessBoard.jsx
import React from 'react';

const ChessBoard = ({ board, legalMoves, selected, onSquareClick, pieceImages, convertToSquare }) => {
  return (
    <div className="flex flex-col items-center">
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="flex">
          {row.map((piece, colIndex) => {
            const square = convertToSquare(rowIndex, colIndex);
            const isLegal = legalMoves.includes(square);
            const isSelected = selected === square;
            const isDark = (rowIndex + colIndex) % 2 === 1;
            return (
              <div
                key={colIndex}
                onClick={() => onSquareClick(rowIndex, colIndex)}
                className={`w-20 h-20 flex items-center justify-center border border-gray-200 cursor-pointer transition transform hover:scale-105 
                  ${isDark ? 'bg-gray-800' : 'bg-gray-100'} 
                  ${isLegal ? 'ring-2 ring-blue-400' : ''} 
                  ${isSelected ? 'ring-2 ring-yellow-400' : ''}`}
              >
                {piece && (
                  <img
                    src={pieceImages[`${piece.color}${piece.type.toUpperCase()}`]}
                    alt={`${piece.color}${piece.type}`}
                    className="w-16 h-16 object-contain"
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ChessBoard;
