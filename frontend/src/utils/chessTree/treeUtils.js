export const assignHierarchicalIds = (node) => {
    node.id = "root";
    if (node.children && node.children.length > 0) {
        node.children.forEach((child, index) => {
            child.id = `root-${index}`;
            assignIdsRecursively(child, child.id);
        });
    }
};

const assignIdsRecursively = (node, parentId) => {
    if (node.children && node.children.length > 0) {
        node.children.forEach((child, index) => {
            child.id = `${parentId}-${index}`;
            assignIdsRecursively(child, child.id);
        });
    }
};

export const bfsCollectNodes = (tree) => {
    // Import from your helpers file or reimplement
    const queue = [tree];
    const nodes = [];

    while (queue.length > 0) {
        const node = queue.shift();
        nodes.push(node);

        if (node.children) {
            queue.push(...node.children);
        }
    }

    return nodes;
};

export const revealAllNodes = (node) => {
    node.visible = true;
    if (node.children && node.children.length > 0) {
        node.children.forEach(revealAllNodes);
    }
};

export const toggleNodeVisibility = (nodeObj, targetId) => {
    if (nodeObj.id === targetId) {
        if (nodeObj.children && nodeObj.children.length > 0) {
            const expanded = nodeObj.children[0].visible;
            nodeObj.children.forEach(child => {
                child.visible = !expanded;
            });
        }
        return true;
    }

    if (nodeObj.children) {
        for (const child of nodeObj.children) {
            if (toggleNodeVisibility(child, targetId)) {
                return true;
            }
        }
    }

    return false;
};
