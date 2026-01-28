// beamFormulas.ts
export interface Moments {
  M_AB: number;
  M_BA: number;
}

export interface BeamInput {
  L: number;
  EI: number;
  w?: number;
  P?: number;
  a?: number;
  supportA?: "fixed" | "pinned" | "roller" | "free";
  supportB?: "fixed" | "pinned" | "roller" | "free";
}

// ================== FORMULAS ==================

/**
 * Slope-Deflection Method for single-span fixed-fixed beam with UDL
 */
export const calcSlopeDeflection = ({ L, EI, w = 0 }: BeamInput): Moments => {
  const FEM_AB = -(w * L * L) / 12;
  const FEM_BA = (w * L * L) / 12;

  const thetaA = (w * L ** 3) / (24 * EI);
  const thetaB = (w * L ** 3) / (24 * EI);

  const M_AB = ((2 * EI) / L) * (2 * thetaA + thetaB) + FEM_AB;
  const M_BA = ((2 * EI) / L) * (2 * thetaB + thetaA) + FEM_BA;

  return { M_AB, M_BA };
};

/**
 * Fixed-Fixed Approximation for UDL
 */
export const calcFixedFixedApprox = ({ L, w = 0 }: BeamInput): Moments => {
  const M_support = (w * L * L) / 12;
  return { M_AB: -M_support, M_BA: M_support };
};

/**
 * Cantilever Approximation (fixed at A, free at B)
 */
export const calcCantileverApprox = ({ L, w = 0 }: BeamInput): Moments => {
  // Fixed end A, free end B
  const M_AB = (-w * L * L) / 2; // max moment at fixed end
  const M_BA = 0; // free end has zero moment
  return { M_AB, M_BA };
};

/**
 * Moment Distribution Method placeholder
 * Can be expanded for multi-span beams
 */
export const calcMomentDistribution = ({
  L,
  EI,
  w = 0,
}: BeamInput): Moments => {
  // For now, simplified equal to slope-deflection
  return calcSlopeDeflection({ L, EI, w });
};

// ================== FORMULAS OBJECT ==================

export type BeamFormula = (input: BeamInput) => Moments;

export const BeamFormulas: Record<string, BeamFormula> = {
  "Slope-Deflection": calcSlopeDeflection,
  "Fixed-Fixed Approx": calcFixedFixedApprox,
  "Cantilever Approx": calcCantileverApprox,
  "Moment Distribution": calcMomentDistribution,
};

// ================== SMART FORMULA SUGGESTION ==================

export const suggestFormula = (input: BeamInput): string => {
  // Basic rules
  if (input.supportA === "fixed" && input.supportB === "free")
    return "Cantilever Approx";
  if (input.supportA === "fixed" && input.supportB === "fixed")
    return "Slope-Deflection";
  if (input.supportA === "pinned" && input.supportB === "pinned")
    return "Fixed-Fixed Approx";
  // Default fallback
  return "Slope-Deflection";
};
