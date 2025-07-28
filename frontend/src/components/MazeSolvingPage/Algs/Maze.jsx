import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import './Maze.css'
const Maze = () => {
  const [maze, setMaze] = useState([]);

  useEffect(() => {
    fetch("/maze.txt")
      .then((response) => response.text())
      .then((data) => {
        const mazeArray = data
          .trim()
          .split("\n")
          .map((row) => row.trimEnd().split(""));
        setMaze(mazeArray);
      });
  }, []);

  return (
    <div className="maze-wrapper">
      <motion.div
        className="maze-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          gridTemplateColumns: `repeat(${maze[0]?.length || 1}, 10px)`,
        }}
      >
        {maze.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {row.map((cell, colIndex) => (
              <motion.div
                key={colIndex}
                className={`maze-cell ${cell === "1" ? "wall" : "path"}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (rowIndex * maze[0].length + colIndex) * 0.002 }}
              />
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};

export default Maze;
