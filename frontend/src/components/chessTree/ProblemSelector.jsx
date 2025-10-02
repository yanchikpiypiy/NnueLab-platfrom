import React from 'react';

const ProblemSelector = ({
    problems,
    selectedIndex,
    onProblemChange
}) => {
    return (
        <div className="problem-selector" style={{ marginBottom: '1rem' }}>
            <label style={{ marginRight: '0.5rem' }}>
                Select Mate in 2 Problem:
      </label>
            <select
                value={selectedIndex}
                onChange={(e) => onProblemChange(parseInt(e.target.value, 10))}
                style={{
                    backgroundColor: '#222',
                    color: 'white',
                    border: '1px solid white',
                    padding: '0.2rem'
                }}
            >
                {problems.map((prob, idx) => (
                    <option key={idx} value={idx}>
                        {prob.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default ProblemSelector;
