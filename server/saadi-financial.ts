export type FeasibilityInput = {
  initialInvestment: number;
  discountRate: number;
  cashFlows: number[];
};

export type FeasibilityResult = {
  npv: number;
  irr: number | null;
  paybackMonths: number | null;
  roi: number;
  decision: "PROSSEGUIR" | "REVER" | "REJEITAR";
  discountedCashFlows: number[];
};

function ensureFinite(value: number, name: string) {
  if (!Number.isFinite(value)) throw new Error(`SAADI_${name}_INVALIDO`);
}

function npvAtRate(input: FeasibilityInput, rate: number) {
  return -input.initialInvestment + input.cashFlows.reduce((total, flow, index) => total + flow / Math.pow(1 + rate, index + 1), 0);
}

function irrFor(input: FeasibilityInput) {
  const hasPositive = input.cashFlows.some((flow) => flow > 0);
  const hasNegative = input.cashFlows.some((flow) => flow < 0) || input.initialInvestment > 0;
  if (!hasPositive || !hasNegative) return null;
  let low = -0.9999;
  let high = 10;
  let lowValue = npvAtRate(input, low);
  let highValue = npvAtRate(input, high);
  for (let attempt = 0; attempt < 12 && lowValue * highValue > 0; attempt += 1) {
    high *= 2;
    highValue = npvAtRate(input, high);
  }
  if (lowValue * highValue > 0) return null;
  for (let iteration = 0; iteration < 120; iteration += 1) {
    const middle = (low + high) / 2;
    const middleValue = npvAtRate(input, middle);
    if (Math.abs(middleValue) < 0.000001) return middle;
    if (lowValue * middleValue <= 0) {
      high = middle;
      highValue = middleValue;
    } else {
      low = middle;
      lowValue = middleValue;
    }
  }
  return (low + high) / 2;
}

function paybackFor(input: FeasibilityInput) {
  let accumulated = -input.initialInvestment;
  for (let index = 0; index < input.cashFlows.length; index += 1) {
    const previous = accumulated;
    accumulated += input.cashFlows[index];
    if (accumulated >= 0) {
      const flow = input.cashFlows[index];
      return flow === 0 ? index + 1 : index + previous * -1 / flow + 1;
    }
  }
  return null;
}

export type FinancingResult = { debtAmount: number; equityAmount: number; monthlyPayment: number; totalDebtService: number; totalInterest: number };

export function calculateFinancing(debtAmount: number, equityAmount: number, annualInterestRate: number, termMonths: number): FinancingResult {
  [debtAmount, equityAmount, annualInterestRate, termMonths].forEach((value) => ensureFinite(value, "FINANCIAMENTO"));
  if (debtAmount < 0 || equityAmount < 0 || annualInterestRate < 0 || annualInterestRate > 1 || !Number.isInteger(termMonths) || termMonths < 0 || termMonths > 360) throw new Error("SAADI_FINANCIAMENTO_INVALIDO");
  if (debtAmount > 0 && termMonths < 1) throw new Error("SAADI_PRAZO_DIVIDA_OBRIGATORIO");
  if (debtAmount === 0 || termMonths === 0) return { debtAmount, equityAmount, monthlyPayment: 0, totalDebtService: 0, totalInterest: 0 };
  const monthlyRate = annualInterestRate / 12;
  const monthlyPayment = monthlyRate === 0 ? debtAmount / termMonths : debtAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -termMonths));
  const totalDebtService = monthlyPayment * termMonths;
  return { debtAmount, equityAmount, monthlyPayment, totalDebtService, totalInterest: totalDebtService - debtAmount };
}

export type ValuationResult = { presentValueOfFlows: number; terminalValue: number; presentValueOfTerminal: number; estimatedValue: number; terminalGrowthRate: number };

export function calculateValuation(input: FeasibilityInput, terminalGrowthRate: number): ValuationResult {
  ensureFinite(terminalGrowthRate, "CRESCIMENTO_TERMINAL");
  if (terminalGrowthRate < 0 || terminalGrowthRate >= input.discountRate) throw new Error("SAADI_CRESCIMENTO_TERMINAL_INVALIDO");
  const presentValueOfFlows = input.cashFlows.reduce((total, flow, index) => total + flow / Math.pow(1 + input.discountRate, index + 1), 0);
  const lastCashFlow = input.cashFlows[input.cashFlows.length - 1];
  const terminalValue = lastCashFlow * (1 + terminalGrowthRate) / (input.discountRate - terminalGrowthRate);
  const presentValueOfTerminal = terminalValue / Math.pow(1 + input.discountRate, input.cashFlows.length);
  return { presentValueOfFlows, terminalValue, presentValueOfTerminal, estimatedValue: presentValueOfFlows + presentValueOfTerminal, terminalGrowthRate };
}

export type SensitivityPoint = { rateDelta: number; cashFlowDelta: number; npv: number; decision: FeasibilityResult["decision"] };

export function calculateSensitivity(input: FeasibilityInput, rateDeltas = [-0.02, 0, 0.02], cashFlowDeltas = [-0.1, 0, 0.1]): SensitivityPoint[] {
  if (rateDeltas.length > 9 || cashFlowDeltas.length > 9) throw new Error("SAADI_SENSIBILIDADE_LIMITE");
  return rateDeltas.flatMap((rateDelta) => cashFlowDeltas.map((cashFlowDelta) => {
    const result = calculateFeasibility({ initialInvestment: input.initialInvestment, discountRate: input.discountRate + rateDelta, cashFlows: input.cashFlows.map((flow) => flow * (1 + cashFlowDelta)) });
    return { rateDelta, cashFlowDelta, npv: result.npv, decision: result.decision };
  }));
}

