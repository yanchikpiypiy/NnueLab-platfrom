// MazeBenchmarks.jsx
import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import MazeDFS from '../Algs/MazeDFS';
import MazeBFS from '../Algs/MazeBfs';
import MazeDijkstra from '../Algs/MazeDijkstra';
import MazeAStar from '../Algs/MazeAStar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MazeBenchmarks = ({ mazeData, mazeGeneration }) => {
  const [benchmarkRunning, setBenchmarkRunning] = useState(false);
  const [benchmarks, setBenchmarks] = useState({
    DFS: [],
    BFS: [],
    Dijkstra: [],
    "A-star": [],
  });
  const [runtimeChartData, setRuntimeChartData] = useState(null);
  const [stepsChartData, setStepsChartData] = useState(null);

  // Helper: runs a given algorithm multiple times and averages the runtime.
  // Now, instead of pathLength, we record stepsTaken.
  const runAlgorithmBenchmark = async (algorithm) => {
    if (!mazeData) throw new Error("No maze data available");
    const iterations = 10;
    let totalRuntime = 0;
    let stepsTaken = 0;
    for (let i = 0; i < iterations; i++) {
      let result;
      switch (algorithm) {
        case "DFS":
          result = await MazeDFS.solveMaze(mazeData);
          break;
        case "BFS":
          result = await MazeBFS.solveMaze(mazeData);
          break;
        case "Dijkstra":
          result = await MazeDijkstra.solveMaze(mazeData);
          break;
        case "A-star":
          result = await MazeAStar.solveMaze(mazeData);
          break;
        default:
          throw new Error(`Unknown algorithm: ${algorithm}`);
      }
      totalRuntime += result.runtime;
      // Assume the number of steps taken is consistent across iterations.
      if (i === 0) stepsTaken = result.stepsTaken;
    }
    // Use toFixed(7) for higher precision then parseFloat to convert back to a number.
    const averageRuntime = parseFloat((totalRuntime / iterations).toFixed(7));
    return { runtime: averageRuntime, stepsTaken };
  };

  // Runs benchmarks on all algorithms and appends new results.
  const runBenchmarks = async () => {
    if (!mazeData) return;
    setBenchmarkRunning(true);
    const algorithms = ["DFS", "BFS", "Dijkstra", "A-star"];
    const runtimeResults = {};
    const stepsResults = {};

    for (const algorithm of algorithms) {
      try {
        const result = await runAlgorithmBenchmark(algorithm);
        runtimeResults[algorithm] = result.runtime;
        stepsResults[algorithm] = result.stepsTaken;
      } catch (error) {
        console.error(`Benchmark error for ${algorithm}:`, error);
        runtimeResults[algorithm] = null;
        stepsResults[algorithm] = null;
      }
    }

    setBenchmarks((prev) => {
      const updated = { ...prev };
      algorithms.forEach((algorithm) => {
        updated[algorithm] = [
          ...prev[algorithm],
          {
            mazeId: mazeGeneration,
            runtime: runtimeResults[algorithm],
            stepsTaken: stepsResults[algorithm],
          },
        ];
      });
      return updated;
    });
    setBenchmarkRunning(false);
  };

  // Update chart data when benchmarks change.
  useEffect(() => {
    // Create labels based on the DFS benchmark runs.
    // Each label will be "Maze {mazeId} - Run {n}".
    const labels = [];
    const runCount = benchmarks["DFS"].length;
    const mazeRunCount = {};
    for (let i = 0; i < runCount; i++) {
      const { mazeId } = benchmarks["DFS"][i];
      mazeRunCount[mazeId] = (mazeRunCount[mazeId] || 0) + 1;
      labels.push(`Maze ${mazeId - 1} - Run ${mazeRunCount[mazeId]}`);
    }

    // Build runtime chart dataset.
    const runtimeDatasets = Object.entries(benchmarks).map(([algorithm, data]) => {
      let color;
      switch (algorithm) {
        case "DFS":
          color = 'rgba(75,192,192,1)';
          break;
        case "BFS":
          color = 'rgba(255,99,132,1)';
          break;
        case "Dijkstra":
          color = 'rgba(54,162,235,1)';
          break;
        case "A-star":
          color = 'rgba(153,102,255,1)';
          break;
        default:
          color = 'rgba(0,0,0,1)';
      }
      return {
        label: algorithm,
        data: data.map(run => run.runtime),
        fill: false,
        borderColor: color,
      };
    });
    setRuntimeChartData({
      labels,
      datasets: runtimeDatasets,
    });

    // Build steps chart dataset.
    const stepsDatasets = Object.entries(benchmarks).map(([algorithm, data]) => {
      let color;
      switch (algorithm) {
        case "DFS":
          color = 'rgba(75,192,192,0.6)';
          break;
        case "BFS":
          color = 'rgba(255,99,132,0.6)';
          break;
        case "Dijkstra":
          color = 'rgba(54,162,235,0.6)';
          break;
        case "A-star":
          color = 'rgba(153,102,255,0.6)';
          break;
        default:
          color = 'rgba(0,0,0,0.6)';
      }
      return {
        label: algorithm,
        data: data.map(run => run.stepsTaken),
        backgroundColor: color,
      };
    });
    setStepsChartData({
      labels,
      datasets: stepsDatasets,
    });
  }, [benchmarks]);

  // Chart options with higher precision for runtime values.
  const runtimeOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Runtime Comparison (ms) Across Benchmark Runs' },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(7);
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: function (value) {
            return value.toFixed(7);
          },
        },
      },
    },
  };

  const stepsOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Steps Taken Across Benchmark Runs' },
    },
  };

  return (
    <div className="py-16 px-8">
      <h2 className="text-3xl font-bold mb-6 text-center">Performance Benchmarks</h2>
      <div className="flex justify-center mb-4">
        <button
          onClick={runBenchmarks}
          className="bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700 transition"
          disabled={benchmarkRunning}
        >
          {benchmarkRunning ? "Running Benchmarks..." : "Run Benchmarks"}
        </button>
      </div>
      <div className="space-y-6">
        {/* Runtime Chart */}
        <div className="p-6 border border-gray-200 rounded">
          <h3 className="text-xl font-semibold mb-2">Runtime Comparison</h3>
          <p className="text-gray-700">
            Compare the runtime of each algorithm across benchmark runs.
          </p>
          <div className="w-full h-64">
            {benchmarkRunning ? (
              <p className="text-center text-gray-500">Running benchmarks...</p>
            ) : runtimeChartData ? (
              <Line data={runtimeChartData} options={runtimeOptions} />
            ) : (
              <p className="text-center text-gray-500">
                No benchmark data. Click "Run Benchmarks" to generate data.
              </p>
            )}
          </div>
        </div>
        {/* Steps Taken Chart */}
        <div className="p-6 border border-gray-200 rounded">
          <h3 className="text-xl font-semibold mb-2">Steps Taken</h3>
          <p className="text-gray-700">
            Compare the number of steps (nodes processed) taken by each algorithm across benchmark runs.
          </p>
          <div className="w-full h-64">
            {benchmarkRunning ? (
              <p className="text-center text-gray-500">Running benchmarks...</p>
            ) : stepsChartData ? (
              <Bar data={stepsChartData} options={stepsOptions} />
            ) : (
              <p className="text-center text-gray-500">
                No benchmark data. Click "Run Benchmarks" to generate data.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MazeBenchmarks;
