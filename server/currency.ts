export type ExchangeRate = { from: string; to: string; rate: number; source: string; date: string };

export function convertToFunctionalCurrency(amount: number, operationCurrency: string, functionalCurrency: string, quote: ExchangeRate) {
  if (amount < 0 || !operationCurrency || !functionalCurrency || quote.rate <= 0 || quote.from !== operationCurrency || quote.to !== functionalCurrency) throw new Error("INVALID_EXCHANGE_RATE_CONTEXT");
  return { operationAmount: amount, operationCurrency, functionalAmount: Math.round(amount * quote.rate * 100) / 100, functionalCurrency, rate: quote.rate, source: quote.source, date: quote.date };
}
