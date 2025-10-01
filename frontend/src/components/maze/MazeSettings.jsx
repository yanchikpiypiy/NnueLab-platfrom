import React from 'react';

const MazeSettings = ({
    mazeWidth,
    mazeHeight,
    speed,
    settings,
    onWidthChange,
    onHeightChange,
    onSpeedChange,
    onGenerate,
}) => {
    return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 text-center mt-4">
            <h3 className="text-lg font-semibold mb-3">Maze Settings</h3>

            <div className="mb-4">
                <label className="block text-gray-300 font-medium text-sm mb-1">
                    Width: {mazeWidth}
                </label>
                <input
                    type="range"
                    min={settings.minWidth}
                    max={settings.maxWidth}
                    value={mazeWidth}
                    onChange={(e) => onWidthChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-300 font-medium text-sm mb-1">
                    Height: {mazeHeight}
                </label>
                <input
                    type="range"
                    min={settings.minHeight}
                    max={settings.maxHeight}
                    value={mazeHeight}
                    onChange={(e) => onHeightChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-300 font-medium text-sm mb-1">
                    Speed: {speed}
                </label>
                <input
                    type="range"
                    min={settings.minSpeed}
                    max={settings.maxSpeed}
                    value={speed}
                    onChange={(e) => onSpeedChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
                />
            </div>

            <button
                onClick={onGenerate}
                className="bg-gray-700 text-white font-medium py-2 px-4 rounded hover:bg-gray-600 transition w-full"
            >
                Generate New Maze
      </button>
        </div>
    );
};

export default MazeSettings;
