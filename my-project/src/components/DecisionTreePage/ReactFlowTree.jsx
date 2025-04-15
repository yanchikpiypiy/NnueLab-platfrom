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

const nodeTypes = { customNode: CustomNode };

const nodeWidth = 90;  
const nodeHeight = 100; 

const getLayoutedElements = (nodes, edges, direction = "TB") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 200,
    ranksep: 300,
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

export default function ReactFlowTree({ treeData, onNodeClick = () => {}, onNodeDoubleClick = () => {} }) {
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
        onNodeDoubleClick={onNodeDoubleClick}  // <-- pass the prop down
      />
    </ReactFlowProvider>
  );
}

function ReactFlowInner({ nodes, edges, setLocalSolverTree, localSolverTree, onNodeClick, onNodeDoubleClick }) {
  const reactFlowInstance = useReactFlow();

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

      <div className="w-full h-screen bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeDoubleClick={(event, node) => {
          console.log("Global onNodeDoubleClick fired for:", node);
          onNodeDoubleClick(event, node);
        }}
        fitView
        minZoom={0.01}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
      </ReactFlow>
  <Controls />





      </div>
    </div>
  );
}
