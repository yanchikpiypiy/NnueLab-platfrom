// ReactFlowTree.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import ReactFlow, {
  Controls,
  Background,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import debounce from "lodash/debounce";
import { solverTreeToFlow } from "./ReactFlowSetup/solverTreeToFlow";
import CustomNode from "./ReactFlowSetup/CustomNode";
import CustomMiniMap from "./ReactFlowSetup/CustomMiniMap";

// Define nodeTypes outside the component.
const nodeTypes = { customNode: CustomNode };

const nodeWidth = 180;
const nodeHeight = 120;

// Computes a hierarchical layout using dagre.
const getLayoutedElements = (nodes, edges, direction = "TB") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
};

// Auto-collapse nodes beyond maxDepth.
const autoCollapse = (node, currentDepth = 0, maxDepth = 2) => {
  if (!node) return node;
  if (currentDepth >= maxDepth && node.children && node.children.length > 0) {
    return { ...node, collapsed: true, children: node.children.map(child => autoCollapse(child, currentDepth + 1, maxDepth)) };
  }
  if (node.children && node.children.length > 0) {
    return { ...node, children: node.children.map(child => autoCollapse(child, currentDepth + 1, maxDepth)) };
  }
  return node;
};

// Helper to toggle collapse state based on an ID convention ("root", "root-0", etc.).
function toggleCollapseInTree(tree, targetId, currentId = "root") {
  if (!tree) return tree;
  if (currentId === targetId) {
    return { ...tree, collapsed: !tree.collapsed };
  }
  if (!tree.children || tree.children.length === 0) return tree;
  return {
    ...tree,
    children: tree.children.map((child, index) => {
      const childId = `${currentId}-${index}`;
      return toggleCollapseInTree(child, targetId, childId);
    }),
  };
}

export default function ReactFlowTree({ treeData, onNodeClick = () => {} }) {
  // Fallback tree for testing if no treeData is provided.
  const fallbackTree = {
    name: "Start",
    attributes: { score: 998, nextMove: "Ra6" },
    fill: "gray",
    children: [
      {
        name: "Kd8",
        attributes: { score: 2, nextMove: "a5" },
        fill: "white",
        children: [
          {
            name: "Nf6",
            attributes: { score: 5, nextMove: "g4" },
            fill: "black",
            children: [],
          },
        ],
      },
      {
        name: "Qd7",
        attributes: { score: 3, nextMove: "b3" },
        fill: "black",
        children: [],
      },
    ],
  };

  // Use provided treeData or fallback.
  const [localSolverTree, setLocalSolverTree] = useState(treeData ? autoCollapse(treeData, 0, 3) : fallbackTree);

  useEffect(() => {
    console.log("Solver tree received:", treeData);
    if (treeData) {
      setLocalSolverTree(autoCollapse(treeData, 0, 3));
    }
  }, [treeData]);

  // Memoize conversion from solver tree to nodes/edges.
  const flowData = useMemo(() => {
    const data = solverTreeToFlow(localSolverTree);
    console.log("Converted flow data:", data);
    return data;
  }, [localSolverTree]);

  // Debounce layout recalculation.
  const updateLayout = useMemo(() => {
    return debounce(() => {
      const layout = getLayoutedElements(flowData.nodes, flowData.edges, "TB");
      setNodes(layout.nodes);
      setEdges(layout.edges);
    }, 300);
  }, [flowData]);

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    updateLayout();
    return () => updateLayout.cancel();
  }, [flowData, updateLayout]);

  // Toggle collapse/expand on node double-click.
  const onNodeDoubleClick = useCallback(
    (event, node) => {
      const updatedTree = toggleCollapseInTree(localSolverTree, node.id);
      console.log("Toggled collapse for node", node.id, updatedTree);
      setLocalSolverTree(updatedTree);
    },
    [localSolverTree]
  );

  return (
    <ReactFlowProvider>
      <div style={{ width: "100%", height: "800px" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={(event, node) => onNodeClick(node)}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
        >
          {/* Use the custom minimap for a lightweight overview */}
          <CustomMiniMap nodes={nodes} width={200} height={150} />
          <Controls />
          <Background color="#aaa" gap={16} />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
}
