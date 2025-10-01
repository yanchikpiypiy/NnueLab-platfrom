import React, { useState, useRef, useEffect } from 'react';
import Header from '../../components/Header';
import MazeBFS from '../../components/maze/Algs/MazeBfs';
import MazeDFS from '../../components/maze/Algs/MazeDFS';
import MazeDijkstra from '../../components/maze/Algs/MazeDijkstra';
import MazeAStar from '../../components/maze/Algs/MazeAStar';
import Benchmark from '../../components/maze/BenchMarks/Benchmark';
import AlgorithmSelector from '../../components/maze/AlgorithmSelector';
import MazeControls from '../../components/maze/MazeControls';
import MazeSettings from '../../components/maze/MazeSettings';
import CustomMazeEditor from '../../components/maze/CustomMazeEditor';
import { useMazeSettings } from '../../hooks/maze/useMazeSettings';
import { useMazeData } from '../../hooks/maze/useMazeData';
import { useMazeEditor } from '../../hooks/maze/useMazeEditor';
import { gridToMazeData } from '../../utils/maze/mazeUtils';

const MazeSolvingPage = () => {
    const [alg, setAlg] = useState('DFS');
    const [showCustomEditor, setShowCustomEditor] = useState(false);

    const customEditorRef = useRef(null);
    const demoControlsRef = useRef(null);

    // Custom hooks
    const {
        mazeWidth,
        mazeHeight,
        speed,
        setMazeWidth,
        setMazeHeight,
        setSpeed,
        settings,
    } = useMazeSettings();

    const {
        mazeData,
        mazeGeneration,
        resetCounter,
        stopTraversal,
        generateMaze,
        handleReset,
        handleGenerate,
        toggleTraversal,
        applyCustomMaze,
    } = useMazeData(mazeWidth, mazeHeight);

    const {
        customGrid,
        gridRef,
        gridContainerRef,
        containerWidth,
        containerHeight,
        cellSize,
        gap,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        resetGrid,
    } = useMazeEditor(mazeWidth, mazeHeight);

    // Scroll to controls when algorithm changes
    const handleAlgChange = (selectedAlg) => {
        setAlg(selectedAlg);
        setTimeout(() => {
            if (demoControlsRef.current) {
                demoControlsRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    // Toggle custom editor and scroll
    const handleToggleCustomEditor = () => {
        if (!showCustomEditor) {
            setShowCustomEditor(true);
            setTimeout(() => {
                if (customEditorRef.current) {
                    customEditorRef.current.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        } else {
            setShowCustomEditor(false);
        }
    };

    // Apply custom maze
    const handleApplyCustomMaze = () => {
        const rows = gridToMazeData(gridRef.current);
        applyCustomMaze(rows);
    };

    // Reset custom maze
    const handleResetCustomMaze = () => {
        handleReset();
        resetGrid();
        generateMaze();
    };

    // Render appropriate algorithm component
    const renderAlgorithmComponent = () => {
        const key = `${alg}-${mazeGeneration}-${resetCounter}`;
        const props = {
            key,
            mazeData,
            resetCounter,
            startTraversal: stopTraversal,
            speed,
        };

        switch (alg) {
            case 'DFS':
                return <MazeDFS {...props} />;
            case 'BFS':
                return <MazeBFS {...props} />;
            case 'Dijkstra':
                return <MazeDijkstra {...props} />;
            case 'A*':
                return <MazeAStar {...props} />;
            default:
                return <MazeDFS {...props} />;
        }
    };

    return (
        <div className="min-h-screen bg-black">
            <Header />

            {/* Algorithm Selection */}
            <AlgorithmSelector
                selectedAlgorithm={alg}
                onAlgorithmChange={handleAlgChange}
            />

            {/* Maze Demo */}
            <section id="demo" className="py-16 px-8">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold mb-6 text-center">
                        Interactive Maze Demo
          </h2>

                    <div className="w-full flex items-center justify-center rounded text-black bg-white shadow">
                        {renderAlgorithmComponent()}
                    </div>

                    <div className="mt-6 mx-auto w-full max-w-md">
                        <MazeControls
                            ref={demoControlsRef}
                            onReset={handleReset}
                            onToggleTraversal={toggleTraversal}
                            onToggleEditor={handleToggleCustomEditor}
                            isTraversing={stopTraversal}
                            showEditor={showCustomEditor}
                        />

                        <MazeSettings
                            mazeWidth={mazeWidth}
                            mazeHeight={mazeHeight}
                            speed={speed}
                            settings={settings}
                            onWidthChange={setMazeWidth}
                            onHeightChange={setMazeHeight}
                            onSpeedChange={setSpeed}
                            onGenerate={handleGenerate}
                        />
                    </div>
                </div>
            </section>

            {/* Custom Maze Editor */}
            {showCustomEditor && (
                <CustomMazeEditor
                    ref={customEditorRef}
                    customGrid={customGrid}
                    mazeWidth={mazeWidth}
                    mazeHeight={mazeHeight}
                    containerWidth={containerWidth}
                    containerHeight={containerHeight}
                    cellSize={cellSize}
                    gap={gap}
                    gridContainerRef={gridContainerRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onApply={handleApplyCustomMaze}
                    onReset={handleResetCustomMaze}
                />
            )}

            {/* Benchmarks */}
            <section id="benchmarks" className="py-16 px-8">
                <div className="max-w-5xl mx-auto text-white">
                    <Benchmark mazeData={mazeData} mazeGeneration={mazeGeneration} />
                </div>
            </section>
        </div>
    );
};

export default MazeSolvingPage;
