// diagramSolver.ts
import { BeamSystem } from "./main/helpers";

export interface DiagramPoint {
  x: number;
  shear: number;
  moment: number;
  deflection: number;
}

export const solveBeamDiagrams = (
  beam: BeamSystem,
  divisions = 50,
): DiagramPoint[] => {
  const data: DiagramPoint[] = [];

  let xOffset = 0;

  // carry-over values between spans
  let V0 = 0; // shear at span start
  let M0 = 0; // moment at span start
  let y0 = 0; // deflection at span start
  let theta0 = 0; // slope at span start (simplified)

  beam.spans.forEach((span) => {
    const dx = span.L / divisions;

    for (let i = 0; i <= divisions; i++) {
      const x = i * dx;
      const xGlobal = xOffset + x;

      let V = V0;
      let M = M0;
      let y = y0 + theta0 * x;

      // ================= UDL =================
      if (span.w) {
        const w = span.w;

        V -= w * x;
        M -= (w * x * x) / 2;
        y -= (w * x ** 4) / (24 * span.EI);
      }

      // ================= LINEAR VARYING LOAD =================
      (span.varyingLoad || []).forEach((vl) => {
        const w1 = vl.w1 || 0;
        const w2 = vl.w2 || 0;

        const k = (w2 - w1) / span.L; // slope

        // w(x) = w1 + kx
        V -= w1 * x + (k * x * x) / 2;
        M -= (w1 * x * x) / 2 + (k * x ** 3) / 6;
        y -=
          (w1 * x ** 4) / (24 * span.EI) +
          (k * x ** 5) / (120 * span.EI);
      });

      // ================= POINT LOADS =================
      (span.pointLoads || []).forEach((pl) => {
        if (x >= pl.a) {
          V -= pl.P;
          M -= pl.P * (x - pl.a);
        }
      });

      // ================= POINT MOMENTS =================
      (span.pointMoments || []).forEach((pm) => {
        if (x >= pm.a) {
          M -= pm.M;
        }
      });

      data.push({
        x: xGlobal,
        shear: V,
        moment: M,
        deflection: y,
      });

      // store end values
      if (i === divisions) {
        V0 = V;
        M0 = M;
        y0 = y;
      }
    }

    xOffset += span.L;
  });

  return data;
};
