import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tree, TreeNode } from "react-organizational-chart";
import { CheckCircle, XCircle } from "lucide-react";

const Node = ({ value }) => (
  <motion.div
    whileHover={{ scale: 1.2 }}
    className="bg-blue-500 text-white p-2 rounded-xl shadow-md text-center"
  >
    {value}
  </motion.div>
);

const BSTVisualizer = () => {
  const [tree, setTree] = useState(null);
  const [inputValue, setInputValue] = useState("");

  class BSTNode {
    constructor(value) {
      this.value = value;
      this.left = null;
      this.right = null;
    }

    insert(newValue) {
      if (newValue < this.value) {
        if (this.left) this.left.insert(newValue);
        else this.left = new BSTNode(newValue);
      } else {
        if (this.right) this.right.insert(newValue);
        else this.right = new BSTNode(newValue);
      }
    }
  }

  const addNode = () => {
    const value = parseInt(inputValue);
    if (!isNaN(value)) {
      if (!tree) setTree(new BSTNode(value));
      else {
        const newTree = Object.assign(new BSTNode(tree.value), tree);
        newTree.insert(value);
        setTree(newTree);
      }
      setInputValue("");
    }
  };

  const renderTree = (node) => {
    if (!node) return null;
    return (
      <TreeNode label={<Node value={node.value} />}>
        {node.left && renderTree(node.left)}
        {node.right && renderTree(node.right)}
      </TreeNode>
    );
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-4">Binary Search Tree Visualizer</h1>
      <Card className="p-4 shadow-xl rounded-2xl bg-gray-100">
        <CardContent className="flex flex-col gap-4 items-center">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter a number"
            className="text-center"
          />
          <Button onClick={addNode} className="bg-green-500 hover:bg-green-600">
            Insert Node
          </Button>
        </CardContent>
      </Card>
      <div className="mt-6 p-4 bg-white shadow-md rounded-xl">
        {tree ? (
          <Tree label={<Node value={tree.value} />}>{renderTree(tree)}</Tree>
        ) : (
          <p className="text-gray-500">No nodes added yet.</p>
        )}
      </div>
    </div>
  );
};

export default BSTVisualizer;
