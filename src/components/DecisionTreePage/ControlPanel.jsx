// ControlPanel.jsx
import React from 'react';

const ControlPanel = ({
  allowedSteps,
  setAllowedSteps,
  setupMode,
  solveProblem,
  bestCandidate,
  showFullTraversal,
  traversalFens,
  currentStep,
  nextStep,
  prevStep,
  arrowTraversalQueue,
  currentArrowStep,
  nextArrowStep,
  prevArrowStep,
  playArrows,
  isPlaying,
  clearArrowsOnStop
}) => {
  return (
    <div className="control-panel">
      <h2 className="panel-title">Control Panel</h2>

      {/* Board Setup Controls */}
      <div className="control-section">
        <h3>Board Setup</h3>
        <div className="control-group">
          <label>
            Allowed Steps:&nbsp;
            <input
              type="number"
              min="1"
              value={allowedSteps}
              onChange={(e) => setAllowedSteps(parseInt(e.target.value, 10))}
              className="steps-input"
            />
          </label>
        </div>
      </div>

      {/* Solver Controls */}
      {!setupMode && (
        <div className="control-section">
          <h3>Solver</h3>
          <div className="control-group">
            <button
              className="button minimal-btn"
              onClick={solveProblem}
            >
              Solve Problem
            </button>
          </div>
        </div>
      )}

      {(bestCandidate && !setupMode) && (
        <div className="control-section">
          <h3>Candidate & Traversal</h3>
          <div className="control-group">
            <p className="info">
              <strong>Best Candidate:</strong> {bestCandidate.branch.join(", ")}
            </p>
            <button
              className="button minimal-btn"
              onClick={showFullTraversal}
              disabled={!bestCandidate}
            >
              {traversalFens.length > 0 ? "Stop Full Traversal" : "Show Full Traversal"}
            </button>
          </div>
          {traversalFens.length > 0 && (
            <>
              <div className="control-group">
                <button className="button minimal-btn" onClick={prevStep}>
                  Previous Step
                </button>
                <button className="button minimal-btn" onClick={nextStep}>
                  Next Step
                </button>
              </div>
              <div className="control-group">
                <p className="info">
                  Step: {currentStep} / {traversalFens.length - 1}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Arrow Navigation Controls */}
      {(arrowTraversalQueue.length > 0 && !setupMode) && (
        <div className="control-section">
          <h3>Arrow Navigation</h3>
          <div className="control-group">
            <button className="button minimal-btn" onClick={prevArrowStep}>
              Previous Arrow Step
            </button>
            <button className="button minimal-btn" onClick={nextArrowStep}>
              Next Arrow Step
            </button>
          </div>
          <div className="control-group">
            <button className="button minimal-btn" onClick={playArrows}>
              {isPlaying ? "Stop" : "Play Arrows"}
            </button>
            <button className="button minimal-btn" onClick={clearArrowsOnStop}>
              Reset
            </button>
          </div>
          <div className="control-group">
            <p className="info">
              Arrow Step: {currentArrowStep + 1} / {arrowTraversalQueue.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
