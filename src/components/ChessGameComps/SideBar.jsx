// Sidebar.jsx
import React from 'react';

const Sidebar = React.forwardRef(({ whiteTime, blackTime, moveHistory }, ref) => {
  return (
    <aside className="w-full md:w-1/3 bg-white rounded-lg shadow-lg p-8 flex flex-col">
      <h3 className="text-4xl font-bold mb-8">Status</h3>
      <div className="mb-8">
        <p className="text-2xl font-semibold">
          White Time: <span className="text-blue-600">{whiteTime}s</span>
        </p>
        <p className="text-2xl font-semibold">
          Black Time: <span className="text-blue-600">{blackTime}s</span>
        </p>
      </div>
      <h3 className="text-3xl font-bold mb-4">Move History</h3>
      <div ref={ref} className="flex-1 overflow-y-auto border border-gray-200 rounded p-4 max-h-64">
        {moveHistory.length === 0 ? (
          <p className="text-gray-500 italic">No moves yet.</p>
        ) : (
          moveHistory.map((move, index) => (
            <p key={index} className="text-lg">
              {index % 2 === 0 ? `${Math.floor(index / 2) + 1}. ` : ''}{move}
            </p>
          ))
        )}
      </div>
    </aside>
  );
});

export default Sidebar;
