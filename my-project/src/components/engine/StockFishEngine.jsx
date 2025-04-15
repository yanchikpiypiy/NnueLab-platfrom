// StockFishEngine.jsx
import { useEffect, useRef } from 'react';

const StockfishEngine = ({ fen, depth = 15, onBestMove }) => {
  const stockfishRef = useRef(null);

  // Create the worker only once when the component mounts.
  useEffect(() => {
    if (!stockfishRef.current) {
      stockfishRef.current = new Worker('/stockfish.js');
      console.log("Stockfish worker created");
      stockfishRef.current.onmessage = (event) => {
        const line = event.data;
        console.log("Stockfish output:", line);
        if (line.startsWith("bestmove")) {
          const bestMove = line.split(" ")[1];
          console.log("Bestmove extracted:", bestMove);
          if (bestMove && bestMove !== "(none)") {
            onBestMove(bestMove);
          }
        }
      };
    }
    return () => {
      // Terminate the worker only if the component unmounts.
      if (stockfishRef.current) {
        stockfishRef.current.terminate();
        stockfishRef.current = null;
      }
    };
  }, [onBestMove]);

  // Whenever the FEN changes, send it to Stockfish.
  useEffect(() => {
    if (fen && stockfishRef.current) {
      console.log("Sending to Stockfish: position fen", fen);
      stockfishRef.current.postMessage(`position fen ${fen}`);
      stockfishRef.current.postMessage(`go depth ${depth}`);
    }
  }, [fen, depth]);

  return null; // No visible UI
};

export default StockfishEngine;
