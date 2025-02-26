import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Chess } from 'chess.js'; // npm install chess.js
import StockfishGraphEngine from './engine/StockfishGraphEngine';
import Header from '../Header';

// Mapping of piece codes to image URLs.
const pieceImages = {
  wK: '/images/chess/wK.png',
  wQ: '/images/chess/wQ.png',
  wR: '/images/chess/wR.png',
  wB: '/images/chess/wB.png',
  wN: '/images/chess/wN.png',
  wP: '/images/chess/wP.png',
  bK: '/images/chess/bK.png',
  bQ: '/images/chess/bQ.png',
  bR: '/images/chess/bR.png',
  bB: '/images/chess/bB.png',
  bN: '/images/chess/bN.png',
  bP: '/images/chess/bP.png',
};

// Renders an 8×8 board from a FEN string.
const renderBoard = (fen) => {
  const boardPart = fen.split(" ")[0];
  const rows = boardPart.split("/");
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(8, 80px)',
      width: '640px',
      height: '640px',
      border: '2px solid #333'
    }}>
      {rows.map((row, i) => {
        let squares = [];
        for (let char of row) {
          if (!isNaN(char)) {
            for (let j = 0; j < parseInt(char, 10); j++) {
              squares.push(null);
            }
          } else {
            squares.push(char);
          }
        }
        return squares.map((piece, j) => {
          const isLight = (i + j) % 2 === 0;
          return (
            <div
              key={`${i}-${j}`}
              style={{
                width: '80px',
                height: '80px',
                background: isLight ? '#f0d9b5' : '#b58863',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              {piece && (
                <img
                  src={pieceImages[
                    piece === piece.toUpperCase() ? 'w' + piece : 'b' + piece.toUpperCase()
                  ]}
                  alt={piece}
                  style={{ width: '70px', height: '70px' }}
                />
              )}
            </div>
          );
        });
      })}
    </div>
  );
};

// Helper: Given a square string (e.g. "e2"), returns its center coordinates in the 640×640 board.
const squareCoords = (square) => {
  if (!square || square.length < 2) return null;
  const file = square[0];
  const rank = square[1];
  if (!file || !rank || isNaN(parseInt(rank, 10))) return null;
  const fileIndex = file.charCodeAt(0) - 'a'.charCodeAt(0);
  const rankIndex = 8 - parseInt(rank, 10);
  return {
    x: fileIndex * 80 + 40,
    y: rankIndex * 80 + 40
  };
};

