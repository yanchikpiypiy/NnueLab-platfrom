// CustomNode.js
import React from "react";
import { Handle } from "reactflow";

const CustomNode = React.memo(({ data }) => {
  const style = {
    padding: "10px",
    border: "1px solid #000",
    borderRadius: "8px",
    background:
      data.turn === "White"
        ? "#f8f9fa"
        : data.turn === "Black"
        ? "#343a40"
        : "#ddd",
    color:
      data.turn === "White"
        ? "#000"
        : data.turn === "Black"
        ? "#fff"
        : "#000",
    textAlign: "center",
    width: "160px",
    cursor: "pointer",
    pointerEvents: "auto", // keep pointerEvents so the node is clickable
  };

  return (
    <div style={style}>
      <Handle type="target" position="top" id="target" style={{ background: "#555" }} />
      <strong>{data.label}</strong>
      <br />
      <span style={{ fontSize: "12px" }}>Score: {data.score}</span>
      <br />
      <span style={{ fontSize: "12px" }}>Turn: {data.turn}</span>
      <Handle type="source" position="bottom" id="source" style={{ background: "#555" }} />
    </div>
  );
});

export default CustomNode;
