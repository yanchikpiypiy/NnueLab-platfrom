// AISettings.jsx
import React from 'react';

const AiSettings = ({ aiDepth, aiMoveTime, setAIDepth, setAIMoveTime }) => {
  return (
    <section className="container mx-auto px-8 py-6 bg-[#1c1c1c] text-gray-100 rounded-lg shadow mb-6">
      <h3 className="text-2xl font-bold mb-4">AI Settings</h3>
      <div className="flex flex-wrap gap-6">
        <div>
          <label className="block text-lg font-medium mb-1">Search Depth</label>
          <input
            type="number"
            min="1"
            value={aiDepth}
            onChange={(e) => setAIDepth(parseInt(e.target.value, 10))}
            className="w-24 bg-[#2a2a2a] border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-100"
          />
        </div>
        <div>
          <label className="block text-lg font-medium mb-1">Move Time (ms)</label>
          <input
            type="number"
            min="100"
            value={aiMoveTime}
            onChange={(e) => setAIMoveTime(parseInt(e.target.value, 10))}
            className="w-24 bg-[#2a2a2a] border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-100"
          />
        </div>
      </div>
    </section>
  );
};

export default AiSettings;
