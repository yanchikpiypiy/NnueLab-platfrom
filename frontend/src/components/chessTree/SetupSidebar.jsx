import React from 'react';
import ProblemSelector from './ProblemSelector';

const SetupSidebar = ({
    problems,
    selectedIndex,
    onProblemChange
}) => {
    return (
        <div
            className="setup-sidebar"
            style={{
                backgroundColor: '#222',
                padding: '1rem',
                borderRadius: '4px',
                color: 'white',
                minWidth: '200px'
            }}
        >
            <ProblemSelector
                problems={problems}
                selectedIndex={selectedIndex}
                onProblemChange={onProblemChange}
            />
        </div>
    );
};

export default SetupSidebar;
