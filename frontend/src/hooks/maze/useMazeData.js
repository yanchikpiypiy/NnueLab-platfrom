import { useState, useEffect, useCallback } from 'react';
import { mazeAPI } from '../../services/maze/mazeAPI';

export const useMazeData = (mazeWidth, mazeHeight) => {
    const [mazeData, setMazeData] = useState(null);
    const [mazeGeneration, setMazeGeneration] = useState(0);
    const [resetCounter, setResetCounter] = useState(0);
    const [stopTraversal, setStopTraversal] = useState(false);

    const generateMaze = useCallback(async () => {
        try {
            const rows = await mazeAPI.generateMaze(mazeWidth, mazeHeight);
            setMazeData(rows);
            setMazeGeneration((prev) => prev + 1);
        } catch (error) {
            console.error('Failed to generate maze:', error);
        }
    }, [mazeWidth, mazeHeight]);

    useEffect(() => {
        generateMaze();
    }, [generateMaze]);

    const handleReset = useCallback(() => {
        setResetCounter((prev) => prev + 1);
    }, []);

    const handleGenerate = useCallback(() => {
        generateMaze();
        handleReset();
        setStopTraversal(false);
    }, [generateMaze, handleReset]);

    const toggleTraversal = useCallback(() => {
        setStopTraversal((prev) => !prev);
    }, []);

    const applyCustomMaze = useCallback((customMazeRows) => {
        setStopTraversal((prev) => !prev);
        setResetCounter((prev) => prev + 1);
        setMazeData(customMazeRows);
        setMazeGeneration((prev) => prev + 1);
        setStopTraversal(false);
    }, []);

    return {
        mazeData,
        mazeGeneration,
        resetCounter,
        stopTraversal,
        generateMaze,
        handleReset,
        handleGenerate,
        toggleTraversal,
        applyCustomMaze,
    };
};
