export type DepreciationInput = { acquisitionCost: number; residualValue: number; usefulLifeMonths: number; elapsedMonths: number };

export function calculateStraightLineDepreciation(input: DepreciationInput) {
  if (input.acquisitionCost < 0 || input.residualValue < 0 || input.residualValue > input.acquisitionCost || input.usefulLifeMonths <= 0 || input.elapsedMonths < 0) throw new Error("INVALID_DEPRECIATION_PARAMETERS");
  const depreciable = input.acquisitionCost - input.residualValue;
  const monthly = Math.round((depreciable / input.usefulLifeMonths) * 100) / 100;
  const accumulated = Math.min(depreciable, Math.round(monthly * Math.min(input.elapsedMonths, input.usefulLifeMonths) * 100) / 100);
  return { depreciable, monthly, accumulated, netBookValue: Math.round((input.acquisitionCost - accumulated) * 100) / 100 };
}
