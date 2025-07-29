import React from 'react';
import { Chessboard } from 'react-chessboard';

const ChessBoardSetup = ({
  position,
  boardWidth = 500,
  setupMode,
  onDragOver,
  onDrop,
  onPieceDrop,
  onSquareRightClick,
  palettePieces,
  pieceImages,
  boardContainerRef
}) => {
  // Create separate handlers for different types of drops
  const handlePaletteDrop = (e) => {
    // This handles drops from the palette (drag/drop events)
    console.log("Palette drop event:", e);
    if (onDrop) {
      onDrop(e);
    }
  };

  const handlePieceDrop = (sourceSquare, targetSquare) => {
    // This handles piece moves on the board (square to square)
    console.log("Piece drop:", sourceSquare, "->", targetSquare);
    if (onPieceDrop) {
      return onPieceDrop(sourceSquare, targetSquare);
    }
    return false;
  };

  return (
    <div className="setup-container" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '20px' }}>
      <div className="board-wrapper" ref={boardContainerRef}>
        {/* This div handles drops from the palette */}
        <div onDragOver={onDragOver} onDrop={handlePaletteDrop}>
          <Chessboard
            position={position}
            boardWidth={boardWidth}
            boardOrientation="white"
            customBoardStyle={{ borderRadius: "5px", boxShadow: "0 5px 15px rgba(0,0,0,0.5)" }}
            onSquareRightClick={onSquareRightClick}
            onPieceDrop={handlePieceDrop} // Use the piece drop handler for board moves
          />
        </div>
      </div>
      <div className="palette">
        <h3 className="palette-header">Palette</h3>
        {palettePieces.map((piece) => (
          <div
            key={piece}
            className="palette-item"
            draggable="true"
            onDragStart={(e) => e.dataTransfer.setData("piece", piece)}
          >
            <img src={pieceImages[piece]} alt={piece} className="palette-image" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChessBoardSetup;