export const fenToPosition = (fen) => {
    const [piecePlacement] = fen.split(" ");
    const rows = piecePlacement.split("/");
    const position = {};
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    rows.forEach((row, r) => {
        let fileIndex = 0;
        for (const char of row) {
            if (!isNaN(char)) {
                fileIndex += parseInt(char, 10);
            } else {
                const rank = 8 - r;
                const square = files[fileIndex] + rank;
                position[square] = char === char.toUpperCase()
                    ? "w" + char
                    : "b" + char.toUpperCase();
                fileIndex++;
            }
        }
    });

    return position;
};

export const objectToFEN = (positionObj) => {
    // Import from your helpers file or reimplement here
    // This is a placeholder - use your actual implementation
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
    let fenRows = [];

    for (const rank of ranks) {
        let row = '';
        let emptyCount = 0;

        for (const file of files) {
            const square = file + rank;
            const piece = positionObj[square];

            if (piece) {
                if (emptyCount > 0) {
                    row += emptyCount;
                    emptyCount = 0;
                }
                const color = piece[0];
                const type = piece[1];
                row += color === 'w' ? type : type.toLowerCase();
            } else {
                emptyCount++;
            }
        }

        if (emptyCount > 0) {
            row += emptyCount;
        }

        fenRows.push(row);
    }

    return fenRows.join('/') + ' w - - 0 1';
};
