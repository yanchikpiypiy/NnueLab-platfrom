
import React from 'react';
import { Chessboard } from 'react-chessboard';

const ChessBoardSetup = ({
  position,
  boardWidth = 500,
  setupMode,
  onDragOver,
  onDrop,
  onSquareRightClick,
  palettePieces,
  pieceImages,
  boardContainerRef
}) => {
  return (
    <div className="setup-container" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '20px' }}>
      <div className="board-wrapper" ref={boardContainerRef}>
        <div onDragOver={onDragOver} onDrop={onDrop}>
          <Chessboard
            position={position}
            boardWidth={boardWidth}
            boardOrientation="white"
            customBoardStyle={{ borderRadius: "5px", boxShadow: "0 5px 15px rgba(0,0,0,0.5)" }}
            onSquareRightClick={onSquareRightClick}
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
