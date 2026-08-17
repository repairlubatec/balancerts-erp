export type StockMovement = { type: "IN" | "OUT"; quantity: number; unitCost: number };

export function calculateWeightedAverage(movements: StockMovement[]) {
  let quantity = 0;
  let value = 0;
  for (const movement of movements) {
    if (movement.quantity <= 0 || movement.unitCost < 0) throw new Error("INVALID_STOCK_MOVEMENT");
    if (movement.type === "IN") {
      quantity += movement.quantity;
      value += movement.quantity * movement.unitCost;
    } else {
      if (movement.quantity > quantity) throw new Error("NEGATIVE_STOCK_NOT_ALLOWED");
      const averageCost = quantity === 0 ? 0 : value / quantity;
      quantity -= movement.quantity;
      value -= movement.quantity * averageCost;
    }
  }
  const averageCost = quantity === 0 ? 0 : Math.round((value / quantity) * 100) / 100;
  return { quantity, value: Math.round(value * 100) / 100, averageCost };
}
