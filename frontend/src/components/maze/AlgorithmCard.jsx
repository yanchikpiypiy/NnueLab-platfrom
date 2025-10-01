import React from 'react';

const AlgorithmCard = ({ algorithm, isSelected, onSelect }) => {
    const cardClasses = `p-6 border border-gray-600 rounded transition transform duration-300 cursor-pointer hover:scale-105 active:scale-95 ${
        isSelected ? 'bg-gray-700 -translate-y-2 white-shadow' : 'bg-gray-800'
        }`;

    return (
        <div className={cardClasses} onClick={() => onSelect(algorithm.id)}>
            <h3 className="text-2xl font-semibold mb-2">{algorithm.name}</h3>
            <p className="text-gray-300 text-sm">{algorithm.description}</p>
        </div>
    );
};

export default AlgorithmCard;
