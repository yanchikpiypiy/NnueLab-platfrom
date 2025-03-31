import React from 'react';

const ChessBoard = ({ board, legalMoves, selected, onSquareClick, pieceImages, convertToSquare }) => {
  const files = 'abcdefgh';
  return (
    <div className="flex flex-col items-center">
      <div className="inline-block">
        {/* Using a grid with 9 columns: extra column for rank labels */}
        <div className="grid grid-cols-9">
          {/* Top left empty cell */}
          <div></div>
          {/* Top file labels */}
          {files.split('').map((file, index) => (
            <div key={`top-${index}`} className="w-16 h-4 flex items-center justify-center text-sm text-gray-400">
              {file}
            </div>
          ))}
          {/* Board rows with rank labels */}
          {board.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {/* Left rank label */}
              <div className="w-4 h-16 flex items-center justify-center text-sm text-gray-400">
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
          {/* Bottom left empty cell */}
          <div></div>
          {/* Bottom file labels */}
          {files.split('').map((file, index) => (
            <div key={`bottom-${index}`} className="w-16 h-4 flex items-center justify-center text-sm text-gray-400">
              {file}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;
