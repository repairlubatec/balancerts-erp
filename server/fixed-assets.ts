export type FixedAssetLifecycleInput = {
  acquisitionDate: Date;
  inServiceDate?: Date | null;
  status: "ACTIVE" | "DISPOSED";
  disposalDate?: Date | null;
  disposalProceeds?: number;
  disposalReason?: string | null;
};

export function validateFixedAssetLifecycle(input: FixedAssetLifecycleInput) {
  if (input.inServiceDate && input.inServiceDate.getTime() < input.acquisitionDate.getTime()) throw new Error("INVALID_FIXED_ASSET_SERVICE_DATE");
  if (input.disposalDate && input.inServiceDate && input.disposalDate.getTime() < input.inServiceDate.getTime()) throw new Error("INVALID_FIXED_ASSET_DISPOSAL_DATE");
  if ((input.disposalProceeds ?? 0) < 0) throw new Error("INVALID_FIXED_ASSET_DISPOSAL_PROCEEDS");
  if (input.status === "DISPOSED" && (!input.disposalDate || !input.disposalReason?.trim())) throw new Error("FIXED_ASSET_DISPOSAL_EVIDENCE_REQUIRED");
  if (input.status === "ACTIVE" && (input.disposalDate || input.disposalReason?.trim())) throw new Error("ACTIVE_FIXED_ASSET_CANNOT_HAVE_DISPOSAL_DATA");
  return true;
}

export type DepreciationInput = { acquisitionCost: number; residualValue: number; usefulLifeMonths: number; elapsedMonths: number };

export function calculateStraightLineDepreciation(input: DepreciationInput) {
  if (input.acquisitionCost < 0 || input.residualValue < 0 || input.residualValue > input.acquisitionCost || input.usefulLifeMonths <= 0 || input.elapsedMonths < 0) throw new Error("INVALID_DEPRECIATION_PARAMETERS");
  const depreciable = input.acquisitionCost - input.residualValue;
  const monthly = Math.round((depreciable / input.usefulLifeMonths) * 100) / 100;
  const accumulated = Math.min(depreciable, Math.round(monthly * Math.min(input.elapsedMonths, input.usefulLifeMonths) * 100) / 100);
  return { depreciable, monthly, accumulated, netBookValue: Math.round((input.acquisitionCost - accumulated) * 100) / 100 };
}
