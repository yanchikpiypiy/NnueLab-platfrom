import React from 'react';
import AlgorithmCard from './AlgorithmCard';
import { ALGORITHMS } from '../../constants/maze/algorithms';

const AlgorithmSelector = ({ selectedAlgorithm, onAlgorithmChange }) => {
    return (
        <section id="algorithms" className="py-16 px-8">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold mb-6 text-center">Algorithm Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {ALGORITHMS.map((algorithm) => (
                        <AlgorithmCard
                            key={algorithm.id}
                            algorithm={algorithm}
                            isSelected={selectedAlgorithm === algorithm.id}
                            onSelect={onAlgorithmChange}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AlgorithmSelector;
