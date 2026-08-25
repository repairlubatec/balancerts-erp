export type IrtBracket = { upTo: number | null; rate: number; fixed?: number };

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function parseIrtBrackets(value: string): IrtBracket[] {
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("IRT_TABLE_INVALID");
  const brackets = parsed.map((item) => {
    if (!item || typeof item !== "object") throw new Error("IRT_TABLE_INVALID");
    const candidate = item as Record<string, unknown>;
    const upTo = candidate.upTo === null ? null : Number(candidate.upTo);
    const rate = Number(candidate.rate);
    const fixed = candidate.fixed === undefined ? undefined : Number(candidate.fixed);
    if ((upTo !== null && (!Number.isFinite(upTo) || upTo < 0)) || !Number.isFinite(rate) || rate < 0 || rate > 100 || (fixed !== undefined && (!Number.isFinite(fixed) || fixed < 0))) throw new Error("IRT_TABLE_INVALID");
    return { upTo, rate, fixed };
  });
  for (let index = 1; index < brackets.length; index += 1) {
    const previousLimit = brackets[index - 1].upTo;
    const currentLimit = brackets[index].upTo;
    if (previousLimit !== null && currentLimit !== null && currentLimit <= previousLimit) throw new Error("IRT_TABLE_INVALID");
  }
  if (brackets[brackets.length - 1].upTo !== null) throw new Error("IRT_TABLE_MUST_HAVE_OPEN_BAND");
  return brackets;
}

export function calculateProgressiveIrt(taxableAmount: number, brackets: IrtBracket[]) {
  if (!Number.isFinite(taxableAmount) || taxableAmount < 0) throw new Error("IRT_TAXABLE_INVALID");
  let previousLimit = 0;
  let tax = 0;
  for (const bracket of brackets) {
    const upper = bracket.upTo ?? taxableAmount;
    const portion = Math.max(0, Math.min(taxableAmount, upper) - previousLimit);
    tax += portion * (bracket.rate / 100);
    if (bracket.upTo !== null) previousLimit = bracket.upTo;
    if (taxableAmount <= upper) break;
  }
  const selected = brackets.find((bracket) => bracket.upTo === null || taxableAmount <= bracket.upTo);
  if (selected?.fixed !== undefined) tax += selected.fixed;
  return roundMoney(Math.max(0, tax));
}

export function assertSecondApprover(preparedBy: number, approverId: number) {
  if (preparedBy === approverId) throw new Error("PAYROLL_ACCOUNTING_SECOND_APPROVER_REQUIRED");
}

export function requirePgcPayrollMappings(input: {
  hasActiveVersion: boolean;
  configuredCodes: readonly (string | null)[];
  mappings: ReadonlyMap<string, number>;
}) {
  if (!input.hasActiveVersion)
    throw new Error("PAYROLL_PGC_ACTIVE_VERSION_REQUIRED");
  if (input.configuredCodes.some((code) => !code || !input.mappings.get(code)))
    throw new Error("PAYROLL_PGC_OPERATIONAL_MAPPING_REQUIRED");
  return true as const;
}

export function calculatePayrollAmounts(input: { grossAmount: number; socialEmployeeRate: number; socialEmployerRate: number; irtBrackets: IrtBracket[] }) {
  if (!Number.isFinite(input.grossAmount) || input.grossAmount < 0) throw new Error("GROSS_AMOUNT_INVALID");
  if (![input.socialEmployeeRate, input.socialEmployerRate].every((rate) => Number.isFinite(rate) && rate >= 0 && rate <= 100)) throw new Error("SOCIAL_RATE_INVALID");
  const grossAmount = roundMoney(input.grossAmount);
  const socialEmployeeAmount = roundMoney(grossAmount * input.socialEmployeeRate / 100);
  const socialEmployerAmount = roundMoney(grossAmount * input.socialEmployerRate / 100);
  const taxableAmount = roundMoney(Math.max(0, grossAmount - socialEmployeeAmount));
  const irtAmount = calculateProgressiveIrt(taxableAmount, input.irtBrackets);
  const netAmount = roundMoney(Math.max(0, grossAmount - socialEmployeeAmount - irtAmount));
  return { grossAmount, socialEmployeeAmount, socialEmployerAmount, taxableAmount, irtAmount, netAmount };
}
