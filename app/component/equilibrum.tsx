import React from "react";

interface Props {
  moments: number[];
}

const Equilibrium: React.FC<Props> = ({ moments }) => {
  const sum = moments.reduce((a, b) => a + b, 0);
  const ok = Math.abs(sum) < 1e-3;

  return (
    <div
      style={{
        background: ok ? "#f0fff4" : "#fff5f5",
        borderRadius: 12,
        padding: 16,
        minWidth: 260,
        boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
        border: `1px solid ${ok ? "#9ae6b4" : "#feb2b2"}`,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          marginBottom: 8,
          color: ok ? "#065f46" : "#7f1d1d",
        }}
      >
        Joint Equilibrium
      </div>

      <div style={{ fontSize: 14 }}>
        ΣM =
        <span
          style={{
            marginLeft: 6,
            fontWeight: 600,
            color: ok ? "#38a169" : "#e53e3e",
          }}
        >
          {sum.toFixed(3)} kNm
        </span>
      </div>

      <div
        style={{
          marginTop: 10,
          padding: "6px 10px",
          borderRadius: 8,
          background: ok ? "#c6f6d5" : "#fed7d7",
          fontSize: 13,
          fontWeight: 600,
          textAlign: "center",
          color: ok ? "#065f46" : "#7f1d1d",
        }}
      >
        {ok ? "Equilibrium satisfied ✓" : "Equilibrium not satisfied ✕"}
      </div>
    </div>
  );
};

export default Equilibrium;
