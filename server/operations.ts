export function normalizeWarehouseCode(value: string) {
  const code = value.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9._-]{0,39}$/.test(code)) throw new Error("WAREHOUSE_CODE_INVALID");
  return code;
}

export function buildStockTransfer(input: { fromWarehouseId: number; toWarehouseId: number; quantity: number; unitCost: number; productCode: string; transferGroupId: string }) {
  if (input.fromWarehouseId === input.toWarehouseId) throw new Error("STOCK_TRANSFER_SAME_WAREHOUSE");
  const movement = validateStockMovement({ type: "OUT", quantity: input.quantity, unitCost: input.unitCost });
  if (!input.productCode.trim() || input.transferGroupId.trim().length < 8) throw new Error("STOCK_TRANSFER_DATA_REQUIRED");
  return { ...movement, productCode: input.productCode.trim(), transferGroupId: input.transferGroupId.trim(), fromWarehouseId: input.fromWarehouseId, toWarehouseId: input.toWarehouseId };
}

export function validateStockCountLine(input: { productCode: string; expectedQuantity: number; countedQuantity: number; unitCost: number }) {
  const productCode = input.productCode.trim().toUpperCase();
  if (!productCode) throw new Error("STOCK_COUNT_PRODUCT_REQUIRED");
  if (!Number.isFinite(input.expectedQuantity) || input.expectedQuantity < 0) throw new Error("STOCK_COUNT_EXPECTED_INVALID");
  if (!Number.isFinite(input.countedQuantity) || input.countedQuantity < 0) throw new Error("STOCK_COUNT_COUNTED_INVALID");
  if (!Number.isFinite(input.unitCost) || input.unitCost < 0) throw new Error("STOCK_COUNT_UNIT_COST_INVALID");
  return { productCode, expectedQuantity: Number(input.expectedQuantity.toFixed(4)), countedQuantity: Number(input.countedQuantity.toFixed(4)), unitCost: Number(input.unitCost.toFixed(4)) };
}

export function validateStockMovement(input: { quantity: number; unitCost: number; type: "IN" | "OUT" }) {
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) throw new Error("STOCK_QUANTITY_INVALID");
  if (!Number.isFinite(input.unitCost) || input.unitCost < 0) throw new Error("STOCK_UNIT_COST_INVALID");
  return { ...input, quantity: Number(input.quantity.toFixed(4)), unitCost: Number(input.unitCost.toFixed(4)) };
}

export function validateStockReferenceScope(input: {
  periodFound: boolean;
  productFound: boolean;
  sourceDocumentFound: boolean;
  journalEntryFound: boolean;
  sourceDocumentMatchesJournal: boolean;
}) {
  if (!input.periodFound) throw new Error("STOCK_PERIOD_NOT_FOUND_OR_FORBIDDEN");
  if (!input.productFound) throw new Error("STOCK_PRODUCT_NOT_FOUND_OR_FORBIDDEN");
  if (!input.sourceDocumentFound) throw new Error("STOCK_SOURCE_DOCUMENT_NOT_FOUND_OR_FORBIDDEN");
  if (!input.journalEntryFound) throw new Error("STOCK_JOURNAL_ENTRY_NOT_FOUND_OR_FORBIDDEN");
  if (!input.sourceDocumentMatchesJournal) throw new Error("STOCK_SOURCE_JOURNAL_MISMATCH");
  return true as const;
}
