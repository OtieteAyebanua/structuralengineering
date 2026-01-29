"use client";

import React, { useState, useEffect } from "react";
import styles from "./style.module.css";
import {
  BeamSystem,
  EndMoments,
  solveMultiSpanSlopeDeflection,
} from "./helpers";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SolveDiagramTab } from "../diagramsolver";

type Tab =
  | "analysis"
  | "visual"
  | "reactions"
  | "forces"
  | "diagrams"
  | "solveDiagram";

const BeamCalculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("analysis");

  // ================== BEAM SYSTEM ==================
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
        EI: 210e6 * 0.05, // kN·m², already includes E*I
        w: 10, // UDL
        pointLoads: [{ P: 20, a: 2 }], // kN
        pointMoments: [{ M: 15, a: 3 }], // kNm
        varyingLoad: [{ w1: 0, w2: 5 }], // kN/m
      },
    ],
  });

  const [moments, setMoments] = useState<EndMoments[]>([]);

  // ================== SOLVER ==================
  useEffect(() => {
    const res = solveMultiSpanSlopeDeflection(beam);
    setMoments(res);
  }, [beam]);

  // ================== ADD SPAN ==================
  const addSpan = () => {
    setBeam((prev: any) => {
      const newNodeId = prev.nodes.length + 1;
      const newSpanId = prev.spans.length + 1;

      return {
        nodes: [...prev.nodes, { id: newNodeId, support: "pinned" }],
        spans: [
          ...prev.spans,
          {
            id: newSpanId,
            startNode: newNodeId - 1,
            endNode: newNodeId,
            L: 5,
            EI: 10000,
            w: 5,
          },
        ],
      };
    });
  };

  // ================== REACTIONS ==================
  const computeNodeReactions = (system: BeamSystem) => {
    const reactions: Record<number, number> = {};

    system.nodes.forEach((node) => (reactions[node.id] = 0));

    system.spans.forEach((span) => {
      const L = span.L;
      const w = span.w ?? 0;

      // UDL contribution
      reactions[span.startNode] += (w * L) / 2;
      reactions[span.endNode] += (w * L) / 2;

      // Point loads
      (span.pointLoads || []).forEach((pl) => {
        reactions[span.startNode] += pl.P * (1 - pl.a / L);
        reactions[span.endNode] += pl.P * (pl.a / L);
      });

      // Varying loads
      (span.varyingLoad || []).forEach((vl) => {
        const w_avg = (vl.w1 + vl.w2) / 2;
        const M_tri = ((vl.w2 - vl.w1) * L ** 2) / 6; // triangular effect
        reactions[span.startNode] += (w_avg * L) / 2 - M_tri / L;
        reactions[span.endNode] += (w_avg * L) / 2 + M_tri / L;
      });

      // Point moments do not affect vertical reactions
    });

    return reactions;
  };

  const nodeReactions = computeNodeReactions(beam);

  // ================== DIAGRAM DATA ==================
  const multiSpanDiagramData = beam.spans.flatMap((span) => {
    const spanMoment = moments.find((m) => m.spanId === span.id);
    if (!spanMoment) return [];

    const divisions = 50;
    const dx = span.L / divisions;
    const xOffset = beam.spans
      .filter((s) => s.id < span.id)
      .reduce((sum, s) => sum + s.L, 0);

    const EI = span.EI; // use EI directly from span

    return Array.from({ length: divisions + 1 }, (_, i) => {
      const x = i * dx;
      const globalX = x + xOffset;

      // Shear
      let V = 0;
      if (span.w) V += span.w * (span.L / 2 - x); // UDL approx
      (span.pointLoads || []).forEach((pl) => {
        if (x >= pl.a) V -= pl.P;
      });
      (span.varyingLoad || []).forEach((vl) => {
        const wx = vl.w1 + ((vl.w2 - vl.w1) / span.L) * x;
        V += ((vl.w1 + wx) / 2) * dx;
      });

      // Moment
      let M = spanMoment.M_AB + V * x;
      (span.pointLoads || []).forEach((pl) => {
        if (x >= pl.a) M -= pl.P * (x - pl.a);
      });
      (span.pointMoments || []).forEach((pm) => {
        if (x >= pm.a) M += pm.M;
      });
      (span.varyingLoad || []).forEach((vl) => {
        const wx = vl.w1 + ((vl.w2 - vl.w1) / span.L) * x;
        M += ((vl.w1 + wx) / 2) * dx * (x - dx / 2);
      });

      // Deflection (simplified using EI)
      const y =
        span.w && EI
          ? (span.w * x * (span.L ** 3 - 2 * span.L * x ** 2 + x ** 3)) /
            (24 * EI)
          : 0;

      return { x: globalX, shear: V, moment: M, deflection: y };
    });
  });

  // Deflection scaling
  const maxDeflection =
    multiSpanDiagramData.length > 0
      ? Math.max(...multiSpanDiagramData.map((d) => Math.abs(d.deflection)))
      : 1;
  const deflectionScale = maxDeflection > 0 ? 50 / maxDeflection : 1;

  return (
    <div>
      {/* ================== SPAN INPUTS ================== */}
      <div
        style={{
          marginBottom: 20,
          padding: 15,
          backgroundColor: "#f7fafc",
          borderRadius: 8,
        }}
      >
        <h3 style={{ marginBottom: 15, color: "#2d3748" }}>Define Spans</h3>

        {beam.spans.map((span, index) => (
          <div
            key={span.id}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 15,
              padding: 10,
              backgroundColor: "#edf2f7",
              borderRadius: 6,
            }}
          >
            {/* ================== Basic Span Info ================== */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontWeight: "bold", minWidth: 60 }}>
                Span {index + 1}:
              </span>

              {/* Length */}
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  fontSize: 12,
                }}
              >
                L (m)
                <input
                  type="number"
                  value={span.L}
                  min={0}
                  step={0.1}
                  style={{
                    padding: 4,
                    borderRadius: 4,
                    border: "1px solid #cbd5e0",
                    width: 80,
                  }}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setBeam((prev) => {
                      const newSpans = [...prev.spans];
                      newSpans[index] = { ...newSpans[index], L: val };
                      return { ...prev, spans: newSpans };
                    });
                  }}
                />
              </label>

              {/* EI */}
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  fontSize: 12,
                }}
              >
                I (m⁴)
                <input
                  type="number"
                  value={span.EI || 0} // default 0 if undefined
                  min={0}
                  step={100} // realistic for EI values
                  style={{
                    padding: 4,
                    borderRadius: 4,
                    border: "1px solid #cbd5e0",
                    width: 100,
                  }}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setBeam((prev) => {
                      const newSpans = [...prev.spans];
                      newSpans[index] = {
                        ...newSpans[index],
                        EI: val, // fix typo here (was 'Ei')
                      };
                      return { ...prev, spans: newSpans };
                    });
                  }}
                />
              </label>

              {/* Uniform Load */}
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  fontSize: 12,
                }}
              >
                w (kN/m)
                <input
                  type="number"
                  value={span.w}
                  step={0.1}
                  style={{
                    padding: 4,
                    borderRadius: 4,
                    border: "1px solid #cbd5e0",
                    width: 80,
                  }}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setBeam((prev) => {
                      const newSpans = [...prev.spans];
                      newSpans[index] = { ...newSpans[index], w: val };
                      return { ...prev, spans: newSpans };
                    });
                  }}
                />
              </label>

              {/* Support Type */}
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  fontSize: 12,
                }}
              >
                Support
                <select
                  value={beam.nodes[span.startNode - 1].support}
                  style={{
                    padding: 4,
                    borderRadius: 4,
                    border: "1px solid #cbd5e0",
                  }}
                  onChange={(e) => {
                    const support = e.target.value as
                      | "pinned"
                      | "fixed"
                      | "roller";
                    setBeam((prev) => {
                      const newNodes = [...prev.nodes];
                      newNodes[span.startNode - 1] = {
                        ...newNodes[span.startNode - 1],
                        support,
                      };
                      return { ...prev, nodes: newNodes };
                    });
                  }}
                >
                  <option value="pinned">Pinned</option>
                  <option value="fixed">Fixed</option>
                  <option value="roller">Roller</option>
                </select>
              </label>

              {/* Delete Span */}
              <button
                style={{
                  marginLeft: 10,
                  padding: "4px 8px",
                  backgroundColor: "#e53e3e",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
                onClick={() => {
                  setBeam((prev) => {
                    const newSpans = prev.spans.filter((_, i) => i !== index);
                    const newNodes = prev.nodes.slice(0, newSpans.length + 1);
                    return { ...prev, spans: newSpans, nodes: newNodes };
                  });
                }}
              >
                Delete
              </button>
            </div>

            {/* ================== Point Loads ================== */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontWeight: "bold", fontSize: 12 }}>
                Point Loads (kN)
              </span>
              {(span.pointLoads || []).map((pl, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 5, alignItems: "center" }}
                >
                  <input
                    type="number"
                    placeholder="P"
                    value={pl.P}
                    style={{
                      width: 60,
                      padding: 3,
                      borderRadius: 4,
                      border: "1px solid #cbd5e0",
                    }}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setBeam((prev) => {
                        const newSpans = [...prev.spans];
                        const loads = [...(newSpans[index].pointLoads || [])];
                        loads[i] = { ...loads[i], P: val };
                        newSpans[index].pointLoads = loads;
                        return { ...prev, spans: newSpans };
                      });
                    }}
                  />
                  <input
                    type="number"
                    placeholder="a (m)"
                    value={pl.a}
                    style={{
                      width: 60,
                      padding: 3,
                      borderRadius: 4,
                      border: "1px solid #cbd5e0",
                    }}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setBeam((prev) => {
                        const newSpans = [...prev.spans];
                        const loads = [...(newSpans[index].pointLoads || [])];
                        loads[i] = { ...loads[i], a: val };
                        newSpans[index].pointLoads = loads;
                        return { ...prev, spans: newSpans };
                      });
                    }}
                  />
                  <button
                    style={{
                      padding: "2px 5px",
                      backgroundColor: "#e53e3e",
                      color: "#fff",
                      border: "none",
                      borderRadius: 3,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                    onClick={() => {
                      setBeam((prev) => {
                        const newSpans = [...prev.spans];
                        newSpans[index].pointLoads = newSpans[
                          index
                        ].pointLoads?.filter((_, j) => j !== i);
                        return { ...prev, spans: newSpans };
                      });
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                style={{
                  marginTop: 2,
                  padding: "2px 6px",
                  backgroundColor: "#3182ce",
                  color: "#fff",
                  border: "none",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontSize: 12,
                  alignSelf: "flex-start",
                }}
                onClick={() => {
                  setBeam((prev) => {
                    const newSpans = [...prev.spans];
                    newSpans[index].pointLoads = [
                      ...(newSpans[index].pointLoads || []),
                      { P: 0, a: 0 },
                    ];
                    return { ...prev, spans: newSpans };
                  });
                }}
              >
                + Add Point Load
              </button>
            </div>

            {/* ================== Point Moments ================== */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontWeight: "bold", fontSize: 12 }}>
                Point Moments (kNm)
              </span>
              {(span.pointMoments || []).map((pm, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 5, alignItems: "center" }}
                >
                  <input
                    type="number"
                    placeholder="M"
                    value={pm.M}
                    style={{
                      width: 60,
                      padding: 3,
                      borderRadius: 4,
                      border: "1px solid #cbd5e0",
                    }}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setBeam((prev) => {
                        const newSpans = [...prev.spans];
                        const moments = [
                          ...(newSpans[index].pointMoments || []),
                        ];
                        moments[i] = { ...moments[i], M: val };
                        newSpans[index].pointMoments = moments;
                        return { ...prev, spans: newSpans };
                      });
                    }}
                  />
                  <input
                    type="number"
                    placeholder="a (m)"
                    value={pm.a}
                    style={{
                      width: 60,
                      padding: 3,
                      borderRadius: 4,
                      border: "1px solid #cbd5e0",
                    }}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setBeam((prev) => {
                        const newSpans = [...prev.spans];
                        const moments = [
                          ...(newSpans[index].pointMoments || []),
                        ];
                        moments[i] = { ...moments[i], a: val };
                        newSpans[index].pointMoments = moments;
                        return { ...prev, spans: newSpans };
                      });
                    }}
                  />
                  <button
                    style={{
                      padding: "2px 5px",
                      backgroundColor: "#e53e3e",
                      color: "#fff",
                      border: "none",
                      borderRadius: 3,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                    onClick={() => {
                      setBeam((prev) => {
                        const newSpans = [...prev.spans];
                        newSpans[index].pointMoments = newSpans[
                          index
                        ].pointMoments?.filter((_, j) => j !== i);
                        return { ...prev, spans: newSpans };
                      });
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                style={{
                  marginTop: 2,
                  padding: "2px 6px",
                  backgroundColor: "#3182ce",
                  color: "#fff",
                  border: "none",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontSize: 12,
                  alignSelf: "flex-start",
                }}
                onClick={() => {
                  setBeam((prev) => {
                    const newSpans = [...prev.spans];
                    newSpans[index].pointMoments = [
                      ...(newSpans[index].pointMoments || []),
                      { M: 0, a: 0 },
                    ];
                    return { ...prev, spans: newSpans };
                  });
                }}
              >
                + Add Moment
              </button>
            </div>

            {/* ================== Linearly Varying Loads ================== */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontWeight: "bold", fontSize: 12 }}>
                Varying Loads (kN/m)
              </span>
              {(span.varyingLoad || []).map((vl, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 5, alignItems: "center" }}
                >
                  <input
                    type="number"
                    placeholder="w1"
                    value={vl.w1}
                    style={{
                      width: 60,
                      padding: 3,
                      borderRadius: 4,
                      border: "1px solid #cbd5e0",
                    }}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setBeam((prev) => {
                        const newSpans = [...prev.spans];
                        const loads = [...(newSpans[index].varyingLoad || [])];
                        loads[i] = { ...loads[i], w1: val };
                        newSpans[index].varyingLoad = loads;
                        return { ...prev, spans: newSpans };
                      });
                    }}
                  />
                  <input
                    type="number"
                    placeholder="w2"
                    value={vl.w2}
                    style={{
                      width: 60,
                      padding: 3,
                      borderRadius: 4,
                      border: "1px solid #cbd5e0",
                    }}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setBeam((prev) => {
                        const newSpans = [...prev.spans];
                        const loads = [...(newSpans[index].varyingLoad || [])];
                        loads[i] = { ...loads[i], w2: val };
                        newSpans[index].varyingLoad = loads;
                        return { ...prev, spans: newSpans };
                      });
                    }}
                  />
                  <button
                    style={{
                      padding: "2px 5px",
                      backgroundColor: "#e53e3e",
                      color: "#fff",
                      border: "none",
                      borderRadius: 3,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                    onClick={() => {
                      setBeam((prev) => {
                        const newSpans = [...prev.spans];
                        newSpans[index].varyingLoad = newSpans[
                          index
                        ].varyingLoad?.filter((_, j) => j !== i);
                        return { ...prev, spans: newSpans };
                      });
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                style={{
                  marginTop: 2,
                  padding: "2px 6px",
                  backgroundColor: "#3182ce",
                  color: "#fff",
                  border: "none",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontSize: 12,
                  alignSelf: "flex-start",
                }}
                onClick={() => {
                  setBeam((prev) => {
                    const newSpans = [...prev.spans];
                    newSpans[index].varyingLoad = [
                      ...(newSpans[index].varyingLoad || []),
                      { w1: 0, w2: 0 },
                    ];
                    return { ...prev, spans: newSpans };
                  });
                }}
              >
                + Add Varying Load
              </button>
            </div>
          </div>
        ))}

        {/* Add Span Button */}
        <button
          style={{
            marginTop: 10,
            padding: "8px 15px",
            backgroundColor: "#3182ce",
            color: "#fff",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
            fontWeight: "bold",
          }}
          onClick={() => {
            const newNodeId = beam.nodes.length + 1;
            const newSpanId = beam.spans.length + 1;
            setBeam((prev) => ({
              nodes: [...prev.nodes, { id: newNodeId, support: "pinned" }],
              spans: [
                ...prev.spans,
                {
                  id: newSpanId,
                  startNode: newNodeId - 1,
                  endNode: newNodeId,
                  L: 5,
                  EI: 200000 * 50, // E * I for default values
                  w: 5,
                  pointLoads: [],
                  pointMoments: [],
                  varyingLoad: [],
                },
              ],
            }));
          }}
        >
          + Add Span
        </button>
      </div>

      {/* ================== TABS ================== */}
      <div className={styles.tabs}>
        {[
          "analysis",
          "visual",
          "reactions",
          "forces",
          "diagrams",
          "solveDiagram",
        ].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as Tab)}
            className={activeTab === tab ? styles.active : ""}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ================== TAB CONTENT ================== */}
      <div className={styles.tabContent}>
        {/* ANALYSIS */}
        {activeTab === "analysis" &&
          moments.map((spanMoment) => (
            <div
              key={spanMoment.spanId}
              style={{
                padding: 15,
                backgroundColor: "#edf2f7",
                borderRadius: 8,
                minWidth: 200,
              }}
            >
              <p style={{ fontWeight: "bold", marginBottom: 5 }}>
                Span {spanMoment.spanId}
              </p>
              <p>
                M<sub>AB</sub>:{" "}
                <span
                  style={{
                    color: spanMoment.M_AB >= 0 ? "#38a169" : "#e53e3e",
                  }}
                >
                  {spanMoment.M_AB.toFixed(2)} kNm
                </span>
              </p>
              <p>
                M<sub>BA</sub>:{" "}
                <span
                  style={{
                    color: spanMoment.M_BA >= 0 ? "#38a169" : "#e53e3e",
                  }}
                >
                  {spanMoment.M_BA.toFixed(2)} kNm
                </span>
              </p>

              {/* Optional: display new loads */}
              {spanMoment.pointLoads && spanMoment.pointLoads.length > 0 && (
                <p style={{ fontSize: 12, marginTop: 5 }}>
                  Point Loads:{" "}
                  {spanMoment.pointLoads
                    .map((pl) => `${pl.P} kN @ ${pl.a} m`)
                    .join(", ")}
                </p>
              )}

              {spanMoment.pointMoments &&
                spanMoment.pointMoments.length > 0 && (
                  <p style={{ fontSize: 12, marginTop: 5 }}>
                    Point Moments:{" "}
                    {spanMoment.pointMoments
                      .map((pm) => `${pm.M} kNm @ ${pm.a} m`)
                      .join(", ")}
                  </p>
                )}

              {spanMoment.varyingLoad && spanMoment.varyingLoad.length > 0 && (
                <p style={{ fontSize: 12, marginTop: 5 }}>
                  Varying Load:{" "}
                  {spanMoment.varyingLoad
                    .map((vl) => `${vl.w1} → ${vl.w2} kN/m`)
                    .join(", ")}
                </p>
              )}
            </div>
          ))}

        {/* VISUAL */}
        {activeTab === "visual" && (
          <div>
            <h3>Beam Visualization</h3>
            <svg
              width={beam.spans.reduce((sum, s) => sum + s.L * 100, 0) + 60}
              height={120}
            >
              {/* Arrow marker */}
              <defs>
                <marker
                  id="arrow"
                  markerWidth="6"
                  markerHeight="6"
                  refX="5"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,6 L6,3 z" fill="#e53e3e" />
                </marker>
              </defs>

              {/* Beam baseline */}
              <line
                x1={30}
                y1={60}
                x2={30 + beam.spans.reduce((sum, s) => sum + s.L * 100, 0)}
                y2={60}
                stroke="#2d3748"
                strokeWidth={8}
              />

              {/* Support symbols */}
              {beam.nodes.map((node, idx) => {
                const x =
                  30 +
                  beam.spans
                    .slice(0, idx)
                    .reduce((acc, s) => acc + s.L * 100, 0);

                const y = 60;

                switch (node.support) {
                  case "pinned":
                    return (
                      <g key={node.id}>
                        <polygon
                          points={`${x - 10},${y + 10} ${x + 10},${y + 10} ${x},${y}`}
                          fill="#2d3748"
                        />
                      </g>
                    );

                  case "roller":
                    return (
                      <g key={node.id}>
                        {/* triangle */}
                        <polygon
                          points={`${x - 10},${y + 8} ${x + 10},${y + 8} ${x},${y}`}
                          fill="#2d3748"
                        />
                        {/* rollers */}
                        <circle cx={x - 6} cy={y + 14} r={3} fill="#2d3748" />
                        <circle cx={x + 6} cy={y + 14} r={3} fill="#2d3748" />
                      </g>
                    );

                  case "fixed":
                    return (
                      <g key={node.id}>
                        <rect
                          x={x - 4}
                          y={y - 20}
                          width={8}
                          height={40}
                          fill="#2d3748"
                        />
                      </g>
                    );

                  default:
                    return null;
                }
              })}

              {/* Spans */}
              {beam.spans.map((span, idx) => {
                const startX =
                  30 +
                  beam.spans
                    .slice(0, idx)
                    .reduce((acc, s) => acc + s.L * 100, 0);
                const endX = startX + span.L * 100;

                return (
                  <g key={span.id}>
                    {/* UDL */}
                    {span.w && (
                      <line
                        x1={startX}
                        y1={60}
                        x2={endX}
                        y2={60}
                        stroke="#e53e3e"
                        strokeWidth={4}
                        markerEnd="url(#arrow)"
                      />
                    )}

                    {/* Point Loads */}
                    {(span.pointLoads || []).map((pl, i) => {
                      const x = startX + (pl.a / span.L) * (endX - startX);
                      return (
                        <line
                          key={i}
                          x1={x}
                          y1={60}
                          x2={x}
                          y2={40}
                          stroke="#e53e3e"
                          strokeWidth={3}
                          markerEnd="url(#arrow)"
                        />
                      );
                    })}

                    {/* Varying Loads */}
                    {(span.varyingLoad || []).map((vl, i) => (
                      <polygon
                        key={i}
                        points={`${startX},60 ${startX},${60 - vl.w1 * 5} ${endX},${
                          60 - vl.w2 * 5
                        } ${endX},60`}
                        fill="rgba(229,62,62,0.5)"
                      />
                    ))}

                    {/* Point Moments */}
                    {(span.pointMoments || []).map((pm, i) => {
                      const x = startX + (pm.a / span.L) * (endX - startX);
                      return (
                        <text
                          key={i}
                          x={x - 4} // adjust horizontal alignment
                          y={35}
                          fill="#e53e3e"
                          fontSize={12}
                          fontWeight="bold"
                        >
                          ⟳
                        </text>
                      );
                    })}
                  </g>
                );
              })}
            </svg>
            <p style={{ marginTop: 10, fontSize: 14, color: "#4a5568" }}>
              Red lines/arrows: UDLs and point loads; Curved or ⟳: moments
            </p>
          </div>
        )}

        {/* REACTIONS */}
        {activeTab === "reactions" && (
          <div
            style={{
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
              marginTop: 10,
            }}
          >
            {beam.nodes.map((node) => (
              <div
                key={node.id}
                style={{
                  backgroundColor: "#edf2f7",
                  padding: 15,
                  borderRadius: 8,
                  minWidth: 150,
                  textAlign: "center",
                }}
              >
                <p style={{ fontWeight: "bold", color: "#2b6cb0" }}>
                  Node {node.id} ({node.support})
                </p>
                <p
                  style={{
                    fontSize: 18,
                    color: nodeReactions[node.id] >= 0 ? "#38a169" : "#e53e3e",
                  }}
                >
                  {nodeReactions[node.id]?.toFixed(2) ?? 0} kN
                </p>
                <p style={{ fontSize: 12, color: "#4a5568" }}>
                  {nodeReactions[node.id] >= 0 ? "Upward" : "Downward"}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* FORCES */}
        {activeTab === "forces" && (
          <div
            style={{
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
              marginTop: 10,
            }}
          >
            {moments.map((span) => (
              <div
                key={span.spanId}
                style={{
                  backgroundColor: "#edf2f7",
                  padding: 15,
                  borderRadius: 8,
                  minWidth: 200,
                  textAlign: "center",
                }}
              >
                <p style={{ fontWeight: "bold", color: "#2b6cb0" }}>
                  Span {span.spanId} End Moments
                </p>
                <p
                  style={{
                    fontSize: 16,
                    color: span.M_AB >= 0 ? "#38a169" : "#e53e3e",
                    margin: "5px 0",
                  }}
                >
                  M_AB: {span.M_AB.toFixed(2)} kNm —{" "}
                  {span.M_AB >= 0 ? "Sagging" : "Hogging"}
                </p>
                <p
                  style={{
                    fontSize: 16,
                    color: span.M_BA >= 0 ? "#38a169" : "#e53e3e",
                    margin: "5px 0",
                  }}
                >
                  M_BA: {span.M_BA.toFixed(2)} kNm —{" "}
                  {span.M_BA >= 0 ? "Sagging" : "Hogging"}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* DIAGRAMS */}
        {activeTab === "diagrams" && (
          <>
            {[
              {
                title: "Shear Force Diagram",
                key: "shear",
                color: "#3182ce",
                unit: "kN",
              },
              {
                title: "Bending Moment Diagram",
                key: "moment",
                color: "#e53e3e",
                unit: "kNm",
              },
              {
                title: "Deflection Diagram",
                key: "deflection",
                color: "#38a169",
                unit: "m",
              },
            ].map((chart) => (
              <div key={chart.key} style={{ marginTop: 30 }}>
                <h3>{chart.title}</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={multiSpanDiagramData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="x"
                      label={{ value: "x (m)", position: "insideBottomRight" }}
                    />
                    <YAxis
                      label={{
                        value: chart.unit,
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey={chart.key}
                      stroke={chart.color}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </>
        )}

        {activeTab === "solveDiagram" && <SolveDiagramTab />}
      </div>
    </div>
  );
};

export default BeamCalculator;
