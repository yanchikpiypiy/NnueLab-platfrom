import React from "react";
import Tree from "react-d3-tree";

const TreeVisualization = ({ treeData, orientation = "vertical" }) => {
  return (
    <div
      id="treeWrapper"
      style={{
        width: "100%",
        height: "600px", // Increased height for better view
        marginTop: "20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflowX: "auto", // Allows horizontal scrolling if needed
      }}
    >
      <Tree
        data={treeData}
        orientation={orientation}
        translate={{ x: 400, y: 100 }} // Centers the tree
        zoomable={true} // Allows zooming in and out
        scaleExtent={{ min: 0.5, max: 2 }} // Restricts zoom levels
        separation={{ siblings: 1.5, nonSiblings: 2 }} // Better spacing
        nodeSize={{ x: 180, y: 120 }} // Larger nodes for readability
        nodeLabelComponent={{
          type: "custom",
          render: ({ nodeDatum }) => (
            <div
              style={{
                padding: "8px",
                background: nodeDatum.attributes.turn === "White" ? "#f8f9fa" : "#343a40",
                color: nodeDatum.attributes.turn === "White" ? "#000" : "#fff",
                borderRadius: "8px",
                border: "1px solid #000",
                textAlign: "center",
                boxShadow: "2px 2px 5px rgba(0,0,0,0.3)",
                minWidth: "100px",
                transition: "transform 0.2s ease-in-out",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <strong>{nodeDatum.name}</strong>
              <br />
              <span style={{ fontSize: "12px" }}>Score: {nodeDatum.attributes.score}</span>
              <br />
              <span style={{ fontSize: "12px" }}>Turn: {nodeDatum.attributes.turn}</span>
            </div>
          ),
          foreignObjectWrapper: {
            width: 150,
            height: 70,
          },
        }}
      />
    </div>
  );
};

export default TreeVisualization;
