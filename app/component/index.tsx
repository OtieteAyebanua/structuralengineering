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
import { BeamSystem, Span } from "./main/helpers";
import { DiagramPoint, solveBeamDiagrams } from "./diagramsolver";

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

  useEffect(() => {
    const data = solveBeamDiagrams(beam);
    setDiagramData(data);
  }, [beam]);

  // ======================= SPAN HELPERS =======================

  const addSpan = () => {
    setBeam((prev) => {
      const newNodeId = prev.nodes.length + 1;
      const newSpanId = prev.spans.length + 1;

      return {
        nodes: [
          ...prev.nodes,
          { id: newNodeId, support: "pinned" },
        ],
        spans: [
          ...prev.spans,
          {
            id: newSpanId,
            startNode: newNodeId - 1,
            endNode: newNodeId,
            L: 5,
            EI: 10000,
            w: 0,
            pointLoads: [],
            pointMoments: [],
            varyingLoad: [],
          },
        ],
      };
    });
  };

  const removeSpan = (idx: number) => {
    setBeam((prev) => {
      if (prev.spans.length === 1) return prev;

      const spans = prev.spans.filter((_, i) => i !== idx);
      const nodes = prev.nodes.slice(0, spans.length + 1);

      const reSpans = spans.map((s, i) => ({
        ...s,
        id: i + 1,
        startNode: i + 1,
        endNode: i + 2,
      }));

      const reNodes = nodes.map((n, i) => ({
        ...n,
        id: i + 1,
      }));

      return { nodes: reNodes, spans: reSpans };
    });
  };

  // ======================= LOAD HELPERS =======================

  const updateSpan = (index: number, key: keyof Span, value: any) => {
    setBeam((prev) => {
      const spans = [...prev.spans];
      spans[index] = { ...spans[index], [key]: value };
      return { ...prev, spans };
    });
  };

  const updateArrayItem =
    (field: "pointLoads" | "pointMoments" | "varyingLoad") =>
    (spanIdx: number, idx: number, item: any) => {
      setBeam((prev) => {
        const spans = [...prev.spans];
        const arr = [...(spans[spanIdx][field] || [])];
        arr[idx] = item;
        spans[spanIdx] = { ...spans[spanIdx], [field]: arr };
        return { ...prev, spans };
      });
    };

  const addArrayItem =
    (field: "pointLoads" | "pointMoments" | "varyingLoad", template: any) =>
    (spanIdx: number) => {
      setBeam((prev) => {
        const spans = [...prev.spans];
        spans[spanIdx] = {
          ...spans[spanIdx],
          [field]: [...(spans[spanIdx][field] || []), template],
        };
        return { ...prev, spans };
      });
    };

  const removeArrayItem =
    (field: "pointLoads" | "pointMoments" | "varyingLoad") =>
    (spanIdx: number, idx: number) => {
      setBeam((prev) => {
        const spans = [...prev.spans];
        spans[spanIdx] = {
          ...spans[spanIdx],
          [field]: (spans[spanIdx][field] || []).filter((_, i) => i !== idx),
        };
        return { ...prev, spans };
      });
    };

  // ======================= RENDER =======================

  return (
    <div style={{ padding: 20 }}>
      <h2>Solve Beam Diagrams</h2>

      <button
        onClick={addSpan}
        style={{
          marginBottom: 20,
          padding: "6px 12px",
          backgroundColor: "#2f855a",
          color: "#fff",
          border: "none",
          borderRadius: 5,
        }}
      >
        + Add Span
      </button>

      {beam.spans.map((span, idx) => (
        <div
          key={span.id}
          style={{
            padding: 15,
            marginBottom: 15,
            border: "1px solid #ccc",
            borderRadius: 8,
          }}
        >
          <h4>
            Span {span.id}
            {beam.spans.length > 1 && (
              <button
                onClick={() => removeSpan(idx)}
                style={{
                  marginLeft: 10,
                  background: "#c53030",
                  color: "#fff",
                  border: "none",
                  padding: "2px 6px",
                  borderRadius: 4,
                }}
              >
                Remove
              </button>
            )}
          </h4>

          <label>
            L:
            <input
              type="number"
              value={span.L}
              onChange={(e) =>
                updateSpan(idx, "L", parseFloat(e.target.value))
              }
            />
          </label>

          <label>
            EI:
            <input
              type="number"
              value={span.EI}
              onChange={(e) =>
                updateSpan(idx, "EI", parseFloat(e.target.value))
              }
            />
          </label>

          <label>
            w:
            <input
              type="number"
              value={span.w || 0}
              onChange={(e) =>
                updateSpan(idx, "w", parseFloat(e.target.value))
              }
            />
          </label>

          <LoadInput
            title="Point Loads"
            data={span.pointLoads || []}
            keys={["P", "a"]}
            addFn={() => addArrayItem("pointLoads", { P: 0, a: 0 })(idx)}
            updateFn={(i, k, v) =>
              updateArrayItem("pointLoads")(idx, i, {
                ...span.pointLoads![i],
                [k]: v,
              })
            }
            removeFn={(i) => removeArrayItem("pointLoads")(idx, i)}
          />

          <LoadInput
            title="Point Moments"
            data={span.pointMoments || []}
            keys={["M", "a"]}
            addFn={() => addArrayItem("pointMoments", { M: 0, a: 0 })(idx)}
            updateFn={(i, k, v) =>
              updateArrayItem("pointMoments")(idx, i, {
                ...span.pointMoments![i],
                [k]: v,
              })
            }
            removeFn={(i) => removeArrayItem("pointMoments")(idx, i)}
          />

          <LoadInput
            title="Varying Loads"
            data={span.varyingLoad || []}
            keys={["w1", "w2"]}
            addFn={() =>
              addArrayItem("varyingLoad", { w1: 0, w2: 0 })(idx)
            }
            updateFn={(i, k, v) =>
              updateArrayItem("varyingLoad")(idx, i, {
                ...span.varyingLoad![i],
                [k]: v,
              })
            }
            removeFn={(i) => removeArrayItem("varyingLoad")(idx, i)}
          />
        </div>
      ))}

      {diagramData.length > 0 && (
        <>
          <DiagramChart data={diagramData} keyName="shear" yLabel="Shear" color="#ff7300" />
          <DiagramChart data={diagramData} keyName="moment" yLabel="Moment" color="#387908" />
          <DiagramChart data={diagramData} keyName="deflection" yLabel="Deflection" color="#3182ce" />
        </>
      )}
    </div>
  );
};

// =================== CHART ===================

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
  <LineChart width={800} height={300} data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="x" />
    <YAxis label={{ value: yLabel, angle: -90 }} />
    <Tooltip />
    <Line dataKey={keyName} stroke={color} dot />
    <Brush dataKey="x" height={30} />
  </LineChart>
);

// =================== LOAD INPUT ===================

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
  <div>
    <h5>{title}</h5>
    {data.map((item, idx) => (
      <div key={idx}>
        {keys.map((k) => (
          <input
            key={k}
            type="number"
            value={item[k]}
            onChange={(e) => updateFn(idx, k, +e.target.value)}
          />
        ))}
        <button onClick={() => removeFn(idx)}>Remove</button>
      </div>
    ))}
    <button onClick={addFn}>+ Add</button>
  </div>
);

export default SolveDiagramTab;
