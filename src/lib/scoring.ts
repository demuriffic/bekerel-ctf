/**
 * Dynamic Scoring with Logarithmic Decay
 *
 * formula: current_points = Math.max(minPoints, Math.round(maxPoints - decayFactor * Math.log(solveCount + 1)))
 */
export function calculateDynamicPoints(
  maxPoints: number,
  minPoints: number,
  decayFactor: number,
  solveCount: number
): number {
  if (solveCount <= 0) {
    return maxPoints;
  }

  const decayed = Math.round(maxPoints - decayFactor * Math.log(solveCount + 1));
  return Math.max(minPoints, Math.min(maxPoints, decayed));
}
