// ControlPanel.jsx
import React, { useState } from 'react';

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
  // Toggle states for expandable subsections
  const [candidateExpanded, setCandidateExpanded] = useState(false);
  const [arrowExpanded, setArrowExpanded] = useState(false);

  return (
    <div className="control-panel">
      <h2 className="panel-title">Control Panel</h2>

      {/* Board Setup Controls */}
      <div className="control-section">
        <h3>Mate in N moves</h3>
        <div className="control-group">
          <label>
            Mate in (enter your number):&nbsp;
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
            <button className="button minimal-btn" onClick={solveProblem}>
              Solve Problem
            </button>
          </div>
        </div>
      )}

      {/* Best Solution (Step-by-Step) Section */}
      {(bestCandidate && !setupMode) && (
        <div className="control-section">
          <h3 
            onClick={() => setCandidateExpanded(!candidateExpanded)}
            style={{
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>Best Solution (Step-by-Step)</span>
            <span style={{ marginRight: '4px', lineHeight: '1' }}>
              {candidateExpanded ? '▽' : '▷'}
            </span>
          </h3>
          {candidateExpanded && (
            <>
              <div className="control-group">
                <p className="info">
                  <strong>Best Solution:</strong> {bestCandidate.branch.join(", ")}
                </p>
                <button
                  className="button minimal-btn"
                  onClick={showFullTraversal}
                  disabled={!bestCandidate}
                >
                Show best steps
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
            </>
          )}
        </div>
      )}

      {/* Minimax Steps Section */}
      {(arrowTraversalQueue.length > 0 && !setupMode) && (
        <div className="control-section">
          <h3 
            onClick={() => setArrowExpanded(!arrowExpanded)}
            style={{
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>Minimax Steps</span>
            <span style={{ marginRight: '4px', lineHeight: '1' }}>
              {arrowExpanded ? '▽' : '▷'}
            </span>
          </h3>
          {arrowExpanded && (
            <>
              <div className="control-group">
                <button className="button minimal-btn" onClick={prevArrowStep}>
                  Previous Minimax Step
                </button>
                <button className="button minimal-btn" onClick={nextArrowStep}>
                  Next Minimax Step
                </button>
              </div>
              <div className="control-group">
                <button className="button minimal-btn" onClick={playArrows}>
                  {isPlaying ? "Stop Animation" : "Auto Play Minimax"}
                </button>
                <button className="button minimal-btn" onClick={clearArrowsOnStop}>
                  Reset
                </button>
              </div>
              <div className="control-group">
                <p className="info">
                  Step: {currentArrowStep + 1} / {arrowTraversalQueue.length}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
