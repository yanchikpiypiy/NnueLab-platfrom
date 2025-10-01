import React from 'react';

const SideBar = React.forwardRef(({ whiteTime, blackTime, moveHistory, whiteCaptures, blackCaptures, pieceImages }, ref) => {
  return (
    <aside className="w-full md:w-1/3 bg-[#1c1c1c] text-gray-100 rounded-lg shadow p-8 flex flex-col transform scale-90 mr-20">
      <h3 className="text-4xl font-bold mb-8">Status</h3>
      <div className="mb-8">
        <p className="text-2xl font-semibold">
          White Time: <span className="text-blue-400">{whiteTime}s</span>
        </p>
        <p className="text-2xl font-semibold">
          Black Time: <span className="text-blue-400">{blackTime}s</span>
        </p>
      </div>
      
      {/* Captured Pieces Section */}
      <div className="mb-8">
        <h3 className="text-3xl font-bold mb-4">Captured Pieces</h3>
        <div className="mb-2">
          <p className="text-xl">White Captures:</p>
          <div className="flex space-x-2">
            {whiteCaptures.length === 0 ? (
              <span className="text-gray-400 italic">None</span>
            ) : (
              whiteCaptures.map((cap, index) => (
                <img key={index} src={pieceImages[cap]} alt={cap} className="w-6 h-6 object-contain" />
              ))
            )}
          </div>
        </div>
        <div>
          <p className="text-xl">Black Captures:</p>
          <div className="flex space-x-2">
            {blackCaptures.length === 0 ? (
              <span className="text-gray-400 italic">None</span>
            ) : (
              blackCaptures.map((cap, index) => (
                <img key={index} src={pieceImages[cap]} alt={cap} className="w-6 h-6 object-contain" />
              ))
            )}
          </div>
        </div>
      </div>

      <h3 className="text-3xl font-bold mb-4">Move History</h3>
      <div ref={ref} className="flex-1 overflow-y-auto border border-gray-700 rounded p-4 max-h-64">
        {moveHistory.length === 0 ? (
          <p className="text-gray-400 italic">No moves yet.</p>
        ) : (
          moveHistory.map((move, index) => (
            <p key={index} className="text-lg text-gray-100">
              {index % 2 === 0 ? `${Math.floor(index / 2) + 1}. ` : ''}{move}
            </p>
          ))
        )}
      </div>
    </aside>
  );
});

export default SideBar;
