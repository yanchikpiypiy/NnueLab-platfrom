
import { useState, useRef, useCallback, useEffect } from 'react';
import { createEmptyGrid, isFixedCell, getCellPosition, isValidCell } from '../../utils/maze/mazeUtils';
import { CELL_SETTINGS } from '../../constants/maze/algorithms';

export const useMazeEditor = (mazeWidth, mazeHeight) => {
    const gridRef = useRef([]);
    const [customGrid, setCustomGrid] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const animationFrameRef = useRef(null);
    const gridContainerRef = useRef(null);
    const toggledCellsRef = useRef(new Set());

    const { size: cellSize, gap } = CELL_SETTINGS;
    const effectiveSize = cellSize + gap;
    const containerWidth = mazeWidth * cellSize + (mazeWidth - 1) * gap;
    const containerHeight = mazeHeight * cellSize + (mazeHeight - 1) * gap;

    const initCustomGrid = useCallback(() => {
        return createEmptyGrid(mazeWidth, mazeHeight);
    }, [mazeWidth, mazeHeight]);

    useEffect(() => {
        const blank = initCustomGrid();
        gridRef.current = blank;
        setCustomGrid(blank);
    }, [mazeWidth, mazeHeight, initCustomGrid]);

    const toggleCellValue = useCallback((rowIndex, colIndex) => {
        const currentVal = gridRef.current[rowIndex][colIndex];
        const newVal = currentVal === '1' ? '0' : '1';
        gridRef.current[rowIndex][colIndex] = newVal;
    }, []);

    const requestRerender = useCallback(() => {
        if (!animationFrameRef.current) {
            animationFrameRef.current = window.requestAnimationFrame(() => {
                setCustomGrid([...gridRef.current]);
                animationFrameRef.current = null;
            });
        }
    }, []);

    const updateCellFromPointerEvent = useCallback(
        (e) => {
            e.preventDefault();
            const rect = gridContainerRef.current.getBoundingClientRect();
            const { rowIndex, colIndex } = getCellPosition(e, rect, effectiveSize, gap);

            if (!isValidCell(rowIndex, colIndex, mazeHeight, mazeWidth)) {
                return;
            }

            if (isFixedCell(rowIndex, colIndex, mazeHeight, mazeWidth)) {
                return;
            }

            const cellKey = `${rowIndex}-${colIndex}`;
            if (!toggledCellsRef.current.has(cellKey)) {
                toggledCellsRef.current.add(cellKey);
                toggleCellValue(rowIndex, colIndex);
                requestRerender();
            }
        },
        [mazeWidth, mazeHeight, effectiveSize, gap, toggleCellValue, requestRerender]
    );

    const handlePointerDown = useCallback(
        (e) => {
            setIsDrawing(true);
            toggledCellsRef.current = new Set();
            gridContainerRef.current.setPointerCapture(e.pointerId);
            updateCellFromPointerEvent(e);
        },
        [updateCellFromPointerEvent]
    );

    const handlePointerMove = useCallback(
        (e) => {
            if (!isDrawing) return;
            updateCellFromPointerEvent(e);
        },
        [isDrawing, updateCellFromPointerEvent]
    );

    const handlePointerUp = useCallback(
        (e) => {
            setIsDrawing(false);
            toggledCellsRef.current = new Set();
            gridContainerRef.current.releasePointerCapture(e.pointerId);
        },
        []
    );

    const resetGrid = useCallback(() => {
        const blank = initCustomGrid();
        gridRef.current = blank;
        setCustomGrid(blank);
    }, [initCustomGrid]);

    return {
        customGrid,
        gridRef,
        gridContainerRef,
        containerWidth,
        containerHeight,
        cellSize,
        gap,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        resetGrid,
    };
};
