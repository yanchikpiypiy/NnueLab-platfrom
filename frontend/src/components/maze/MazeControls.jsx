import React from 'react';

const MazeControls = React.forwardRef(
    ({ onReset, onToggleTraversal, onToggleEditor, isTraversing, showEditor }, ref) => {
        return (
            <div className="flex justify-center space-x-3 mb-4" ref={ref}>
                <button
                    onClick={onReset}
                    className="bg-gray-700 text-white font-medium py-2 px-4 rounded hover:bg-gray-600 transition"
                >
                    Reset traversal
        </button>
                <button
                    onClick={onToggleTraversal}
                    className={`py-2 px-4 font-medium rounded text-white transition ${
                        isTraversing
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-500 hover:bg-green-600'
                        }`}
                >
                    {isTraversing ? 'Stop' : 'Start'}
                </button>
                <button
                    onClick={onToggleEditor}
                    className="bg-violet-800 text-white font-medium py-2 px-4 rounded hover:bg-violet-600 transition"
                >
                    {showEditor ? 'Hide Editor' : 'Custom Editor'}
                </button>
            </div>
        );
    }
);

MazeControls.displayName = 'MazeControls';

export default MazeControls;
