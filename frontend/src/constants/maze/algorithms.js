export const ALGORITHMS = [
    {
        id: 'DFS',
        name: 'Depth-First Search',
        description: 'Explores deeply before backtracking. May not yield shortest path.',
    },
    {
        id: 'BFS',
        name: 'Breadth-First Search',
        description: 'Guaranteed shortest path on unweighted graphs.',
    },
    {
        id: 'A*',
        name: 'A* Search',
        description: 'Combines cost + heuristic for efficient optimal paths.',
    },
    {
        id: 'Dijkstra',
        name: 'Dijkstra Search',
        description: 'Finds shortest paths in weighted graphs with non-negative edges.',
    },
];

export const DEFAULT_MAZE_SETTINGS = {
    width: 40,
    height: 20,
    speed: 100,
    minWidth: 20,
    maxWidth: 40,
    minHeight: 20,
    maxHeight: 40,
    minSpeed: 5,
    maxSpeed: 100,
};

export const CELL_SETTINGS = {
    size: 20,
    gap: 2,
};
