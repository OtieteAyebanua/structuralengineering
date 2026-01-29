// ================== DATA MODELS ==================

export type SupportType = "fixed" | "pinned" | "roller" | "free";

export interface Node {
  id: number;
  support: SupportType;
  settlement?: number; // Δ in meters (optional)
}

export interface Span {
  id: number;
  startNode: number;
  endNode: number;
  L: number;
  EI: number; // Flexural rigidity
  w?: number; // Uniformly distributed load (kN/m)
  pointLoads?: { P: number; a: number }[];
  pointMoments?: { M: number; a: number }[];
  varyingLoad?: { w1: number; w2: number }[];
  deltaStart?: number; // settlement at start node
  deltaEnd?: number;   // settlement at end node
}

export interface BeamSystem {
  nodes: Node[];
  spans: Span[];
}

export interface EndMoments {
  spanId: number;
  M_AB: number;
  M_BA: number;
  pointLoads?: { P: number; a: number }[];
  pointMoments?: { M: number; a: number }[];
  varyingLoad?: { w1: number; w2: number }[];
}

// ================== FIXED-END MOMENTS ==================
const fixedEndMoments = (span: Span) => {
  const L = span.L;
  let FEM_AB = 0;
  let FEM_BA = 0;

  const w = span.w ?? 0;
  FEM_AB += -(w * L * L) / 12;
  FEM_BA += (w * L * L) / 12;

  if (span.pointLoads) {
    span.pointLoads.forEach(({ P, a }) => {
      const b = L - a;
      FEM_AB += -(P * a * b * b) / (L * L);
      FEM_BA += (P * a * a * b) / (L * L);
    });
  }

  if (span.pointMoments) {
    span.pointMoments.forEach(({ M, a }) => {
      const b = L - a;
      FEM_AB += -(M * b) / L;
      FEM_BA += -(M * a) / L;
    });
  }

  if (span.varyingLoad) {
    span.varyingLoad.forEach(({ w1, w2 }) => {
      const wAvg = (w1 + w2) / 2;
      FEM_AB += -(wAvg * L * L) / 12;
      FEM_BA += (wAvg * L * L) / 12;
    });
  }

  return { FEM_AB, FEM_BA };
};

// ================== SLOPE-DEFLECTION WITH SETTLEMENT ==================
const slopeDeflectionMoments = (
  span: Span,
  thetaA: number,
  thetaB: number
) => {
  const { L, EI, deltaStart = 0, deltaEnd = 0 } = span;
  const { FEM_AB, FEM_BA } = fixedEndMoments(span);

  // include member settlement Δ: 6EI Δ / L^2 term
  const settlementEffect_AB = -(6 * EI * deltaStart) / (L * L) - (6 * EI * deltaEnd) / (L * L);
  const settlementEffect_BA = (6 * EI * deltaStart) / (L * L) + (6 * EI * deltaEnd) / (L * L);

  const M_AB = (2 * EI / L) * (2 * thetaA + thetaB) + FEM_AB + settlementEffect_AB;
  const M_BA = (2 * EI / L) * (2 * thetaB + thetaA) + FEM_BA + settlementEffect_BA;

  return { M_AB, M_BA };
};

// ================== MULTI-SPAN SOLVER ==================
export const solveMultiSpanSlopeDeflection = (
  system: BeamSystem,
  iterations = 50
): EndMoments[] => {
  const theta: Record<number, number> = {};

  // Initialize rotations
  system.nodes.forEach((n) => {
    theta[n.id] = n.support === "fixed" ? 0 : 0.0001;
  });

  // Iterative solution for unknown rotations
  for (let iter = 0; iter < iterations; iter++) {
    system.nodes.forEach((node) => {
      if (node.support === "fixed") return;

      let momentSum = 0;
      let stiffnessSum = 0;

      system.spans.forEach((span) => {
        if (span.startNode === node.id || span.endNode === node.id) {
          const L = span.L;
          const EI = span.EI;
          const otherNode = span.startNode === node.id ? span.endNode : span.startNode;

          momentSum += (2 * EI / L) * theta[otherNode];
          stiffnessSum += (4 * EI) / L;
        }
      });

      theta[node.id] = -momentSum / stiffnessSum;
    });
  }

  // Compute final end moments
  return system.spans.map((span) => {
    const thetaA = theta[span.startNode];
    const thetaB = theta[span.endNode];
    const { M_AB, M_BA } = slopeDeflectionMoments(span, thetaA, thetaB);

    return {
      spanId: span.id,
      M_AB,
      M_BA,
      pointLoads: span.pointLoads,
      pointMoments: span.pointMoments,
      varyingLoad: span.varyingLoad,
    };
  });
};
