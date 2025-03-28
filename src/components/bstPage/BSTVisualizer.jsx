// src/BSTPage/BSTVisualizer.jsx

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ReactFlow } from "reactflow";
import "reactflow/dist/style.css";
import { AnimatePresence } from "framer-motion";

import styles from "./bst.module.css"; // your custom CSS
import Header from "../Header";
import AnimatedNode from "./AnimateNode"; // the custom node component

// ============ BST LOGIC ============ //
let nodeIdCounter = 0;
class TreeNode {
  constructor(value) {
    this.id = nodeIdCounter++;
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

class BST {
  constructor() {
    this.root = null;
  }

  insert(value) {
    this.root = this._insertNode(this.root, value);
  }

  _insertNode(current, value) {
    if (!current) return new TreeNode(value);
    if (value < current.value) {
      current.left = this._insertNode(current.left, value);
    } else if (value > current.value) {
      current.right = this._insertNode(current.right, value);
    }
    return current;
  }

  delete(value) {
    this.root = this._deleteNode(this.root, value);
  }

  _deleteNode(current, value) {
    if (!current) return null;
    if (value < current.value) {
      current.left = this._deleteNode(current.left, value);
    } else if (value > current.value) {
      current.right = this._deleteNode(current.right, value);
    } else {
      // Found node to delete
      if (!current.left && !current.right) return null;
      if (!current.left) return current.right;
      if (!current.right) return current.left;
      // Two children -> swap with inorder successor
      let successor = current.right;
      while (successor.left) successor = successor.left;
      [current.value, successor.value] = [successor.value, current.value];
      current.right = this._deleteNode(current.right, successor.value);
    }
    return current;
  }

  findNodeById(id) {
    // Helper: find the node with matching id in the BST
    function dfs(node) {
      if (!node) return null;
      if (node.id === id) return node;
      return dfs(node.left) || dfs(node.right);
    }
    return dfs(this.root);
  }

  deleteById(id) {
    const target = this.findNodeById(id);
    if (target) this.delete(target.value);
  }
}

// ====== RECURSIVE LAYOUT FUNCTION ====== //
function buildLayout(node, x = 0, y = 0, xOffset = 240) {
  if (!node) {
    return { nodes: [], edges: [] };
  }

  const thisNode = {
    id: node.id.toString(),
    position: { x, y },
    data: {
      label: node.value.toString(),
      nodeColor: "#22c55e", // green color for the node
    },
    type: "animated", // reference our custom node type
  };

  const leftSubtree = buildLayout(
    node.left,
    x - xOffset,
    y + 120,
    xOffset / 1.6
  );
  const rightSubtree = buildLayout(
    node.right,
    x + xOffset,
    y + 120,
    xOffset / 1.6
  );

  let edges = [];
  if (node.left) {
    edges.push({
      id: `edge-${node.id}-${node.left.id}`,
      source: node.id.toString(),
      target: node.left.id.toString(),
    });
  }
  if (node.right) {
    edges.push({
      id: `edge-${node.id}-${node.right.id}`,
      source: node.id.toString(),
      target: node.right.id.toString(),
    });
  }

  return {
    nodes: [thisNode, ...leftSubtree.nodes, ...rightSubtree.nodes],
    edges: [...edges, ...leftSubtree.edges, ...rightSubtree.edges],
  };
}

// ===== MAIN COMPONENT ===== //
export default function BSTVisualizer() {
  const [tree] = useState(() => new BST());
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [pendingRemovalIds, setPendingRemovalIds] = useState([]);
  const [inputValue, setInputValue] = useState("");

  // Our custom node type
  const nodeTypes = {
    animated: AnimatedNode,
  };

  // Insert by value
  function handleInsert() {
    if (!isNumber(inputValue)) return;
    tree.insert(parseInt(inputValue, 10));
    rebuildFlow();
    setInputValue("");
  }

  // Delete by value
  function handleDelete() {
    if (!isNumber(inputValue)) return;
    tree.delete(parseInt(inputValue, 10));
    rebuildFlow();
    setInputValue("");
  }

  // Node click -> fade out -> delete
  async function handleNodeClick(_, node) {
    const nodeId = node.id;
    setPendingRemovalIds((prev) => [...prev, nodeId]);
    await new Promise((r) => setTimeout(r, 300));
    tree.deleteById(parseInt(nodeId, 10));
    rebuildFlow();
    setPendingRemovalIds((prev) => prev.filter((id) => id !== nodeId));
  }

  function rebuildFlow() {
    if (!tree.root) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const { nodes: builtNodes, edges: builtEdges } = buildLayout(tree.root);
    setNodes(builtNodes);
    setEdges(builtEdges);
  }

  useEffect(() => {
    // Prepopulate with a balanced example
    [50, 30, 70, 20, 40, 60, 80].forEach((val) => tree.insert(val));
    rebuildFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-black text-white min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-16 space-y-16">
        {/* Top Navigation: Previous & Next on the same row */}
        <div className="flex justify-between items-center px-8">
          <Link
            to="/"
            className="group text-red-500 underline hover:text-red-700 transition-all duration-200"
          >
            <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">
              ←
            </span>{" "}
            Previous: Home
          </Link>
          <Link
            to="/minimax"
            className="group text-red-500 underline hover:text-red-700 transition-all duration-200"
          >
            Next: Minimax{" "}
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        {/* Title Section */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold">
            Binary Search Tree <span className="text-green-500">Visualizer</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
            Explore how <span className="text-green-500">BSTs</span> manage{" "}
            <span className="text-green-500"> insertions</span> and{" "}
            <span className="text-green-500"> deletions</span>—similar to how{" "}
            <em>chess engines</em> handle branching data. Click a node to remove it, or{" "}
            use the controls below to customize the tree.
          </p>
        </section>

        {/* ========== Zigzag Section 1 ========== */}
        <section className="md:grid md:grid-cols-2 md:gap-12 items-center">
          {/* Left Text Block */}
          <div className="mb-8 md:mb-0">
            <h2 className="text-2xl font-bold mb-4">
              Why a <span className="text-green-500">BST</span>?
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Tree-based structures are vital for handling hierarchical data.
              While a <em>chess engine</em> often uses more advanced trees (like
              Minimax or NNUE-based), the <strong>BST</strong> is a simpler
              demonstration of how to store numeric values in an ordered way and retrieve them efficiently.
            </p>
            <p className="text-gray-300 leading-relaxed">
              In chess, you might log positions or game states keyed by a numerical hash—conceptually not too far from how a BST might arrange values, branching left for “less” and right for “greater.”
            </p>
          </div>

          {/* Right Visualization + Controls */}
          <div className="bg-gray-900 p-6 rounded-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">Interact With the Tree</h2>

            {/* Input Controls */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-start mb-4 space-y-4 md:space-y-0 md:space-x-4">
              <input
                type="text"
                placeholder="Enter a number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="text-black px-3 py-2 rounded-md"
              />
              <div className="flex space-x-2">
                <button
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  onClick={handleInsert}
                >
                  Insert
                </button>
                <button
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* ReactFlow Visualization (smaller, aligned left, no Controls) */}
            <div
              style={{
                width: "100%",
                height: "300px",
                marginLeft: "0", // flush left
              }}
            >
              <AnimatePresence>
                <ReactFlow
                  nodes={nodes.map((n) =>
                    pendingRemovalIds.includes(n.id)
                      ? { ...n, data: { ...n.data, isPendingRemoval: true } }
                      : n
                  )}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  onNodeClick={handleNodeClick}
                  defaultViewport={{ zoom: 0.75, x: 0, y: 0 }}
                  defaultEdgeOptions={{ type: "straight" }}
                  proOptions={{ hideAttribution: true }}
                  fitView
                  minZoom={0.5}
                  maxZoom={2}
                >
                  {/* Removed <Controls /> to hide the control panel */}
                </ReactFlow>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ========== Zigzag Section 2 (reversed) ========== */}
        <section className="md:grid md:grid-cols-2 md:gap-12 items-center md:grid-flow-col-dense">
          {/* Text Block (right side on larger screens) */}
          <div className="md:col-start-2 mb-8 md:mb-0">
            <h2 className="text-2xl font-bold mb-4">
              Connecting <span className="text-green-500">Chess & BST</span>
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              While chess engines typically deal with a large branching factor, the principle of “order and search” is still at play. Where a BST is strictly numeric, a chess tree uses position evaluation to decide which branch is best.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Gaining familiarity with BSTs will help you appreciate more advanced structures. They demonstrate efficient <em>insertion</em>, <em>deletion</em>, and <em>lookup</em>, which every high-level chess engine must handle in some capacity for storing or retrieving board states.
            </p>
          </div>

          {/* Second Panel */}
          <div className="bg-gray-900 p-6 rounded-md shadow-lg md:col-start-1">
            <h3 className="text-xl font-bold mb-4">Looking Ahead</h3>
            <p className="text-gray-300 mb-4">
              If you enjoyed visualizing insertions and deletions here, consider how these ideas extend to your entire chess engine. Tree-based logic underpins everything from opening books to endgame tablebases. Keep experimenting with BST fundamentals to deepen your understanding.
            </p>
            <p className="text-gray-300">
              For even more depth, visit our
              <span className="text-green-500"> Minimax</span> or
              <span className="text-green-500"> NNUE</span> pages to see how these branching strategies transform raw data into strategic decision-making.
            </p>
          </div>
        </section>

        {/* Bottom Navigation: Previous & Next on the same row */}
        <div className="flex justify-between items-center px-8">
          <Link
            to="/"
            className="group text-red-500 underline hover:text-red-700 transition-all duration-200"
          >
            <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">
              ←
            </span>{" "}
            Previous: Home
          </Link>
          <Link
            to="/minimax"
            className="group text-red-500 underline hover:text-red-700 transition-all duration-200"
          >
            Next: Minimax{" "}
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </main>

      <footer className="text-center py-6 border-t border-gray-800">
        <p className="text-gray-500">
          &copy; 2025 YourNameOrProject. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

// Helper: verify input is a valid number
function isNumber(val) {
  return val.trim() !== "" && !isNaN(val);
}
