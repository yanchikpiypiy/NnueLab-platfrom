// CustomMiniMap.jsx
import React, { useMemo } from "react";

const CustomMiniMap = ({ nodes, width = 200, height = 150, clusterRadius = 50, scale = 0.1 }) => {
  // Group nodes into clusters by rounding their positions.
  const clusters = useMemo(() => {
    const grid = {};
    nodes.forEach((node) => {
      // Use node.position which was computed by dagre.
      const gridX = Math.floor(node.position.x / clusterRadius);
      const gridY = Math.floor(node.position.y / clusterRadius);
      const key = `${gridX}-${gridY}`;
      if (!grid[key]) {
        grid[key] = { x: 0, y: 0, count: 0 };
      }
      grid[key].x += node.position.x;
      grid[key].y += node.position.y;
      grid[key].count += 1;
    });
    const clustersArray = [];
    Object.entries(grid).forEach(([key, value]) => {
      clustersArray.push({
        x: value.x / value.count,
        y: value.y / value.count,
        count: value.count,
      });
    });
    return clustersArray;
  }, [nodes, clusterRadius]);

  return (
    <svg width={width} height={height} style={{ border: "1px solid #ccc", background: "#f0f0f0" }}>
      {clusters.map((cluster, i) => (
        <circle
          key={i}
          cx={cluster.x * scale + width / 2}
          cy={cluster.y * scale + height / 2}
          r={Math.max(3, cluster.count)}
          fill="#555"
          opacity={0.7}
        />
      ))}
    </svg>
  );
};

export default CustomMiniMap;
