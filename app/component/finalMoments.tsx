import React from "react";

interface Props {
  spanId: number;
  MAB: number;
  MBA: number;
}

const FinalMoment: React.FC<Props> = ({ spanId, MAB, MBA }) => {
  const color = (m: number) => (m >= 0 ? "#68d391" : "#fc8181");

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1f2937, #111827)",
        color: "#edf2f7",
        borderRadius: 12,
        padding: 16,
        minWidth: 260,
        boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          marginBottom: 10,
          fontSize: 15,
        }}
      >
        Final End Moments — Span {spanId}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span>M<sub>AB</sub></span>
        <span style={{ color: color(MAB), fontWeight: 600 }}>
          {MAB.toFixed(2)} kNm
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>M<sub>BA</sub></span>
        <span style={{ color: color(MBA), fontWeight: 600 }}>
          {MBA.toFixed(2)} kNm
        </span>
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 12,
          color: "#9ca3af",
        }}
      >
        Governing design values
      </div>
    </div>
  );
};

export default FinalMoment;
