// AnimatedNode.js
import React from "react";
import { motion } from "framer-motion";
import { Handle, Position } from "reactflow";

export default function AnimatedNode({ data }) {
  return (
    <>
      {/* 
        Invisible handle at the TOP (type="target").
        Positions at top: 0, horizontally centered via left: "50%", 
        then shift left by 50% of its own width. 
      */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          opacity: 0,
          pointerEvents: "none",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />

      {/* 
        Invisible handle at the BOTTOM (type="source").
        Positions at bottom: 0, horizontally centered.
      */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          opacity: 0,
          pointerEvents: "none",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />

      {/* 
        Framer Motion wrapper for optional animations.
        Note: initial={false} stops "enter" animations on re-render; 
        exit={{ scale: 0 }} shrinks the node when removed.
      */}
      <motion.div
        initial={false}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        style={{
          width: 50,
          height: 50,
          borderRadius: "50%",
          backgroundColor: "#22c55e",
          border: "2px solid #2980b9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: "bold",
          userSelect: "none",
        }}
      >
        {data.label}
      </motion.div>
    </>
  );
}
