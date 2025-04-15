// solverTreeToFlow.js
export function solverTreeToFlow(node, parentId = null, index = 0) {
    if (!node) return { nodes: [], edges: [] };
  
    // Create a unique ID: "root" for root; otherwise, "parent-index".
    const id = parentId ? `${parentId}-${index}` : "root";
    const label = node.name || "Start";
    const score = node.attributes?.score ?? "N/A";
    const turn =
      node.fill === "white"
        ? "White"
        : node.fill === "black"
        ? "Black"
        : "Start";
  
    const currentNode = {
      id,
      type: "customNode",
      data: { label, score, turn },
      position: { x: 0, y: 0 },
    };
  
    const currentEdge =
      parentId !== null
        ? [
            {
              id: `e-${parentId}-${id}`,
              source: parentId,
              target: id,
              style: { stroke: "red", strokeWidth: 2 },
              animated: true,
            },
          ]
        : [];
  
    let childNodes = [];
    let childEdges = [];
    if (node.children && node.children.length > 0 && !node.collapsed) {
      node.children.forEach((child, childIndex) => {
        const result = solverTreeToFlow(child, id, childIndex);
        childNodes = childNodes.concat(result.nodes);
        childEdges = childEdges.concat(result.edges);
      });
    }
  
    return {
      nodes: [currentNode, ...childNodes],
      edges: [...currentEdge, ...childEdges],
    };
  }
  