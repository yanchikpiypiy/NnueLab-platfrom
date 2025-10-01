import React from 'react';

const EngineSelector = ({ engineChoice, setEngineChoice, gameStarted }) => {
    const engines = [
        {
            id: 'stockfish',
            name: 'Stockfish',
            description: 'Stockfish Engine',
            bgColor: 'bg-blue-600',
            borderColor: 'border-blue-600',
        },
        {
            id: 'yunfish',
            name: 'Sunfish Improvement',
            description: 'My Own Engine',
            bgColor: 'bg-green-600',
            borderColor: 'border-green-600',
        },
    ];

    return (
        <div className="flex gap-4 justify-center mb-4 px-4">
            {engines.map((engine) => (
                <div
                    key={engine.id}
                    className={`cursor-pointer border rounded p-4 transition transform duration-200 
            hover:shadow-xl hover:-translate-y-1 
            ${
                        engineChoice === engine.id
                            ? `shadow-xl -translate-y-1 ${engine.bgColor} ${engine.borderColor} text-white`
                            : 'bg-gray-800 border-gray-700'
                        } 
            ${gameStarted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => {
                        if (!gameStarted) {
                            setEngineChoice(engine.id);
                        }
                    }}
                >
                    <h3 className="text-xl font-bold">{engine.name}</h3>
                    <p className="text-sm">{engine.description}</p>
                </div>
            ))}
        </div>
    );
};

export default EngineSelector;
