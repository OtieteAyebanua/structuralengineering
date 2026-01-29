// diagramSolver.ts
import { BeamSystem } from "./helpers";

export interface DiagramPoint {
  x: number;
  shear: number;
  moment: number;
  deflection: number;
}

// Solve diagrams (simplified, superposition)
export const solveBeamDiagrams = (beam: BeamSystem, divisions = 50): DiagramPoint[] => {
  const data: DiagramPoint[] = [];

  let xOffset = 0; // global x along the beam

  beam.spans.forEach((span) => {
    const dx = span.L / divisions;

    for (let i = 0; i <= divisions; i++) {
      const xLocal = i * dx; // local x in current span
      const xGlobal = xOffset + xLocal;

      let V = 0;
      let M = 0;
      let y = 0;

      // --------- Uniform Distributed Load ---------
      if (span.w) {
        // Shear: V = w*(L/2 - x) for simply supported
        V -= span.w * (span.L - xLocal);
        // Moment: M = w*x*(L - x)/2 (approx for simply supported)
        M += (span.w * xLocal * (span.L - xLocal)) / 2;
        // Deflection (simplified)
        y += (span.w * xLocal * (span.L ** 3 - 2 * span.L * xLocal ** 2 + xLocal ** 3)) / (24 * span.EI);
      }

      // --------- Linearly Varying Loads ---------
      (span.varyingLoad || []).forEach((vl) => {
        const w1 = vl.w1 || 0;
        const w2 = vl.w2 || 0;
        // Linear load at position x: w(x) = w1 + (w2 - w1) * (x/L)
        const wx = w1 + ((w2 - w1) * xLocal) / span.L;
        // Shear from triangular/trapezoidal load: V -= integral w dx approx
        V -= wx * dx;
        // Moment from triangular load (simplified)
        M += wx * xLocal * dx / 2;
        // Deflection contribution (simplified)
        y += (wx * xLocal * (span.L ** 3 - 2 * span.L * xLocal ** 2 + xLocal ** 3)) / (24 * span.EI);
      });

      // --------- Point Loads ---------
      (span.pointLoads || []).forEach((pl) => {
        if (xLocal >= pl.a) {
          V -= pl.P;
          M += pl.P * (xLocal - pl.a);
          // Deflection contribution ignored for simplicity
        }
      });

      // --------- Point Moments ---------
      (span.pointMoments || []).forEach((pm) => {
        if (xLocal >= pm.a) {
          M += pm.M;
          // Deflection contribution ignored
        }
      });

      data.push({
        x: xGlobal,
        shear: V,
        moment: M,
        deflection: y,
      });
    }

    xOffset += span.L;
  });

  return data;
};
