import React from "react";

interface Props {
  spanId: number;
  femAB: number;
  femBA: number;
  EI: number;
  L: number;
  thetaA?: number;
  thetaB?: number;
}

const SlopeDeflection: React.FC<Props> = ({
  spanId,
  femAB,
  femBA,
  EI,
  L,
  thetaA = 0,
  thetaB = 0,
}) => {
  const factor = (2 * EI) / L;
  const MAB = femAB + factor * (2 * thetaA + thetaB);
  const MBA = femBA + factor * (2 * thetaB + thetaA);

  const momentColor = (m: number) =>
    m >= 0 ? "#38a169" : "#e53e3e";

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 12,
        padding: 16,
        minWidth: 260,
        boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        border: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          marginBottom: 10,
          color: "#2d3748",
        }}
      >
        Slope Deflection — Span {spanId}
      </div>

      <div style={{ fontSize: 13, color: "#4a5568", marginBottom: 8 }}>
        2EI / L = {(factor).toExponential(2)}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div>
          M<sub>AB</sub> ={" "}
          <span style={{ color: momentColor(MAB), fontWeight: 600 }}>
            {MAB.toFixed(2)} kNm
          </span>
        </div>
        <div>
          M<sub>BA</sub> ={" "}
          <span style={{ color: momentColor(MBA), fontWeight: 600 }}>
            {MBA.toFixed(2)} kNm
          </span>
        </div>
      </div>

      <div
        style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: "1px dashed #cbd5e0",
          fontSize: 12,
          color: "#718096",
        }}
      >
        FEM included · θ assumed zero
      </div>
    </div>
  );
};

export default SlopeDeflection;
