import { useState } from 'react';
import { DEFAULT_MAZE_SETTINGS } from '../../constants/maze/algorithms';

export const useMazeSettings = () => {
    const [mazeWidth, setMazeWidth] = useState(DEFAULT_MAZE_SETTINGS.width);
    const [mazeHeight, setMazeHeight] = useState(DEFAULT_MAZE_SETTINGS.height);
    const [speed, setSpeed] = useState(DEFAULT_MAZE_SETTINGS.speed);

    return {
        mazeWidth,
        mazeHeight,
        speed,
        setMazeWidth,
        setMazeHeight,
        setSpeed,
        settings: DEFAULT_MAZE_SETTINGS,
    };
};
