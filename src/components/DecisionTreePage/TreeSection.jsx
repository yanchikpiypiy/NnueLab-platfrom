import React from 'react';
import ReactFlowTree from './ReactFlowTree';

const TreeSection = ({
  candidateTree,
  showTree,
  setShowTree,
  expandNext,
  expandFullTree,
  treeData,
  setupMode,
  onNodeDoubleClick  // <-- added prop
}) => {
  return (
    <div className="tree-section visible">
      <div
        className="tree-header"
        style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}
      >
        <button className="button minimal-btn" onClick={() => setShowTree(prev => !prev)}>
          {showTree ? "Hide Tree" : "Show Tree"}
        </button>
      </div>
      {showTree && (
        <>
          <div className="tree-controls" style={{ marginBottom: '10px', textAlign: 'center' }}>
            <div className="control-section">
              <h3>Search Tree</h3>
              <div className="control-group">
                <button className="button minimal-btn" onClick={expandFullTree}>
                  Expand Full Tree
                </button>
              </div>
            </div>
          </div>
          <ReactFlowTree treeData={treeData} onNodeDoubleClick={onNodeDoubleClick} />
        </>
      )}
    </div>
  );
};

export default TreeSection;
