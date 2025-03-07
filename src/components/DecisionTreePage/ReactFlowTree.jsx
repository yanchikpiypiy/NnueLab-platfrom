import React, { useState, useEffect, useMemo, useCallback } from "react";
import ReactFlow, {
  Controls,
  Background,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import debounce from "lodash/debounce";
import { solverTreeToFlow } from "./ReactFlowSetup/solverTreeToFlow";
import CustomNode from "./ReactFlowSetup/CustomNode";
import CustomMiniMap from "./ReactFlowSetup/CustomMiniMap";

const nodeTypes = { customNode: CustomNode };

const nodeWidth = 180;  // ⬅ Smaller nodes
const nodeHeight = 100; // ⬅ Smaller nodes

/** 🏗️ Optimized Layout (Prevent Overlapping) */
const getLayoutedElements = (nodes, edges, direction = "TB") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 40, // ⬅ Increased horizontal spacing (was 15)
    ranksep: 300, // ⬅ Increased vertical spacing (was 25)
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return {
    nodes: nodes.map((node) => ({
      ...node,
      position: {
        x: dagreGraph.node(node.id).x - nodeWidth / 2,
        y: dagreGraph.node(node.id).y - nodeHeight / 2,
      },
    })),
    edges,
  };
};

export default function ReactFlowTree({ treeData, onNodeClick = () => {} }) {
  const [localSolverTree, setLocalSolverTree] = useState(treeData);

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    if (treeData) {
      setLocalSolverTree(treeData);
    }
  }, [treeData]);

  const flowData = useMemo(() => solverTreeToFlow(localSolverTree), [localSolverTree]);

  const updateLayout = useMemo(
    () =>
      debounce(() => {
        const layout = getLayoutedElements(flowData.nodes, flowData.edges, "TB");
        setNodes(layout.nodes);
        setEdges(layout.edges);
      }, 300),
    [flowData]
  );

  useEffect(() => {
    updateLayout();
    return () => updateLayout.cancel();
  }, [flowData, updateLayout]);

  return (
    <ReactFlowProvider>
      <ReactFlowInner
        nodes={nodes}
        edges={edges}
        setLocalSolverTree={setLocalSolverTree}
        localSolverTree={localSolverTree}
        onNodeClick={onNodeClick}
      />
    </ReactFlowProvider>
  );
}

function ReactFlowInner({ nodes, edges, setLocalSolverTree, onNodeClick }) {
  const reactFlowInstance = useReactFlow();

  const expandFullTree = useCallback(() => {
    setLocalSolverTree((prevTree) => {
      const newTree = JSON.parse(JSON.stringify(prevTree));
      const revealAllNodes = (node) => {
        node.visible = true;
        if (node.children && node.children.length > 0) {
          node.children.forEach(revealAllNodes);
        }
      };
      revealAllNodes(newTree);
      return newTree;
    });

    setTimeout(() => {
      reactFlowInstance.fitView({ zoom: 0.5, duration: 700 });
    }, 700);
  }, [reactFlowInstance, setLocalSolverTree]);

  const centerOnRoot = useCallback(() => {
    if (nodes.length === 0) return;
    const rootNode = nodes.find((node) => node.id === "root");
    if (!rootNode) return;

    const { x, y } = rootNode.position;
    reactFlowInstance.setCenter(x, y, { zoom: 1.5, duration: 700 });
  }, [reactFlowInstance, nodes]);

  return (
    <div style={{ width: "100%", height: "800px", position: "relative" }}>
      <button
        onClick={expandFullTree}
        style={{
          position: "absolute",
          zIndex: 10,
          top: 10,
          left: 10,
          padding: "10px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Expand Full Tree & Zoom Out
      </button>

      <button
        onClick={centerOnRoot}
        style={{
          position: "absolute",
          zIndex: 10,
          top: 10,
          left: 180,
          padding: "10px",
          background: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Center on Root
      </button>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={(event, node) => onNodeClick(node)}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.01}
        maxZoom={2}
      >
        <CustomMiniMap nodes={nodes} width={200} height={150} />
        <Controls />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
}