const ChessDecisionTreePage = () => {
  // A small set of interesting FENs so you can click "Next Position" to see different lines.
  const fens = [
    "6k1/5ppp/8/8/3Q4/8/5PPP/6K1 w - - 0 1", // mate-in-2 example
    "6k1/5ppp/8/8/3Q4/8/5PPP/6K1 w - - 0 1",
    "6k1/5ppp/8/8/3Q4/8/5PPP/6K1 w - - 0 1",
    "6k1/5ppp/8/8/3Q4/8/5PPP/6K1 w - - 0 1",
  ];
  const [fenIndex, setFenIndex] = useState(0);
  const engineFen = fens[fenIndex];

  // Stockfish candidate moves.
  const [candidates, setCandidates] = useState([]);
  // Force re-creation of the Stockfish engine (in case you want to re-run).
  const [analysisKey, setAnalysisKey] = useState(0);
  const [whiteChain, setWhiteChain] = useState(null);
  const prevChainStrRef = useRef(null);

  // Move on to the next position in the list.
  const nextPosition = () => {
    setFenIndex((fenIndex + 1) % fens.length);
    // Also reset analysis data so we get a fresh search.
    setCandidates([]);
    setWhiteChain(null);
    setAnalysisKey(prev => prev + 1);
    console.log("Switched to next FEN:", fens[(fenIndex + 1) % fens.length]);
  };

  // Callback from Stockfish: multiPV best moves returned here.
  const handleBestMove = (moveData) => {
    if (!moveData) return;
    console.log("Candidates received:", moveData);
    setCandidates(moveData);
  };

  // From the first candidate line, parse the first 3 valid moves: White, Black, White.
  useEffect(() => {
    if (!candidates || candidates.length === 0) return;
    const validMoveRegex = /^[a-h][1-8][a-h][1-8][qrbn]?$/i;
    const candidate = candidates[0];
    const moves = candidate.moves
      .map(m => String(m).trim())
      .filter(m => validMoveRegex.test(m));
    if (moves.length < 3) return;
    const chain = {
      origin: moves[0].substring(0, 2),
      whiteMove: moves[0],
      blackMove: moves[1],
      whiteMove2: moves[2]
    };
    const chainStr = JSON.stringify(chain);
    if (prevChainStrRef.current !== chainStr) {
      prevChainStrRef.current = chainStr;
      setWhiteChain(chain);
    }
  }, [candidates]);

  // Draw exactly 3 arrows: White move (green), Black move (red), White mate (green).
  useEffect(() => {
    const svg = d3.select("#arrow-overlay");
    svg.selectAll("*").remove();
    if (!whiteChain) return;

    const tasks = [
      { type: "white1", move: whiteChain.whiteMove },
      { type: "black", move: whiteChain.blackMove },
      { type: "white2", move: whiteChain.whiteMove2 }
    ];

    // We'll use setTimeout to animate them in sequence, but a short delay is enough.
    const arrowDelay = 300;
    tasks.forEach((task, index) => {
      setTimeout(() => {
        drawArrow(task);
      }, index * arrowDelay);
    });

    function drawArrow(task) {
      const tempChess = new Chess(engineFen);
      if (task.type === "white1") {
        // White's first move
        const moveObj = tempChess.move(task.move, { sloppy: true });
        if (!moveObj) return;
        drawLine(moveObj.from, moveObj.to, "green", "arrowMarker-white1");
      } else if (task.type === "black") {
        // White's first move, then black's move
        tempChess.move(whiteChain.whiteMove, { sloppy: true });
        const moveObj = tempChess.move(task.move, { sloppy: true });
        if (!moveObj) return;
        drawLine(moveObj.from, moveObj.to, "red", "arrowMarker-black");
      } else if (task.type === "white2") {
        // White's first, black's, then second white move
        tempChess.move(whiteChain.whiteMove, { sloppy: true });
        tempChess.move(whiteChain.blackMove, { sloppy: true });
        const moveObj = tempChess.move(task.move, { sloppy: true });
        if (!moveObj) return;
        drawLine(moveObj.from, moveObj.to, "green", "arrowMarker-white2");
      }
    }

    function drawLine(from, to, color, markerId) {
      const start = squareCoords(from);
      const end = squareCoords(to);
      if (!start || !end) return;
      const markerSize = 5;
      const strokeWidth = 8;

      // Append a marker definition
      svg.append("defs").append("marker")
        .attr("id", markerId)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", markerSize * 0.75)
        .attr("refY", 0)
        .attr("markerWidth", markerSize)
        .attr("markerHeight", markerSize)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", color);

      // Draw the arrow line
      svg.append("line")
        .attr("x1", start.x)
        .attr("y1", start.y)
        .attr("x2", end.x)
        .attr("y2", end.y)
        .attr("stroke", color)
        .attr("stroke-width", strokeWidth)
        .attr("marker-end", `url(#${markerId})`);
    }
  }, [engineFen, whiteChain]);

  // (Optional) Draw a tiny "search graph" for the top 3 moves of the first candidate.
  useEffect(() => {
    const graphSvg = d3.select("#search-graph");
    graphSvg.selectAll("*").remove();
    if (candidates.length === 0) return;

    const data = { name: "start", children: [] };
    const candidate = candidates[0];
    const validMoveRegex = /^[a-h][1-8][a-h][1-8][qrbn]?$/i;
    const moves = candidate.moves.map(m => String(m).trim()).filter(m => validMoveRegex.test(m));
    if (moves.length >= 3) {
      const origin = moves[0].substring(0, 2);
      data.children.push({
        name: origin,
        children: [
          { name: moves[0] },
          { name: moves[1] },
          { name: moves[2] }
        ]
      });
    }

    const width = 640, height = 200;
    const treeLayout = d3.tree().size([width, height - 40]);
    const root = d3.hierarchy(data);
    treeLayout(root);

    // Draw links
    graphSvg.append("g")
      .selectAll("line")
      .data(root.links())
      .enter()
      .append("line")
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y)
      .attr("stroke", "#999")
      .attr("stroke-width", 2);

    // Draw nodes
    const node = graphSvg.append("g")
      .selectAll("g")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    node.append("circle")
      .attr("r", 10)
      .attr("fill", "#fff")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 3);

    node.append("text")
      .attr("dy", -15)
      .attr("text-anchor", "middle")
      .text(d => d.data.name);
  }, [candidates]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      <Header />
      <div className="container mx-auto px-8 py-6">
        <h2 className="text-3xl font-bold text-center mb-6">Mate‑in‑2 Exploration Visualization</h2>
        <p className="text-center mb-4">
          Stockfish analyzes the position and returns multiple candidates.
          We show the first 3 moves in sequence: White’s move (green), Black’s reply (red), then White’s mate move (green).
        </p>
        <div style={{ position: 'relative', width: '640px', height: '640px', margin: '0 auto' }}>
          {renderBoard(engineFen)}
          <svg
            id="arrow-overlay"
            style={{ position: 'absolute', top: 0, left: 0, width: '640px', height: '640px', zIndex: 1 }}
          />
        </div>
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <svg id="search-graph" width="640" height="200" />
        </div>

        <div className="flex justify-center mt-4">
          <button
            onClick={nextPosition}
            className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition shadow-md"
          >
            Next Position
          </button>
        </div>
      </div>

      <StockfishGraphEngine
        // Using a dynamic key so we can re-init the engine when fenIndex changes.
        key={analysisKey}
        fen={engineFen}
        // Let Stockfish analyze deeper or for a bit more time.
        depth={20}
        movetime={2000}
        onBestMove={handleBestMove}
        multiPV={5}
      />
    </div>
  );
};

export default ChessDecisionTreePage;
