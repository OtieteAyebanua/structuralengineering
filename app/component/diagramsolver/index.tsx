import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Brush,
} from "recharts";
import { BeamSystem, Span } from "../main/helpers";
import { DiagramPoint, solveBeamDiagrams } from "../main/diagramsolver";

export const SolveDiagramTab = () => {
  const [beam, setBeam] = useState<BeamSystem>({
    nodes: [
      { id: 1, support: "pinned" },
      { id: 2, support: "pinned" },
    ],
    spans: [
      {
        id: 1,
        startNode: 1,
        endNode: 2,
        L: 5,
        EI: 10000,
        w: 10,
        pointLoads: [],
        pointMoments: [],
        varyingLoad: [],
      },
    ],
  });

  const [diagramData, setDiagramData] = useState<DiagramPoint[]>([]);

  // Recalculate diagrams whenever beam changes
  useEffect(() => {
    const data = solveBeamDiagrams(beam);
    setDiagramData(data);
  }, [beam]);

  // ======================= HELPERS =======================
  const updateSpan = (index: number, key: keyof Span, value: any) => {
    setBeam((prev) => {
      const spans = [...prev.spans];
      spans[index] = { ...spans[index], [key]: value };
      return { ...prev, spans };
    });
  };

  // Point Loads
  const updatePointLoad = (
    spanIdx: number,
    idx: number,
    key: "P" | "a",
    value: number,
  ) => {
    setBeam((prev) => {
      const spans = [...prev.spans];
      const loads = spans[spanIdx].pointLoads
        ? [...spans[spanIdx].pointLoads!]
        : [];
      loads[idx] = { ...loads[idx], [key]: value };
      spans[spanIdx] = { ...spans[spanIdx], pointLoads: loads };
      return { ...prev, spans };
    });
  };
  const addPointLoad = (spanIdx: number) => {
    setBeam((prev) => {
      const spans = [...prev.spans];
      const loads = spans[spanIdx].pointLoads
        ? [...spans[spanIdx].pointLoads!]
        : [];
      spans[spanIdx] = {
        ...spans[spanIdx],
        pointLoads: [...loads, { P: 0, a: 0 }],
      };
      return { ...prev, spans };
    });
  };
  const removePointLoad = (spanIdx: number, idx: number) => {
    setBeam((prev) => {
      const spans = [...prev.spans];
      const loads = spans[spanIdx].pointLoads
        ? spans[spanIdx].pointLoads!.filter((_, i) => i !== idx)
        : [];
      spans[spanIdx] = { ...spans[spanIdx], pointLoads: loads };
      return { ...prev, spans };
    });
  };

  // Point Moments
  const updatePointMoment = (
    spanIdx: number,
    idx: number,
    key: "M" | "a",
    value: number,
  ) => {
    setBeam((prev) => {
      const spans = [...prev.spans];
      const moments = spans[spanIdx].pointMoments
        ? [...spans[spanIdx].pointMoments!]
        : [];
      moments[idx] = { ...moments[idx], [key]: value };
      spans[spanIdx] = { ...spans[spanIdx], pointMoments: moments };
      return { ...prev, spans };
    });
  };
  const addPointMoment = (spanIdx: number) => {
    setBeam((prev) => {
      const spans = [...prev.spans];
      const moments = spans[spanIdx].pointMoments
        ? [...spans[spanIdx].pointMoments!]
        : [];
      spans[spanIdx] = {
        ...spans[spanIdx],
        pointMoments: [...moments, { M: 0, a: 0 }],
      };
      return { ...prev, spans };
    });
  };
  const removePointMoment = (spanIdx: number, idx: number) => {
    setBeam((prev) => {
      const spans = [...prev.spans];
      const moments = spans[spanIdx].pointMoments
        ? spans[spanIdx].pointMoments!.filter((_, i) => i !== idx)
        : [];
      spans[spanIdx] = { ...spans[spanIdx], pointMoments: moments };
      return { ...prev, spans };
    });
  };

  // Varying Loads
  const updateVaryingLoad = (
    spanIdx: number,
    idx: number,
    key: "w1" | "w2",
    value: number,
  ) => {
    setBeam((prev) => {
      const spans = [...prev.spans];
      const loads = spans[spanIdx].varyingLoad
        ? [...spans[spanIdx].varyingLoad!]
        : [];
      loads[idx] = { ...loads[idx], [key]: value };
      spans[spanIdx] = { ...spans[spanIdx], varyingLoad: loads };
      return { ...prev, spans };
    });
  };
  const addVaryingLoad = (spanIdx: number) => {
    setBeam((prev) => {
      const spans = [...prev.spans];
      const loads = spans[spanIdx].varyingLoad
        ? [...spans[spanIdx].varyingLoad!]
        : [];
      spans[spanIdx] = {
        ...spans[spanIdx],
        varyingLoad: [...loads, { w1: 0, w2: 0 }],
      };
      return { ...prev, spans };
    });
  };
  const removeVaryingLoad = (spanIdx: number, idx: number) => {
    setBeam((prev) => {
      const spans = [...prev.spans];
      const loads = spans[spanIdx].varyingLoad
        ? spans[spanIdx].varyingLoad!.filter((_, i) => i !== idx)
        : [];
      spans[spanIdx] = { ...spans[spanIdx], varyingLoad: loads };
      return { ...prev, spans };
    });
  };

  // ======================= RENDER =======================
  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ marginBottom: 20 }}>Solve Beam Diagrams</h2>

      {/* ================= INPUT SPANS ================= */}
      <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        {beam.spans.map((span, idx) => (
          <div
            key={span.id}
            style={{
              padding: 15,
              border: "1px solid #ccc",
              borderRadius: 8,
              backgroundColor: "#f9f9f9",
            }}
          >
            <h4 style={{ marginBottom: 10 }}>Span {span.id}</h4>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <label>
                L (m):{" "}
                <input
                  type="number"
                  value={span.L}
                  min={0}
                  step={0.1}
                  style={{ width: 70, padding: 3 }}
                  onChange={(e) =>
                    updateSpan(idx, "L", parseFloat(e.target.value))
                  }
                />
              </label>

              <label>
                EI (kNm²):{" "}
                <input
                  type="number"
                  value={span.EI}
                  min={0}
                  step={100}
                  style={{ width: 90, padding: 3 }}
                  onChange={(e) =>
                    updateSpan(idx, "EI", parseFloat(e.target.value))
                  }
                />
              </label>

              <label>
                w (UDL kN/m):{" "}
                <input
                  type="number"
                  value={span.w || 0}
                  step={0.1}
                  style={{ width: 70, padding: 3 }}
                  onChange={(e) =>
                    updateSpan(idx, "w", parseFloat(e.target.value))
                  }
                />
              </label>
            </div>

            {/* Point Loads */}
            <LoadInput
              key={span.id + "-pointLoads"}
              title="Point Loads"
              data={span.pointLoads || []}
              addFn={() => addPointLoad(idx)}
              updateFn={(i, key, val) =>
                updatePointLoad(idx, i, key as "P" | "a", val)
              }
              removeFn={(i) => removePointLoad(idx, i)}
              keys={["P", "a"]}
            />

            <LoadInput
              key={span.id + "-pointMoments"}
              title="Point Moments"
              data={span.pointMoments || []}
              addFn={() => addPointMoment(idx)}
              updateFn={(i, key, val) =>
                updatePointMoment(idx, i, key as "M" | "a", val)
              }
              removeFn={(i) => removePointMoment(idx, i)}
              keys={["M", "a"]}
            />

            <LoadInput
              key={span.id + "-varyingLoads"}
              title="Linearly Varying Loads"
              data={span.varyingLoad || []}
              addFn={() => addVaryingLoad(idx)}
              updateFn={(i, key, val) =>
                updateVaryingLoad(idx, i, key as "w1" | "w2", val)
              }
              removeFn={(i) => removeVaryingLoad(idx, i)}
              keys={["w1", "w2"]}
            />
          </div>
        ))}
      </div>

      {/* ================= DIAGRAMS ================= */}
      {diagramData.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 30,
            marginTop: 30,
            overflowX: "auto",
          }}
        >
          <DiagramChart
            data={diagramData}
            keyName="shear"
            yLabel="Shear V (kN)"
            color="#ff7300"
          />
          <DiagramChart
            data={diagramData}
            keyName="moment"
            yLabel="Moment M (kNm)"
            color="#387908"
          />
          <DiagramChart
            data={diagramData}
            keyName="deflection"
            yLabel="Deflection y (m)"
            color="#3182ce"
          />
        </div>
      )}
    </div>
  );
};

