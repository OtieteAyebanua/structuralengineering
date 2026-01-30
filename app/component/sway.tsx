// SwayFrame.tsx
import React, { useState, useEffect } from "react";

interface SpanFEM {
  EI: number;
  L: number;
}

interface BeamSystemForSway {
  spans: SpanFEM[];
}

interface SwayResults {
  sameLength: number;
  diffLength: number;
  lateralForce: number;
}

interface SwayFrameProps {
  femSolution: BeamSystemForSway;
}

const SwayFrame: React.FC<SwayFrameProps> = ({ femSolution }) => {
  const [height, setHeight] = useState<number>(3); // Column height (m)
  const [lateralLoad, setLateralLoad] = useState<number>(0); // Lateral load (kN)
  const [results, setResults] = useState<SwayResults>({
    sameLength: 0,
    diffLength: 0,
    lateralForce: 0,
  });

  const solveSway = () => {
    const { spans } = femSolution;

    if (!spans || spans.length === 0 || spans.some((s) => !s.EI || s.EI <= 0)) {
      setResults({ sameLength: 0, diffLength: 0, lateralForce: 0 });
      return;
    }

    let sway: SwayResults = { sameLength: 0, diffLength: 0, lateralForce: 0 };

    const allSameLength = new Set(spans.map((s) => s.L)).size === 1;
    const allSameEI = new Set(spans.map((s) => s.EI)).size === 1;

    if (allSameLength && allSameEI && lateralLoad === 0) {
      sway.sameLength = height / (spans[0].EI * spans.length);
    } else {
      const totalEI = spans.reduce((sum, s) => sum + s.EI, 0);
      sway.diffLength = totalEI > 0 ? height / totalEI : 0;
    }

    if (lateralLoad !== 0) {
      const totalEI = spans.reduce((sum, s) => sum + s.EI, 0);
      sway.lateralForce = totalEI > 0 ? lateralLoad / totalEI : 0;
    }

    setResults(sway);
  };

  useEffect(() => {
    solveSway();
  }, [femSolution, height,lateralLoad]);

  return (
    <div
      style={{
        padding: 20,
        borderRadius: 10,
        backgroundColor: "#f7fafc",
        border: "1px solid #cbd5e0",
        maxWidth: 450,
        margin: "20px auto",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h3 style={{ marginBottom: 20, color: "#2d3748" }}>Sway Frame Analysis</h3>

      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 25,
          flexWrap: "wrap",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", fontSize: 14 }}>
          Column Height (m):
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(parseFloat(e.target.value))}
            style={{ marginTop: 5, padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e0", width: 100 }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", fontSize: 14 }}>
          Lateral Load (kN):
          <input
            type="number"
            value={lateralLoad}
            onChange={(e) => setLateralLoad(parseFloat(e.target.value))}
            style={{ marginTop: 5, padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e0", width: 100 }}
          />
        </label>
      </div>

      <div
        style={{
          backgroundColor: "#edf2f7",
          borderRadius: 8,
          padding: 15,
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <h4 style={{ marginBottom: 15, color: "#2d3748" }}>Results (m)</h4>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <li style={{ backgroundColor: "#fff", marginBottom: 8, padding: "8px 12px", borderRadius: 6, borderLeft: "4px solid #3182ce", fontWeight: 500 }}>
            Same Length Columns: {results.sameLength.toFixed(6)}
          </li>
          <li style={{ backgroundColor: "#fff", marginBottom: 8, padding: "8px 12px", borderRadius: 6, borderLeft: "4px solid #38a169", fontWeight: 500 }}>
            Different Length/Stiffness: {results.diffLength.toFixed(6)}
          </li>
          <li style={{ backgroundColor: "#fff", padding: "8px 12px", borderRadius: 6, borderLeft: "4px solid #e53e3e", fontWeight: 500 }}>
            Lateral Force Applied: {results.lateralForce.toFixed(6)}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SwayFrame;
