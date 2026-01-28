"use client";

import React, { useState, useEffect } from "react";
import styles from "./style.module.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { BeamFormulas, BeamInput, Moments, suggestFormula } from "./helpers";

// Define support type
type SupportType = "fixed" | "pinned" | "roller" | "free";
type Tab = "analysis" | "visual" | "reactions" | "forces" | "diagrams";

const BeamCalculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("analysis");
  const [activeFormula, setActiveFormula] =
    useState<string>("Slope-Deflection");

  const [params, setParams] = useState<BeamInput>({
    L: 5,
    EI: 10000,
    w: 10,
    supportA: "fixed",
    supportB: "fixed",
  });

  const [moments, setMoments] = useState<Moments>({ M_AB: 0, M_BA: 0 });

  // ================== INPUT HANDLER ==================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setParams({
      ...params,
      [name]: isNaN(Number(value)) ? value : parseFloat(value),
    });
  };

  // ================== CALCULATION ==================
  const calculateResults = (formula?: string) => {
    const selected = formula || activeFormula;
    const calcFunc = BeamFormulas[selected];
    if (!calcFunc) return;

    setMoments(calcFunc(params));
    setActiveFormula(selected);
  };

  // Automatically suggest formula based on input changes
  useEffect(() => {
    const suggested = suggestFormula(params);
    calculateResults(suggested);
  }, [params]);

  // ================== SUPPORT REACTIONS ==================
  // Simple assumptions for demonstration
  const RA =
    params.supportA === "fixed" || params.supportA === "pinned"
      ? ((params.w ?? 0) * params.L) / 2
      : 0;

  const RB =
    params.supportB === "fixed" || params.supportB === "pinned"
      ? ((params.w ?? 0) * params.L) / 2
      : 0;

  // ================== DIAGRAM DATA ==================
  const divisions = 50;
  const dx = params.L / divisions;

  const diagramData = Array.from({ length: divisions + 1 }, (_, i) => {
    const x = i * dx;
    const w = params.w ?? 0;
    const V = RA - w * x;
    const M = RA * x - (w * x * x) / 2 + moments.M_AB;
    const y =
      (w * x * (params.L ** 3 - 2 * params.L * x ** 2 + x ** 3)) /
      (24 * params.EI);

    return {
      x: Number(x.toFixed(2)),
      shear: Number(V.toFixed(2)),
      moment: Number(M.toFixed(2)),
      deflection: Number(y.toFixed(4)),
    };
  });

  const maxDeflection =
    diagramData.length > 0
      ? Math.max(...diagramData.map((d) => Math.abs(d.deflection)))
      : 1;
  const deflectionScale = maxDeflection > 0 ? 50 / maxDeflection : 1;

  // ================== SUPPORT SYMBOL ==================
  const supportSymbol = (
    type: SupportType | undefined,
    x: number,
    y: number,
  ) => {
    switch (type) {
      case "fixed":
        return (
          <polygon
            points={`${x - 5},${y - 5} ${x},${y} ${x - 5},${y + 5}`}
            fill="#718096"
          />
        );
      case "pinned":
        return <circle cx={x} cy={y} r={5} fill="#718096" />;
      case "roller":
        return <ellipse cx={x} cy={y} rx={5} ry={3} fill="#718096" />;
      case "free":
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Structural Analysis – Beam</h2>

      {/* ================== INPUTS ================== */}
      <div className={styles.inputGrid}>
        {[
          { label: "Length L (m)", name: "L" },
          { label: "EI (kNm²)", name: "EI" },
          { label: "UDL w (kN/m)", name: "w" },
        ].map((inp) => (
          <div key={inp.name} className={styles.inputGroup}>
            <label>{inp.label}</label>
            <input
              type="number"
              name={inp.name}
              value={params[inp.name as keyof BeamInput]}
              onChange={handleChange}
            />
          </div>
        ))}

        {["supportA", "supportB"].map((s) => (
          <div key={s} className={styles.inputGroup}>
            <label>{s}</label>
            <select
              name={s}
              value={params[s as keyof BeamInput]}
              onChange={handleChange}
            >
              <option value="fixed">Fixed</option>
              <option value="pinned">Pinned</option>
              <option value="roller">Roller</option>
              <option value="free">Free</option>
            </select>
          </div>
        ))}
      </div>

      {/* ================== TABS ================== */}
      <div className={styles.tabs}>
        {["analysis", "visual", "reactions", "forces", "diagrams"].map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as Tab)}
              className={activeTab === tab ? styles.active : ""}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ),
        )}
      </div>

      {/* ================== TAB CONTENT ================== */}
      <div className={styles.tabContent}>
        {/* ANALYSIS */}
        {activeTab === "analysis" && (
          <>
            <h3>Structural Analysis Results</h3>
            <div style={{ display: "flex", gap: 20 }}>
              {[
                { label: "M_AB", value: moments.M_AB ?? 0 },
                { label: "M_BA", value: moments.M_BA ?? 0 },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: 15,
                    backgroundColor: "#edf2f7",
                    borderRadius: 8,
                  }}
                >
                  <p>{item.label}</p>
                  <p
                    style={{
                      color: item.value >= 0 ? "#38a169" : "#e53e3e",
                    }}
                  >
                    {item.value.toFixed(2)} kNm
                  </p>
                </div>
              ))}
            </div>

            {/* Formula Selection */}
            <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
              {(Object.keys(BeamFormulas) as (keyof typeof BeamFormulas)[]).map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => calculateResults(f)}
                    style={{
                      padding: "5px 10px",
                      backgroundColor:
                        activeFormula === f ? "#2b6cb0" : "#38a169",
                      color: "#fff",
                    }}
                  >
                    {f}
                  </button>
                ),
              )}
            </div>

            <p style={{ marginTop: 10 }}>Current formula: {activeFormula}</p>
          </>
        )}

        {/* VISUAL */}
        {activeTab === "visual" && (
          <div>
            <h3>Beam Visualization</h3>
            <svg width={(params.L ?? 0) * 100 + 60} height={150}>
              {/* Beam */}
              <line
                x1={30}
                y1={75}
                x2={30 + (params.L ?? 0) * 100}
                y2={75}
                stroke="#2d3748"
                strokeWidth={8}
              />

              {/* Supports */}
              {supportSymbol(params.supportA, 30, 75)}
              {supportSymbol(params.supportB, 30 + (params.L ?? 0) * 100, 75)}

              {/* UDL arrows */}
              {(params.w ?? 0) > 0 &&
                Array.from({ length: 10 }, (_, i) => {
                  const x = 30 + (i / 9) * (params.L ?? 0) * 100;
                  return (
                    <line
                      key={i}
                      x1={x}
                      y1={50}
                      x2={x}
                      y2={75}
                      stroke="#e53e3e"
                      strokeWidth={2}
                      markerEnd="url(#arrow)"
                    />
                  );
                })}

              {/* Deflection shape */}
              <polyline
                fill="none"
                stroke="#38a169"
                strokeWidth={2}
                points={diagramData
                  .map(
                    (d) =>
                      `${30 + (d.x / (params.L ?? 1)) * (params.L ?? 0) * 100},${
                        75 - d.deflection * deflectionScale
                      }`,
                  )
                  .join(" ")}
              />    

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
            </svg>
            <p style={{ marginTop: 10, fontSize: 14, color: "#4a5568" }}>
              Red arrows: UDL; Green curve: Deflected shape (scaled)
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
            {[
              { label: "R_A", value: RA, type: params.supportA },
              { label: "R_B", value: RB, type: params.supportB },
            ].map((r) => (
              <div
                key={r.label}
                style={{
                  backgroundColor: "#edf2f7",
                  padding: 15,
                  borderRadius: 8,
                  minWidth: 150,
                  textAlign: "center",
                }}
              >
                <p style={{ fontWeight: "bold", color: "#2b6cb0" }}>
                  {r.label} ({r.type})
                </p>
                <p
                  style={{
                    fontSize: 18,
                    color: r.value >= 0 ? "#38a169" : "#e53e3e",
                  }}
                >
                  {r.value.toFixed(2)} kN
                </p>
                <p style={{ fontSize: 12, color: "#4a5568" }}>
                  {r.value >= 0 ? "Upward" : "Downward"}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* MEMBER FORCES */}
        {activeTab === "forces" && (
          <div
            style={{
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
              marginTop: 10,
            }}
          >
            {[
              { label: "M_A", value: moments.M_AB },
              { label: "M_B", value: moments.M_BA },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  backgroundColor: "#edf2f7",
                  padding: 15,
                  borderRadius: 8,
                  minWidth: 150,
                  textAlign: "center",
                }}
              >
                <p style={{ fontWeight: "bold", color: "#2b6cb0" }}>
                  {item.label}
                </p>
                <p
                  style={{
                    fontSize: 18,
                    color: item.value >= 0 ? "#38a169" : "#e53e3e",
                  }}
                >
                  {item.value.toFixed(2)} kNm
                </p>
                <p style={{ fontSize: 12, color: "#4a5568" }}>
                  {item.value >= 0 ? "Sagging" : "Hogging"}
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
                  <LineChart data={diagramData}>
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
      </div>
    </div>
  );
};

export default BeamCalculator;
