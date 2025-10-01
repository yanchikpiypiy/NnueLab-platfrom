import React from 'react';
import { getCellBackgroundColor } from '../../utils/maze/mazeUtils';

const CustomMazeEditor = React.forwardRef(
    (
        {
            customGrid,
            mazeWidth,
            mazeHeight,
            containerWidth,
            containerHeight,
            cellSize,
            gap,
            gridContainerRef,
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onApply,
            onReset,
        },
        ref
    ) => {
        return (
            <section id="custom-maze-editor" className="py-16 px-8" ref={ref}>
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold mb-4 text-center">
                        Custom Maze Editor
          </h2>
                    <p className="text-sm text-center text-gray-300 mb-6">
                        Click or drag on cells to toggle them between wall and open space.{' '}
                        <br />
                        <span className="text-gray-500">
                            Entrance is green (top-left), Exit is red (bottom-right).
            </span>
                    </p>

                    <div
                        style={{
                            width: `${containerWidth}px`,
                            margin: '0 auto',
                        }}
                    >
                        <div
                            ref={gridContainerRef}
                            onPointerDown={onPointerDown}
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerUp}
                            onPointerCancel={onPointerUp}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${mazeWidth}, ${cellSize}px)`,
                                gap: `${gap}px`,
                                width: `${containerWidth}px`,
                                height: `${containerHeight}px`,
                                userSelect: 'none',
                                touchAction: 'none',
                            }}
                        >
                            {customGrid.map((row, rowIndex) =>
                                row.map((cell, colIndex) => {
                                    const bgColor = getCellBackgroundColor(
                                        cell,
                                        rowIndex,
                                        colIndex,
                                        mazeHeight,
                                        mazeWidth
                                    );

                                    return (
                                        <div
                                            key={`${rowIndex}-${colIndex}`}
                                            style={{
                                                width: `${cellSize}px`,
                                                height: `${cellSize}px`,
                                                backgroundColor: bgColor,
                                                border: '1px solid gray',
                                                pointerEvents: 'none',
                                            }}
                                        />
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="text-center mt-6 space-x-4">
                        <button
                            onClick={onApply}
                            className="bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-500 transition"
                        >
                            Apply Custom Maze
            </button>
                        <button
                            onClick={onReset}
                            className="bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-500 transition"
                        >
                            Reset Maze
            </button>
                    </div>
                </div>
            </section>
        );
    }
);

CustomMazeEditor.displayName = 'CustomMazeEditor';

export default CustomMazeEditor;
