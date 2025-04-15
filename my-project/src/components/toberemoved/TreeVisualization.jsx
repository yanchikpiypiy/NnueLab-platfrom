import React, { useMemo, useState, useCallback } from "react";
import Tree from "react-d3-tree";
import "./TreeVisualization.css"; 

const NodeLabel = React.memo(({ nodeDatum, onNodeClick }) => (
  <div
    className={`node-label ${nodeDatum.attributes.turn === "White" ? "white-turn" : "black-turn"}`}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    onClick={() => onNodeClick(nodeDatum)}
    aria-label={`Move: ${nodeDatum.name}, Score: ${nodeDatum.attributes.score}, Turn: ${nodeDatum.attributes.turn}`}
  >
    <strong>{nodeDatum.name}</strong>
    <br />
    <span className="node-info">Score: {nodeDatum.attributes.score}</span>
    <br />
    <span className="node-info">Turn: {nodeDatum.attributes.turn}</span>
  </div>
));

const Minimap = ({
  treeData,
  onMinimapClick,
  minimapZoom,
  handleMinimapZoomIn,
  handleMinimapZoomOut,
  handleMinimapReset,
}) => {
  return (
    <div className="minimap-container">
      <div className="minimap-controls">
        <button onClick={handleMinimapZoomIn}>Map Zoom In</button>
        <button onClick={handleMinimapZoomOut}>Map Zoom Out</button>
        <button onClick={handleMinimapReset}>Map Reset</button>
      </div>
      <div className="minimap-view" onClick={onMinimapClick}>
        <Tree
          data={treeData}
          orientation="vertical"
          translate={{ x: 100, y: 50 }}
          zoomable={true}
          zoom={minimapZoom}
          scaleExtent={{ min: 0.05, max: 1 }}
          separation={{ siblings: 1, nonSiblings: 1.2 }}
          nodeSize={{ x: 90, y: 60 }}
        />
      </div>
    </div>
  );
};

const TreeVisualization = ({ treeData, orientation = "vertical", onNodeClick = () => {} }) => {
  // Main tree view state
  const [translate, setTranslate] = useState({ x: 400, y: 100 });
  const [zoom, setZoom] = useState(1);

  // Minimap zoom state
  const [minimapZoom, setMinimapZoom] = useState(0.1);

  const nodeLabelComponent = useMemo(
    () => ({
      type: "custom",
      render: ({ nodeDatum }) => <NodeLabel nodeDatum={nodeDatum} onNodeClick={onNodeClick} />,
      foreignObjectWrapper: { width: 150, height: 70 },
    }),
    [onNodeClick]
  );

  // Main tree zoom/pan controls
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setTranslate({ x: 400, y: 100 });
  }, []);

  // Minimap zoom controls
  const handleMinimapZoomIn = useCallback(() => {
    setMinimapZoom((prev) => Math.min(prev + 0.05, 1));
  }, []);

  const handleMinimapZoomOut = useCallback(() => {
    setMinimapZoom((prev) => Math.max(prev - 0.05, 0.05));
  }, []);

  const handleMinimapReset = useCallback(() => {
    setMinimapZoom(0.1);
  }, []);

  // When the minimap is clicked, update the main tree's translate so that the clicked point becomes the center.
  // Here we assume the main tree container is 800x600.
  const handleMinimapClick = (e) => {
    const minimapRect = e.currentTarget.getBoundingClientRect();
    // Compute click coordinates relative to the minimap's top-left corner.
    const clickX = e.clientX - minimapRect.left;
    const clickY = e.clientY - minimapRect.top;
    // Assume main container dimensions (could be dynamic).
    const mainWidth = 800;
    const mainHeight = 600;
    // The coordinates in the tree's coordinate system (note: using minimapZoom to scale up).
    const treeX = clickX / minimapZoom;
    const treeY = clickY / minimapZoom;
    // Set new translate so that the clicked point becomes the center of the main view.
    setTranslate({
      x: mainWidth / 2 - treeX,
      y: mainHeight / 2 - treeY,
    });
  };

  return (
    <div className="tree-visualization-container">
      <div id="treeWrapper" className="tree-wrapper">
        <Tree
          data={treeData}
          orientation={orientation}
          translate={translate}
          zoomable={true}
          zoom={zoom}
          // Reduced separation values bring nodes closer together.
          separation={{ siblings: 0.6, nonSiblings: 1 }}
          nodeSize={{ x: 90, y: 60 }}
          nodeLabelComponent={nodeLabelComponent}
          scaleExtent={{ min: 0.1, max: 2 }}
        />
      </div>
      <div className="controls">
        <button onClick={handleZoomIn}>Zoom In</button>
        <button onClick={handleZoomOut}>Zoom Out</button>
        <button onClick={handleReset}>Reset View</button>
      </div>
      <Minimap
        treeData={treeData}
        onMinimapClick={handleMinimapClick}
        minimapZoom={minimapZoom}
        handleMinimapZoomIn={handleMinimapZoomIn}
        handleMinimapZoomOut={handleMinimapZoomOut}
        handleMinimapReset={handleMinimapReset}
      />
    </div>
  );
};

export default TreeVisualization;
