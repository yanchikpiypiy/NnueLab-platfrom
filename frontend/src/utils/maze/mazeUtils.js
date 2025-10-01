export const createEmptyGrid = (width, height) => {
    const grid = [];
    for (let i = 0; i < height; i++) {
        const row = [];
        for (let j = 0; j < width; j++) {
            row.push('0');
        }
        grid.push(row);
    }
    return grid;
};

export const isFixedCell = (row, col, mazeHeight, mazeWidth) => {
    return (
        (row === 1 && col === 0) ||
        (row === mazeHeight - 2 && col === mazeWidth - 1)
    );
};

export const getCellPosition = (e, rect, effectiveSize, gap) => {
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const colIndex = Math.floor((offsetX + gap / 2) / effectiveSize);
    const rowIndex = Math.floor((offsetY + gap / 2) / effectiveSize);

    return { rowIndex, colIndex };
};

export const isValidCell = (row, col, height, width) => {
    return row >= 0 && row < height && col >= 0 && col < width;
};

export const getCellBackgroundColor = (
    cell,
    rowIndex,
    colIndex,
    mazeHeight,
    mazeWidth
) => {
    // Entrance
    if (rowIndex === 1 && colIndex === 0) {
        return 'lightgreen';
    }
    // Exit
    if (rowIndex === mazeHeight - 2 && colIndex === mazeWidth - 1) {
        return 'tomato';
    }
    // Wall or open
    return cell === '1' ? 'black' : 'white';
};

export const gridToMazeData = (grid) => {
    return grid.map((row) => row.join(''));
};