export function calculateFeasibility(input: FeasibilityInput): FeasibilityResult {
  ensureFinite(input.initialInvestment, "INVESTIMENTO");
  ensureFinite(input.discountRate, "TAXA");
  if (input.initialInvestment <= 0) throw new Error("SAADI_INVESTIMENTO_INVALIDO");
  if (input.discountRate <= -1) throw new Error("SAADI_TAXA_INVALIDA");
  if (!input.cashFlows.length || input.cashFlows.length > 120) throw new Error("SAADI_FLUXOS_INVALIDOS");
  input.cashFlows.forEach((flow) => ensureFinite(flow, "FLUXO"));
  const discountedCashFlows = input.cashFlows.map((flow, index) => flow / Math.pow(1 + input.discountRate, index + 1));
  const npv = -input.initialInvestment + discountedCashFlows.reduce((sum, flow) => sum + flow, 0);
  const totalFlows = input.cashFlows.reduce((sum, flow) => sum + flow, 0);
  const roi = (totalFlows - input.initialInvestment) / input.initialInvestment;
  const irr = irrFor(input);
  const decision = npv > 0 && (irr === null || irr > input.discountRate) ? "PROSSEGUIR" : npv >= 0 ? "REVER" : "REJEITAR";
  return { npv, irr, paybackMonths: paybackFor(input), roi, decision, discountedCashFlows };
}


export type ExtendedIndicatorsInput = {
  initialInvestment: number;
  discountRate: number;
  cashFlows: number[];
  revenue?: number[];
  grossProfit?: number[];
  operatingProfit?: number[];
  ebitda?: number[];
  netIncome?: number[];
  fixedCosts?: number[];
  variableCosts?: number[];
  unitPrice?: number;
  variableCostPerUnit?: number;
  debtService?: number[];
};

export type ExtendedIndicatorsResult = {
  discountedPaybackMonths: number | null;
  breakEvenFinancial: number | null;
  breakEvenEconomic: number | null;
  breakEvenUnits: number | null;
  breakEvenValue: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  ebitdaMargin: number | null;
  netMargin: number | null;
  dscr: number | null;
  profitabilityIndex: number;
};

function sum(values: number[] | undefined) {
  return (values ?? []).reduce((total, value) => total + value, 0);
}

function margin(numerator: number[] | undefined, denominator: number[] | undefined) {
  const base = sum(denominator);
  return base === 0 ? null : sum(numerator) / base;
}

export function calculateExtendedIndicators(input: ExtendedIndicatorsInput): ExtendedIndicatorsResult {
  [input.initialInvestment, input.discountRate].forEach((value) => ensureFinite(value, "INDICADORES"));
  if (input.initialInvestment <= 0 || input.discountRate <= -1) throw new Error("SAADI_INDICADORES_INVALIDOS");
  const discountedFlows = input.cashFlows.map((flow, index) => flow / Math.pow(1 + input.discountRate, index + 1));
  let accumulated = -input.initialInvestment;
  let discountedPaybackMonths: number | null = null;
  for (let index = 0; index < discountedFlows.length; index += 1) {
    const previous = accumulated;
    accumulated += discountedFlows[index];
    if (accumulated >= 0) {
      discountedPaybackMonths = discountedFlows[index] === 0 ? index + 1 : index + previous * -1 / discountedFlows[index] + 1;
      break;
    }
  }
  const presentValueInflows = discountedFlows.filter((value) => value > 0).reduce((total, value) => total + value, 0);
  const profitabilityIndex = presentValueInflows / input.initialInvestment;
  const revenue = sum(input.revenue) || null;
  const totalFixedCosts = sum(input.fixedCosts);
  const totalVariableCosts = sum(input.variableCosts);
  const contributionMargin = input.unitPrice !== undefined && input.variableCostPerUnit !== undefined ? input.unitPrice - input.variableCostPerUnit : null;
  const breakEvenUnits = contributionMargin !== null && contributionMargin > 0 ? totalFixedCosts / contributionMargin : null;
  const breakEvenValue = breakEvenUnits !== null && input.unitPrice !== undefined ? breakEvenUnits * input.unitPrice : null;
  const breakEvenFinancial = revenue !== null && revenue > 0 ? (totalFixedCosts + totalVariableCosts) / revenue : null;
  const breakEvenEconomic = contributionMargin !== null && contributionMargin > 0 ? totalFixedCosts / contributionMargin : null;
  const debtService = sum(input.debtService);
  const cashAvailableForDebt = sum(input.ebitda) || sum(input.cashFlows);
  return {
    discountedPaybackMonths,
    breakEvenFinancial,
    breakEvenEconomic,
    breakEvenUnits,
    breakEvenValue,
    grossMargin: margin(input.grossProfit, input.revenue),
    operatingMargin: margin(input.operatingProfit, input.revenue),
    ebitdaMargin: margin(input.ebitda, input.revenue),
    netMargin: margin(input.netIncome, input.revenue),
    dscr: debtService > 0 ? cashAvailableForDebt / debtService : null,
    profitabilityIndex,
  };
}
