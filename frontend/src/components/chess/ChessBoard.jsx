import React from 'react';

const ChessBoard = ({ board, legalMoves, selected, onSquareClick, pieceImages, convertToSquare }) => {
  const files = 'abcdefgh';
  return (
    <div className="flex flex-col items-center">
      <div className="inline-block">
        {/* Grid with 9 columns: one for left rank labels and eight for the board */}
        <div className="grid grid-cols-9">
          {/* Board rows with left rank labels */}
          {board.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {/* Left rank label with improved styling */}
              <div className="w-8 h-16 flex items-center justify-center font-bold text-lg text-white-800 ml-7">
                {8 - rowIndex}
              </div>
              {row.map((piece, colIndex) => {
                const square = convertToSquare(rowIndex, colIndex);
                const isLegal = legalMoves.includes(square);
                const isSelected = selected === square;
                const isDark = (rowIndex + colIndex) % 2 === 1;
                return (
                  <div
                    key={colIndex}
                    onClick={() => onSquareClick(rowIndex, colIndex)}
                    className={`w-16 h-16 flex items-center justify-center border border-gray-200 cursor-pointer transition transform hover:scale-105 
                      ${isDark ? 'bg-gray-800' : 'bg-gray-100'} 
                      ${isLegal ? 'ring-2 ring-blue-400' : ''} 
                      ${isSelected ? 'ring-2 ring-yellow-400' : ''}`}
                  >
                    {piece && (
                      <img
                        src={pieceImages[`${piece.color}${piece.type.toUpperCase()}`]}
                        alt={`${piece.color}${piece.type}`}
                        className="w-12 h-12 object-contain"
                      />
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
          {/* Bottom row for file labels: left empty cell for alignment */}
          <div></div>
          {files.split('').map((file, index) => (
            <div key={`bottom-${index}`} className="w-16 h-6 flex items-center justify-center font-bold text-lg text-white-800">
              {file}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;