// =================== DIAGRAM CHART ===================

const DiagramChart = ({
  data,
  keyName,
  yLabel,
  color,
}: {
  data: DiagramPoint[];
  keyName: keyof DiagramPoint;
  yLabel: string;
  color: string;
}) => (
  <LineChart
    width={800}
    height={300}
    data={data}
    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis
      dataKey="x"
      label={{ value: "x (m)", position: "insideBottom", offset: -5 }}
    />
    <YAxis label={{ value: yLabel, angle: -90, position: "insideLeft" }} />
    <Tooltip />
    <Legend />
    <Line
      type="monotone"
      dataKey={keyName}
      stroke={color}
      strokeWidth={2}
      dot={{ r: 4 }}          // shows points
      activeDot={{ r: 6, stroke: "#000", strokeWidth: 2 }} // highlight on hover
    />
    <Brush dataKey="x" height={30} stroke={color} />  {/* Zoom / pan along X-axis */}
  </LineChart>
);

export default DiagramChart;


// =================== LOAD INPUT COMPONENT ===================
const LoadInput = ({
  title,
  data,
  addFn,
  updateFn,
  removeFn,
  keys,
}: {
  title: string;
  data: any[];
  addFn: () => void;
  updateFn: (idx: number, key: string, value: number) => void;
  removeFn: (idx: number) => void;
  keys: string[];
}) => (
  <div style={{ marginTop: 15 }}>
    <h5>{title}</h5>
    {data.map((item, idx) => (
      <div
        key={idx}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 5,
        }}
      >
        {keys.map((k) => (
          <input
            key={k}
            type="number"
            step={k === "a" || k === "w1" || k === "w2" ? 0.01 : 0.1}
            value={item[k]}
            placeholder={k}
            style={{ width: 60, padding: 3 }}
            onChange={(e) => updateFn(idx, k, parseFloat(e.target.value))}
          />
        ))}
        <button
          style={{
            padding: "2px 6px",
            backgroundColor: "#e53e3e",
            color: "#fff",
            border: "none",
            borderRadius: 3,
            cursor: "pointer",
          }}
          onClick={() => removeFn(idx)}
        >
          Remove
        </button>
      </div>
    ))}
    <button
      style={{
        marginTop: 5,
        padding: "4px 8px",
        backgroundColor: "#3182ce",
        color: "#fff",
        border: "none",
        borderRadius: 4,
        cursor: "pointer",
      }}
      onClick={addFn}
    >
      + Add {title}
    </button>
  </div>
);
