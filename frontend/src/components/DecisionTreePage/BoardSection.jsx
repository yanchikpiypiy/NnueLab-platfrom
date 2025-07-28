// BoardSection.jsx
import React from 'react';
import { Chessboard } from 'react-chessboard';
import ChessBoardSetup from './ChessBoardSetup';

const BoardSection = ({
  setupMode,
  positionObj,
  boardContainerRef,
  palettePieces,
  pieceImages,
  boardWidth,
  onDrop,
  handleDragOver,
  handleBoardDrop,
  handleSquareRightClick,
  game,
  traversalFens,
  currentStep,
  Arrows,
  memoizedCurrentArrows,
  handleSetUp
}) => {
  const boardPosition = traversalFens.length > 0
    ? traversalFens[currentStep]
    : (setupMode ? positionObj : game.fen());
  
  return (
    <div className="board-section">
      {setupMode ? (
        <>
          <div className={`palette-container ${setupMode ? '' : 'hidden'}`}>
            <ChessBoardSetup
              position={positionObj}
              boardWidth={boardWidth}
              setupMode={setupMode}
              onDragOver={handleDragOver}
              onDrop={handleBoardDrop}
              onSquareRightClick={handleSquareRightClick}
              boardContainerRef={boardContainerRef}
              palettePieces={palettePieces}
              pieceImages={pieceImages}
            />
          </div>
          <div className="button-group center">
            <button className="button minimal-btn" onClick={handleSetUp}>
              Set Current Board as Problem
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="board-wrapper" ref={boardContainerRef}>
            <Chessboard
              position={boardPosition}
              onPieceDrop={onDrop}
              boardWidth={boardWidth}
              boardOrientation="white"
              customArrows={Arrows !== null ? Arrows : memoizedCurrentArrows}
              customBoardStyle={{
                borderRadius: "5px",
                boxShadow: "0 5px 15px rgba(0,0,0,0.5)"
              }}
            />
          </div>
          <div className="button-group center">
            <button className="button minimal-btn" onClick={handleSetUp}>
              Setup mode
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BoardSection;
