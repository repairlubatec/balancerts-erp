import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { exportFiscalWorkbook } from "./fiscal-tabular";
import { businessDocuments, companies, documentImportBatches, documentImportRows, documentItems, fileAssets, products } from "../drizzle/schema";
import { getDb } from "./db";

const TEST_USER_ID = 1;
const TEST_COMPANY_ID = 30001;
const TEST_ORGANIZATION_ID = 1;
const caller = appRouter.createCaller({ user: { id: TEST_USER_ID, role: "admin", openId: "practical-import-review", name: "Practical Import Review" }, req: {} as never, res: {} as never });

describe("practical import and review workflow", () => {
  it("executes valid/invalid CSV and XLSX flows, confirmation and tenant isolation", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();
    const suffix = Date.now();
    const code = `PRACT-${suffix}`;
    const productRow = { code, name: "Serviço de teste descartável", kind: "SERVICE", unitCode: "UN" };
    const invalidRows = [{ code: "", name: "", kind: "BAD", unitCode: "UN" }];
    const createdBatchIds: number[] = [];
    let createdProductId: number | undefined;
    let createdDocumentId: number | undefined;
    let createdDocumentItemId: number | undefined;
    let createdPdfFileId: number | undefined;
    try {
      const csv = Buffer.from("code,name,kind,unitCode\n" + `${productRow.code},${productRow.name},${productRow.kind},${productRow.unitCode}`, "utf8").toString("base64");
      const validBatch = await caller.exports.createReviewBatch({ organizationId: TEST_ORGANIZATION_ID, companyId: TEST_COMPANY_ID, kind: "products", filename: "produtos-validos.csv", dataBase64: csv });
      createdBatchIds.push(validBatch.batchId);
      expect(validBatch.status).toBe("READY_TO_CONFIRM");
      const reviewed = await caller.exports.reviewBatch({ companyId: TEST_COMPANY_ID, batchId: validBatch.batchId });
      expect(reviewed.rows).toHaveLength(1);
      const confirmed = await caller.exports.confirmReviewBatch({ companyId: TEST_COMPANY_ID, batchId: validBatch.batchId });
      expect(confirmed.status).toBe("CONFIRMED");
      const committed = await caller.exports.commitImport({ organizationId: TEST_ORGANIZATION_ID, companyId: TEST_COMPANY_ID, kind: "products", rows: [productRow] });
      expect(committed.count).toBe(1);
      createdProductId = Number(committed.created[0]?.id);

      const invalidWorkbook = exportFiscalWorkbook("products", invalidRows).toString("base64");
      const invalidBatch = await caller.exports.createReviewBatch({ organizationId: TEST_ORGANIZATION_ID, companyId: TEST_COMPANY_ID, kind: "products", filename: "produtos-invalidos.xlsx", dataBase64: invalidWorkbook });
      createdBatchIds.push(invalidBatch.batchId);
      expect(invalidBatch.status).toBe("IMPORTED_REVIEW");
      const invalidReview = await caller.exports.reviewBatch({ companyId: TEST_COMPANY_ID, batchId: invalidBatch.batchId });
      expect(invalidReview.rows[0]?.status).toBe("INVALID");
      const corrected = await caller.exports.correctReviewRow({ companyId: TEST_COMPANY_ID, rowId: invalidReview.rows[0]!.id, payload: productRow, errors: [] });
      expect(corrected.valid).toBe(true);
      const correctedReview = await caller.exports.reviewBatch({ companyId: TEST_COMPANY_ID, batchId: invalidBatch.batchId });
      expect(correctedReview.status).toBe("READY_TO_CONFIRM");
      expect((await caller.exports.confirmReviewBatch({ companyId: TEST_COMPANY_ID, batchId: invalidBatch.batchId })).status).toBe("CONFIRMED");

      const documentBatch = await caller.exports.createReviewBatch({ organizationId: TEST_ORGANIZATION_ID, companyId: TEST_COMPANY_ID, kind: "documents", filename: "documentos-validos.csv", dataBase64: Buffer.from("documentNumber,documentType,currency,ivaRegime,netAmount,taxAmount,totalAmount\nFT TEST/1,FT,AOA,EXCLUSAO,100,0,100").toString("base64") });
      createdBatchIds.push(documentBatch.batchId);
      await expect(caller.exports.confirmReviewBatch({ companyId: TEST_COMPANY_ID, batchId: documentBatch.batchId })).rejects.toThrow("FISCAL_DOCUMENT_IMPORT_REQUIRES_REVIEW");

      const pdfDocument = await db!.insert(businessDocuments).values({ companyId: TEST_COMPANY_ID, documentNumber: `FT-PRACT/${suffix}`, series: "FT-PRACT", status: "DRAFT", documentType: "FT", customerName: "Cliente PDF descartável", counterpartyType: "CUSTOMER", currency: "AOA", ivaRegime: "EXCLUSAO", netAmount: "1000.00", taxAmount: "0.00", totalAmount: "1000.00", settledAmount: "0.00", createdBy: TEST_USER_ID });
      createdDocumentId = Number(pdfDocument[0].insertId);
      const pdfItem = await db!.insert(documentItems).values({ companyId: TEST_COMPANY_ID, documentId: createdDocumentId, lineNumber: 1, description: "Serviço PDF de teste", quantity: "1", unitPrice: "1000.00", netAmount: "1000.00", taxAmount: "0.00", totalAmount: "1000.00" });
      createdDocumentItemId = Number(pdfItem[0].insertId);
      const rendered = await caller.documents.renderPreparationPdf({ companyId: TEST_COMPANY_ID, documentId: createdDocumentId });
      expect(rendered.certified).toBe(false);
      expect(rendered.hash).toMatch(/^[a-f0-9]{64}$/);
      expect(rendered.storageKey).toContain(`fiscal-documents/`);
      createdPdfFileId = rendered.fileId;
      const stored = await db!.select({ mimeType: fileAssets.mimeType, sha256: fileAssets.sha256, filename: fileAssets.filename }).from(fileAssets).where(and(eq(fileAssets.id, createdPdfFileId), eq(fileAssets.companyId, TEST_COMPANY_ID))).limit(1);
      expect(stored[0]).toMatchObject({ mimeType: "application/pdf", filename: `FT-PRACT/${suffix}.pdf` });
      expect(stored[0]?.sha256).toMatch(/^[a-f0-9]{64}$/);
      const download = await caller.files.downloadUrl({ companyId: TEST_COMPANY_ID, fileId: createdPdfFileId });
      expect(download.url).toMatch(/^https?:/);
      expect(download.sha256).toBe(stored[0]?.sha256);

      const repair = await db!.select({ id: companies.id }).from(companies).where(eq(companies.nif, "5001121871")).limit(1);
      if (repair[0]) await expect(caller.exports.reviewBatch({ companyId: repair[0].id, batchId: validBatch.batchId })).rejects.toThrow();
    } finally {
      if (createdPdfFileId) await db!.delete(fileAssets).where(and(eq(fileAssets.id, createdPdfFileId), eq(fileAssets.companyId, TEST_COMPANY_ID)));
      if (createdDocumentItemId) await db!.delete(documentItems).where(and(eq(documentItems.id, createdDocumentItemId), eq(documentItems.companyId, TEST_COMPANY_ID)));
      if (createdDocumentId) await db!.delete(businessDocuments).where(and(eq(businessDocuments.id, createdDocumentId), eq(businessDocuments.companyId, TEST_COMPANY_ID)));
      if (createdProductId) await db!.delete(products).where(and(eq(products.id, createdProductId), eq(products.companyId, TEST_COMPANY_ID)));
      for (const batchId of createdBatchIds) {
        await db!.delete(documentImportRows).where(and(eq(documentImportRows.batchId, batchId), eq(documentImportRows.companyId, TEST_COMPANY_ID)));
        await db!.delete(documentImportBatches).where(and(eq(documentImportBatches.id, batchId), eq(documentImportBatches.companyId, TEST_COMPANY_ID)));
      }
    }
  });
});
