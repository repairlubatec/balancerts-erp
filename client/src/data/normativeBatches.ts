export type NormativeBatch = {
  batchId: string;
  domain: "PGCA" | "IVA";
  scope: string;
  count: number;
  confirmed: number;
};

/** Metadados espelhados de docs/normative-human-confirmation-batches.json. */
export const normativeBatches: NormativeBatch[] = [
  { batchId: "IVA-19", domain: "IVA", scope: "19.º", count: 2, confirmed: 1 },
  { batchId: "IVA-21", domain: "IVA", scope: "21.º", count: 1, confirmed: 0 },
  { batchId: "IVA-xI", domain: "IVA", scope: "Anexo I", count: 1, confirmed: 0 },
  { batchId: "IVA-xII", domain: "IVA", scope: "Anexo II", count: 1, confirmed: 0 },
  { batchId: "IVA-xIII", domain: "IVA", scope: "Anexo III", count: 1, confirmed: 0 },
  { batchId: "IVA-xIV", domain: "IVA", scope: "Anexo IV", count: 1, confirmed: 0 },
  { batchId: "IVA-xV", domain: "IVA", scope: "Anexo V", count: 1, confirmed: 0 },
  { batchId: "IVA-xVI", domain: "IVA", scope: "Anexo VI", count: 1, confirmed: 0 },
  { batchId: "PGCA-CLASSE-1", domain: "PGCA", scope: "Classe 1", count: 184, confirmed: 0 },
  { batchId: "PGCA-CLASSE-2", domain: "PGCA", scope: "Classe 2", count: 51, confirmed: 0 },
  { batchId: "PGCA-CLASSE-3", domain: "PGCA", scope: "Classe 3", count: 154, confirmed: 0 },
  { batchId: "PGCA-CLASSE-4", domain: "PGCA", scope: "Classe 4", count: 66, confirmed: 7 },
  { batchId: "PGCA-CLASSE-5", domain: "PGCA", scope: "Classe 5", count: 10, confirmed: 0 },
  { batchId: "PGCA-CLASSE-6", domain: "PGCA", scope: "Classe 6", count: 111, confirmed: 13 },
  { batchId: "PGCA-CLASSE-7", domain: "PGCA", scope: "Classe 7", count: 100, confirmed: 0 },
  { batchId: "PGCA-CLASSE-8", domain: "PGCA", scope: "Classe 8", count: 52, confirmed: 0 },
  { batchId: "PGCA-CLASSE-9", domain: "PGCA", scope: "Classe 9", count: 26, confirmed: 0 },
];
