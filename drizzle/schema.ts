import { decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "contabilista", "financeiro", "operador", "auditor"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const platforms = mysqlTable("platforms", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  platformId: int("platformId"),
  name: varchar("name", { length: 180 }).notNull(),
  ownerUserId: int("ownerUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const organizationMemberships = mysqlTable("organizationMemberships", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  userId: int("userId").notNull().references(() => users.id),
  role: mysqlEnum("role", ["user", "admin", "contabilista", "financeiro", "operador", "auditor"]).default("user").notNull(),
  permissions: json("permissions").$type<string[]>().default([]).notNull(),
  status: mysqlEnum("status", ["INVITED", "ACTIVE", "SUSPENDED", "REMOVED"]).default("INVITED").notNull(),
  invitedBy: int("invitedBy"),
  joinedAt: timestamp("joinedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  organizationUserUnique: uniqueIndex("organization_memberships_organization_user_unique").on(table.organizationId, table.userId),
}));

export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  nif: varchar("nif", { length: 32 }).notNull(),
  functionalCurrency: varchar("functionalCurrency", { length: 3 }).default("AOA").notNull(),
  ivaRegime: mysqlEnum("ivaRegime", ["GERAL", "SIMPLIFICADO", "EXCLUSAO"]).notNull(),
  legalForm: varchar("legalForm", { length: 80 }),
  address: varchar("address", { length: 255 }),
  municipality: varchar("municipality", { length: 120 }),
  province: varchar("province", { length: 120 }),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 320 }),
  activity: varchar("activity", { length: 180 }),
  incorporationYear: int("incorporationYear"),
  configurationStatus: mysqlEnum("configurationStatus", ["PENDING", "READY", "BLOCKED"]).default("PENDING").notNull(),
  legalRepresentatives: text("legalRepresentatives"),
  primaryLegalRepresentative: varchar("primaryLegalRepresentative", { length: 180 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const fiscalExercises = mysqlTable("fiscalExercises", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  year: int("year").notNull(),
  status: mysqlEnum("status", ["OPEN", "CLOSED"]).default("OPEN").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const fiscalPeriods = mysqlTable("fiscalPeriods", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  exerciseId: int("exerciseId"),
  year: int("year").notNull(),
  month: int("month").notNull(),
  status: mysqlEnum("status", ["OPEN", "CLOSING", "CLOSED", "REOPENED"]).default("OPEN").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
});

export const chartAccounts = mysqlTable("chartAccounts", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  parentCode: varchar("parentCode", { length: 32 }),
  postable: int("postable").default(1).notNull(),
  validFrom: timestamp("validFrom").notNull(),
  validTo: timestamp("validTo"),
});

export const costCenters = mysqlTable("costCenters", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  code: varchar("code", { length: 40 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const journalEntries = mysqlTable("journalEntries", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  periodId: int("periodId").notNull(),
  sourceDocumentId: int("sourceDocumentId"),
  supportFileAssetId: int("supportFileAssetId"),
  documentReference: varchar("documentReference", { length: 120 }),
  journalCode: varchar("journalCode", { length: 32 }).default("GERAL").notNull(),
  costCenter: varchar("costCenter", { length: 80 }),
  analyticalDimension: varchar("analyticalDimension", { length: 120 }),
  reversalOfEntryId: int("reversalOfEntryId"),
  idempotencyKey: varchar("idempotencyKey", { length: 120 }).notNull().unique(),
  status: mysqlEnum("status", ["POSTED", "REVERSED"]).default("POSTED").notNull(),
  description: text("description").notNull(),
  reviewStatus: mysqlEnum("reviewStatus", ["PENDING", "APPROVED", "REJECTED"]).default("APPROVED").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const journalLines = mysqlTable("journalLines", {
  id: int("id").autoincrement().primaryKey(),
  entryId: int("entryId").notNull(),
  accountId: int("accountId").notNull(),
  debit: decimal("debit", { precision: 18, scale: 2 }).default("0").notNull(),
  credit: decimal("credit", { precision: 18, scale: 2 }).default("0").notNull(),
  currency: varchar("currency", { length: 3 }).default("AOA").notNull(),
  exchangeRate: decimal("exchangeRate", { precision: 18, scale: 8 }).default("1").notNull(),
});

export const openingBalances = mysqlTable("openingBalances", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  periodId: int("periodId").notNull(),
  accountId: int("accountId").notNull(),
  debit: decimal("debit", { precision: 18, scale: 2 }).default("0").notNull(),
  credit: decimal("credit", { precision: 18, scale: 2 }).default("0").notNull(),
  currency: varchar("currency", { length: 3 }).default("AOA").notNull(),
  status: mysqlEnum("status", ["DRAFT", "VALIDATED", "POSTED", "REJECTED"]).default("DRAFT").notNull(),
  journalEntryId: int("journalEntryId"),
  reason: varchar("reason", { length: 500 }),
  createdBy: int("createdBy").notNull(),
  validatedBy: int("validatedBy"),
  validatedAt: timestamp("validatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export const accountingAdjustments = mysqlTable("accountingAdjustments", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  periodId: int("periodId").notNull(),
  journalEntryId: int("journalEntryId"),
  linesJson: text("linesJson"),
  adjustmentType: mysqlEnum("adjustmentType", ["REGULARIZACAO", "RECLASSIFICACAO", "ACRESCIMO", "DIFERIMENTO", "CORRECCAO"]).notNull(),
  reason: varchar("reason", { length: 500 }).notNull(),
  status: mysqlEnum("status", ["DRAFT", "PENDING", "APPROVED", "REJECTED", "POSTED"]).default("DRAFT").notNull(),
  createdBy: int("createdBy").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const balancertsIaConfigs = mysqlTable("balancertsIaConfigs", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull().unique(),
  enabled: int("enabled").default(1).notNull(),
  localEnabled: int("localEnabled").default(1).notNull(),
  localBaseUrl: varchar("localBaseUrl", { length: 255 }).default("http://127.0.0.1").notNull(),
  localPort: int("localPort").default(11434).notNull(),
  localModel: varchar("localModel", { length: 120 }).default("qwen2.5:3b").notNull(),
  azureEnabled: int("azureEnabled").default(0).notNull(),
  azureEndpoint: varchar("azureEndpoint", { length: 255 }),
  azureDeployment: varchar("azureDeployment", { length: 120 }),
  azureSecretRef: varchar("azureSecretRef", { length: 160 }),
  openaiEnabled: int("openaiEnabled").default(0).notNull(),
  openaiModel: varchar("openaiModel", { length: 120 }).default("gpt-5-mini").notNull(),
  openaiSecretRef: varchar("openaiSecretRef", { length: 160 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const balancertsIaSuggestions = mysqlTable("balancertsIaSuggestions", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  createdBy: int("createdBy").notNull(),
  reviewedBy: int("reviewedBy"),
  targetType: mysqlEnum("targetType", ["DOCUMENT", "FILE", "IMPORT_ROW"]).notNull(),
  targetId: int("targetId").notNull(),
  task: varchar("task", { length: 80 }).notNull(),
  status: mysqlEnum("status", ["PROPOSED", "APPROVED", "REJECTED", "EXPIRED"]).default("PROPOSED").notNull(),
  provider: varchar("provider", { length: 40 }).notNull(),
  model: varchar("model", { length: 120 }),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 160 }).notNull().unique(),
  inputSummary: text("inputSummary").notNull(),
  beforeState: text("beforeState").notNull(),
  suggestion: text("suggestion").notNull(),
  reviewNote: varchar("reviewNote", { length: 500 }),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const balancertsIaLogs = mysqlTable("balancertsIaLogs", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  userId: int("userId").notNull(),
  operation: varchar("operation", { length: 80 }).notNull(),
  provider: varchar("provider", { length: 40 }).notNull(),
  model: varchar("model", { length: 120 }),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  requestSummary: text("requestSummary"),
  resultSummary: text("resultSummary"),
  responseMs: int("responseMs"),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const integrationOperations = mysqlTable("integrationOperations", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 160 }).notNull().unique(),
  state: mysqlEnum("state", ["PENDING", "SENT", "FAILED", "RETRY", "COMPLETED", "RECONCILIATION_REQUIRED"]).default("PENDING").notNull(),
  attempts: int("attempts").default(0).notNull(),
  lastError: text("lastError"),
  resultPayload: text("resultPayload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const stockMovements = mysqlTable("stockMovements", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  periodId: int("periodId").notNull(),
  warehouseId: int("warehouseId"),
  transferGroupId: varchar("transferGroupId", { length: 128 }),
  productCode: varchar("productCode", { length: 80 }).notNull(),
  type: mysqlEnum("type", ["IN", "OUT"]).notNull(),
  quantity: decimal("quantity", { precision: 18, scale: 4 }).notNull(),
  unitCost: decimal("unitCost", { precision: 18, scale: 4 }).notNull(),
  sourceDocumentId: int("sourceDocumentId"),
  journalEntryId: int("journalEntryId"),
  correlationId: varchar("correlationId", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const warehouses = mysqlTable("warehouses", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  code: varchar("code", { length: 40 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  address: varchar("address", { length: 255 }),
  active: int("active").default(1).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  companyCodeUnique: uniqueIndex("warehouses_company_code_unique").on(table.companyId, table.code),
}));

export const stockCounts = mysqlTable("stockCounts", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  periodId: int("periodId").notNull(),
  warehouseId: int("warehouseId"),
  reference: varchar("reference", { length: 80 }).notNull(),
  countDate: timestamp("countDate").notNull(),
  status: mysqlEnum("status", ["DRAFT", "VALIDATED", "APPLIED", "CANCELLED"]).default("DRAFT").notNull(),
  notes: text("notes"),
  createdBy: int("createdBy").notNull(),
  validatedBy: int("validatedBy"),
  appliedAt: timestamp("appliedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  companyReferenceUnique: uniqueIndex("stock_counts_company_reference_unique").on(table.companyId, table.reference),
}));

export const stockCountItems = mysqlTable("stockCountItems", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  countId: int("countId").notNull(),
  productCode: varchar("productCode", { length: 80 }).notNull(),
  expectedQuantity: decimal("expectedQuantity", { precision: 18, scale: 4 }).notNull(),
  countedQuantity: decimal("countedQuantity", { precision: 18, scale: 4 }).notNull(),
  unitCost: decimal("unitCost", { precision: 18, scale: 4 }).notNull(),
  adjustmentMovementId: int("adjustmentMovementId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  countProductUnique: uniqueIndex("stock_count_items_count_product_unique").on(table.countId, table.productCode),
}));

export const fileAssets = mysqlTable("fileAssets", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  ownerUserId: int("ownerUserId").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  size: int("size").notNull(),
  sha256: varchar("sha256", { length: 64 }).notNull(),
  allowedUserIds: text("allowedUserIds"),
  category: mysqlEnum("category", ["FISCAL", "CONTABILISTICO", "CONTRATO", "RH", "OUTRO"]).default("OUTRO").notNull(),
  description: text("description"),
  reference: varchar("reference", { length: 180 }),
  currentVersion: int("currentVersion").default(1).notNull(),
  archivedAt: timestamp("archivedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const fileAssetVersions = mysqlTable("fileAssetVersions", {
  id: int("id").autoincrement().primaryKey(),
  fileAssetId: int("fileAssetId").notNull(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  versionNumber: int("versionNumber").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  size: int("size").notNull(),
  sha256: varchar("sha256", { length: 64 }).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const documentSeries = mysqlTable("documentSeries", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  documentType: varchar("documentType", { length: 32 }).notNull(),
  nextNumber: int("nextNumber").default(1).notNull(),
  active: int("active").default(1).notNull(),
}, (table) => ({
  companyCodeTypeUnique: uniqueIndex("document_series_company_code_type_unique").on(table.companyId, table.code, table.documentType),
}));

export const businessDocuments = mysqlTable("businessDocuments", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  documentNumber: varchar("documentNumber", { length: 80 }).notNull(),
  series: varchar("series", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["DRAFT", "VALIDATED", "ISSUED", "ACCOUNTED", "CANCELLED"]).default("DRAFT").notNull(),
  documentType: varchar("documentType", { length: 32 }).notNull(),
  customerName: varchar("customerName", { length: 180 }),
  counterpartyId: int("counterpartyId"),
  counterpartyType: mysqlEnum("counterpartyType", ["CUSTOMER", "SUPPLIER"]).default("CUSTOMER").notNull(),
  currency: varchar("currency", { length: 3 }).default("AOA").notNull(),
  ivaRegime: mysqlEnum("ivaRegime", ["GERAL", "SIMPLIFICADO", "EXCLUSAO"]).notNull(),
  netAmount: decimal("netAmount", { precision: 18, scale: 2 }).default("0").notNull(),
  taxAmount: decimal("taxAmount", { precision: 18, scale: 2 }).default("0").notNull(),
  totalAmount: decimal("totalAmount", { precision: 18, scale: 2 }).default("0").notNull(),
  dueDate: timestamp("dueDate"),
  settledAmount: decimal("settledAmount", { precision: 18, scale: 2 }).default("0").notNull(),
  issuedAt: timestamp("issuedAt"),
  createdBy: int("createdBy").notNull(),
  immutableHash: varchar("immutableHash", { length: 64 }),
  correctsDocumentId: int("correctsDocumentId"),
  sourceReceiptId: int("sourceReceiptId"),
  conversionKey: varchar("conversionKey", { length: 160 }).unique(),
  cancellationReason: varchar("cancellationReason", { length: 255 }),
  archivedAt: timestamp("archivedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const counterparties = mysqlTable("counterparties", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  kind: mysqlEnum("kind", ["CUSTOMER", "SUPPLIER"]).notNull(),
  taxId: varchar("taxId", { length: 32 }),
  name: varchar("name", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 40 }),
  address: varchar("address", { length: 255 }),
  municipality: varchar("municipality", { length: 120 }),
  province: varchar("province", { length: 120 }),
  paymentTermsDays: int("paymentTermsDays").default(0).notNull(),
  creditLimit: decimal("creditLimit", { precision: 18, scale: 2 }).default("0").notNull(),
  preferredCurrency: varchar("preferredCurrency", { length: 3 }).default("AOA").notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  code: varchar("code", { length: 80 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  kind: mysqlEnum("kind", ["GOOD", "SERVICE"]).notNull(),
  unitCode: varchar("unitCode", { length: 16 }).default("UN").notNull(),
  taxCode: varchar("taxCode", { length: 40 }),
  salePrice: decimal("salePrice", { precision: 18, scale: 4 }).default("0").notNull(),
  purchasePrice: decimal("purchasePrice", { precision: 18, scale: 4 }).default("0").notNull(),
  stockManaged: int("stockManaged").default(1).notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const purchaseOrders = mysqlTable("purchaseOrders", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  supplierId: int("supplierId").notNull(),
  orderNumber: varchar("orderNumber", { length: 80 }).notNull(),
  status: mysqlEnum("status", ["DRAFT", "SUBMITTED", "APPROVED", "RECEIVED", "CANCELLED"]).default("DRAFT").notNull(),
  currency: varchar("currency", { length: 3 }).default("AOA").notNull(),
  netAmount: decimal("netAmount", { precision: 18, scale: 2 }).default("0").notNull(),
  taxAmount: decimal("taxAmount", { precision: 18, scale: 2 }).default("0").notNull(),
  totalAmount: decimal("totalAmount", { precision: 18, scale: 2 }).default("0").notNull(),
  requestedDate: timestamp("requestedDate").notNull(),
  expectedDate: timestamp("expectedDate"),
  notes: text("notes"),
  createdBy: int("createdBy").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const purchaseOrderItems = mysqlTable("purchaseOrderItems", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  orderId: int("orderId").notNull(),
  lineNumber: int("lineNumber").notNull(),
  productId: int("productId"),
  description: varchar("description", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 18, scale: 4 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 18, scale: 4 }).notNull(),
  taxRate: decimal("taxRate", { precision: 8, scale: 4 }).default("0").notNull(),
  netAmount: decimal("netAmount", { precision: 18, scale: 2 }).notNull(),
  taxAmount: decimal("taxAmount", { precision: 18, scale: 2 }).default("0").notNull(),
  totalAmount: decimal("totalAmount", { precision: 18, scale: 2 }).notNull(),
  receivedQuantity: decimal("receivedQuantity", { precision: 18, scale: 4 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const purchaseReceipts = mysqlTable("purchaseReceipts", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  orderId: int("orderId").notNull(),
  receiptNumber: varchar("receiptNumber", { length: 80 }).notNull(),
  periodId: int("periodId").notNull(),
  receivedAt: timestamp("receivedAt").notNull(),
  notes: text("notes"),
  idempotencyKey: varchar("idempotencyKey", { length: 160 }).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const purchaseReceiptItems = mysqlTable("purchaseReceiptItems", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  receiptId: int("receiptId").notNull(),
  orderItemId: int("orderItemId").notNull(),
  productId: int("productId"),
  productCode: varchar("productCode", { length: 80 }).notNull(),
  quantity: decimal("quantity", { precision: 18, scale: 4 }).notNull(),
  unitCost: decimal("unitCost", { precision: 18, scale: 4 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const fixedAssets = mysqlTable("fixedAssets", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  code: varchar("code", { length: 80 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  acquisitionDate: timestamp("acquisitionDate").notNull(),
  acquisitionCost: decimal("acquisitionCost", { precision: 18, scale: 2 }).notNull(),
  residualValue: decimal("residualValue", { precision: 18, scale: 2 }).default("0").notNull(),
  usefulLifeMonths: int("usefulLifeMonths").notNull(),
  status: mysqlEnum("status", ["ACTIVE", "DISPOSED"]).default("ACTIVE").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const documentItems = mysqlTable("documentItems", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  documentId: int("documentId").notNull(),
  lineNumber: int("lineNumber").notNull(),
  productId: int("productId"),
  description: varchar("description", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 18, scale: 4 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 18, scale: 4 }).notNull(),
  netAmount: decimal("netAmount", { precision: 18, scale: 2 }).notNull(),
  taxAmount: decimal("taxAmount", { precision: 18, scale: 2 }).default("0").notNull(),
  totalAmount: decimal("totalAmount", { precision: 18, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const documentTaxes = mysqlTable("documentTaxes", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  documentId: int("documentId").notNull(),
  itemId: int("itemId"),
  taxType: varchar("taxType", { length: 40 }).notNull(),
  regime: mysqlEnum("regime", ["GERAL", "SIMPLIFICADO", "EXCLUSAO"]).notNull(),
  rate: decimal("rate", { precision: 8, scale: 4 }).default("0").notNull(),
  baseAmount: decimal("baseAmount", { precision: 18, scale: 2 }).notNull(),
  taxAmount: decimal("taxAmount", { precision: 18, scale: 2 }).default("0").notNull(),
  normativeRuleId: int("normativeRuleId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  periodId: int("periodId"),
  documentId: int("documentId"),
  cashAccountId: int("cashAccountId"),
  direction: mysqlEnum("direction", ["RECEIPT", "PAYMENT"]).notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("AOA").notNull(),
  paidAt: timestamp("paidAt").notNull(),
  method: mysqlEnum("method", ["CASH", "BANK_TRANSFER", "CARD", "OTHER"]).notNull(),
  status: mysqlEnum("status", ["PENDING", "CONFIRMED", "CANCELLED"]).default("PENDING").notNull(),
  approvalStatus: mysqlEnum("approvalStatus", ["PENDING", "APPROVED", "REJECTED"]).default("APPROVED").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  executionReference: varchar("executionReference", { length: 160 }),
  journalEntryId: int("journalEntryId"),
  idempotencyKey: varchar("idempotencyKey", { length: 160 }).notNull().unique(),
  correlationId: varchar("correlationId", { length: 128 }).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const cashAccounts = mysqlTable("cashAccounts", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  kind: mysqlEnum("kind", ["CASH", "BANK"]).notNull(),
  bankName: varchar("bankName", { length: 160 }),
  bankCode: varchar("bankCode", { length: 32 }),
  branchName: varchar("branchName", { length: 160 }),
  accountNumber: varchar("accountNumber", { length: 80 }),
  iban: varchar("iban", { length: 64 }),
  accountingAccountId: int("accountingAccountId"),
  currency: varchar("currency", { length: 3 }).default("AOA").notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const treasuryTransactions = mysqlTable("treasuryTransactions", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  periodId: int("periodId"),
  cashAccountId: int("cashAccountId").notNull(),
  paymentId: int("paymentId"),
  direction: mysqlEnum("direction", ["IN", "OUT"]).notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  valueDate: timestamp("valueDate").notNull(),
  reconciliationStatus: mysqlEnum("reconciliationStatus", ["UNRECONCILED", "RECONCILED", "EXCEPTION"]).default("UNRECONCILED").notNull(),
  journalEntryId: int("journalEntryId"),
  correlationId: varchar("correlationId", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const cashReconciliations = mysqlTable("cashReconciliations", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  cashAccountId: int("cashAccountId").notNull(),
  statementDate: timestamp("statementDate").notNull(),
  openingBalance: decimal("openingBalance", { precision: 18, scale: 2 }).notNull(),
  closingBalance: decimal("closingBalance", { precision: 18, scale: 2 }).notNull(),
  systemBalance: decimal("systemBalance", { precision: 18, scale: 2 }).notNull(),
  difference: decimal("difference", { precision: 18, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["OPEN", "RECONCILED"]).default("OPEN").notNull(),
  statementImportId: int("statementImportId"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const fiscalTaxRecords = mysqlTable("fiscalTaxRecords", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  periodId: int("periodId").notNull(),
  businessDocumentId: int("businessDocumentId"),
  journalEntryId: int("journalEntryId"),
  taxType: mysqlEnum("taxType", ["IVA", "IAC", "INDUSTRIAL", "IRT", "IEC", "RETENCAO", "OUTRO"]).notNull(),
  direction: mysqlEnum("direction", ["OUTPUT", "INPUT", "WITHHELD"]).notNull(),
  regime: varchar("regime", { length: 40 }),
  taxCode: varchar("taxCode", { length: 64 }),
  baseAmount: decimal("baseAmount", { precision: 18, scale: 2 }).notNull(),
  taxAmount: decimal("taxAmount", { precision: 18, scale: 2 }).notNull(),
  withheldAmount: decimal("withheldAmount", { precision: 18, scale: 2 }).default("0").notNull(),
  currency: varchar("currency", { length: 3 }).default("AOA").notNull(),
  dueDate: timestamp("dueDate"),
  status: mysqlEnum("status", ["DRAFT", "CALCULATED", "REVIEWED", "SUBMITTED", "PAID", "CANCELLED"]).default("DRAFT").notNull(),
  sourceReference: varchar("sourceReference", { length: 160 }),
  idempotencyKey: varchar("idempotencyKey", { length: 160 }).notNull().unique(),
  createdBy: int("createdBy").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const bankStatementImports = mysqlTable("bankStatementImports", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  cashAccountId: int("cashAccountId").notNull(),
  statementDate: timestamp("statementDate").notNull(),
  openingBalance: decimal("openingBalance", { precision: 18, scale: 2 }).notNull(),
  closingBalance: decimal("closingBalance", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("AOA").notNull(),
  originalFilename: varchar("originalFilename", { length: 255 }).notNull(),
  sha256: varchar("sha256", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["IMPORTED", "REVIEWING", "RECONCILED", "REJECTED"]).default("IMPORTED").notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 160 }).notNull().unique(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const bankStatementLines = mysqlTable("bankStatementLines", {
  id: int("id").autoincrement().primaryKey(),
  importId: int("importId").notNull(),
  companyId: int("companyId").notNull(),
  bookingDate: timestamp("bookingDate").notNull(),
  valueDate: timestamp("valueDate").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  externalReference: varchar("externalReference", { length: 160 }),
  counterparty: varchar("counterparty", { length: 180 }),
  direction: mysqlEnum("direction", ["IN", "OUT"]).notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  balance: decimal("balance", { precision: 18, scale: 2 }),
  matchedTreasuryTransactionId: int("matchedTreasuryTransactionId"),
  status: mysqlEnum("status", ["UNMATCHED", "SUGGESTED", "MATCHED", "EXCEPTION"]).default("UNMATCHED").notNull(),
  fingerprint: varchar("fingerprint", { length: 160 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const agtIntegrationConfigs = mysqlTable("agt_integration_configs", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull(),
  companyId: int("company_id").notNull(),
  version: varchar("version", { length: 32 }).notNull(),
  productId: varchar("product_id", { length: 160 }),
  productVersion: varchar("product_version", { length: 80 }),
  softwareValidationNumber: varchar("software_validation_number", { length: 160 }),
  serviceNamespace: varchar("service_namespace", { length: 255 }),
  xsdVersion: varchar("xsd_version", { length: 64 }),
  xsdReference: varchar("xsd_reference", { length: 512 }),
  endpointReference: varchar("endpoint_reference", { length: 512 }),
  authReference: varchar("auth_reference", { length: 255 }),
  officialCodes: json("official_codes").$type<Record<string, string>>(),
  homologationStatus: mysqlEnum("homologation_status", ["NOT_AVAILABLE", "INTERNAL_READY", "TECHNICAL_PENDING", "AGT_APPROVED"]).notNull().default("NOT_AVAILABLE"),
  active: int("active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const agtEstablishments = mysqlTable("agtEstablishments", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  establishmentNumber: varchar("establishmentNumber", { length: 200 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  address: varchar("address", { length: 255 }),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const agtSeries = mysqlTable("agtSeries", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  establishmentId: int("establishmentId").notNull(),
  seriesCode: varchar("seriesCode", { length: 60 }).notNull(),
  seriesYear: int("seriesYear").notNull(),
  documentType: varchar("documentType", { length: 2 }).notNull(),
  seriesStatus: mysqlEnum("seriesStatus", ["A", "U", "F"]).default("A").notNull(),
  contingencyIndicator: mysqlEnum("contingencyIndicator", ["N", "C"]).default("N").notNull(),
  invoicingMethod: varchar("invoicingMethod", { length: 4 }).default("FESF").notNull(),
  firstDocumentApproved: varchar("firstDocumentApproved", { length: 60 }),
  lastDocumentApproved: varchar("lastDocumentApproved", { length: 60 }),
  firstDocumentCreated: varchar("firstDocumentCreated", { length: 60 }),
  lastDocumentCreated: varchar("lastDocumentCreated", { length: 60 }),
  seriesCreationDate: timestamp("seriesCreationDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const agtSubmissions = mysqlTable("agtSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  operation: varchar("operation", { length: 40 }).notNull(),
  submissionUUID: varchar("submissionUUID", { length: 64 }).notNull().unique(),
  requestID: varchar("requestID", { length: 15 }),
  integrationOperationId: int("integrationOperationId"),
  state: mysqlEnum("state", ["PENDING", "PROCESSING", "COMPLETED", "PARTIAL", "FAILED", "CANCELLED"]).default("PENDING").notNull(),
  resultCode: varchar("resultCode", { length: 8 }),
  payload: text("payload").notNull(),
  responsePayload: text("responsePayload"),
  nextPollAt: timestamp("nextPollAt"),
  lastPolledAt: timestamp("lastPolledAt"),
  attempts: int("attempts").default(0).notNull(),
  lastError: text("lastError"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const agtSubmissionDocuments = mysqlTable("agtSubmissionDocuments", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submissionId").notNull(),
  companyId: int("companyId").notNull(),
  documentId: int("documentId"),
  documentNo: varchar("documentNo", { length: 60 }).notNull(),
  documentStatus: mysqlEnum("documentStatus", ["PENDING", "VALID", "INVALID", "REJECTED", "CANCELLED"]).default("PENDING").notNull(),
  errorCode: varchar("errorCode", { length: 8 }),
  errorDescription: varchar("errorDescription", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const agtSignatureKeys = mysqlTable("agtSignatureKeys", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  keyType: mysqlEnum("keyType", ["SOFTWARE", "ISSUER"]).notNull(),
  signatureVersion: int("signatureVersion").notNull(),
  publicKeyReference: varchar("publicKeyReference", { length: 512 }).notNull(),
  privateKeyReference: varchar("privateKeyReference", { length: 512 }),
  status: mysqlEnum("status", ["PENDING", "ACTIVE", "ROTATING", "REVOKED"]).default("PENDING").notNull(),
  effectiveFrom: timestamp("effectiveFrom"),
  revokedAt: timestamp("revokedAt"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const documentImportBatches = mysqlTable("documentImportBatches", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  kind: mysqlEnum("kind", ["counterparties", "products", "documents"]).notNull(),
  status: mysqlEnum("status", ["IMPORTED_REVIEW", "READY_TO_CONFIRM", "CONFIRMED", "REJECTED"]).default("IMPORTED_REVIEW").notNull(),
  originalFilename: varchar("originalFilename", { length: 255 }).notNull(),
  validationSummary: text("validationSummary").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const documentImportRows = mysqlTable("documentImportRows", {
  id: int("id").autoincrement().primaryKey(),
  batchId: int("batchId").notNull(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId").notNull(),
  lineNumber: int("lineNumber").notNull(),
  payload: text("payload").notNull(),
  status: mysqlEnum("status", ["VALID", "INVALID", "CORRECTED", "CONFIRMED"]).default("VALID").notNull(),
  errors: text("errors").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const normativeRules = mysqlTable("normativeRules", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId"),
  code: varchar("code", { length: 80 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  instrument: varchar("instrument", { length: 160 }).notNull(),
  version: varchar("version", { length: 40 }).notNull(),
  effectiveFrom: timestamp("effectiveFrom").notNull(),
  effectiveTo: timestamp("effectiveTo"),
  module: varchar("module", { length: 80 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 512 }),
  verificationStatus: mysqlEnum("verificationStatus", ["INTERNAL_REVIEW", "EXTERNAL_PENDING", "EXTERNALLY_VERIFIED"]).default("INTERNAL_REVIEW").notNull(),
  parameters: text("parameters").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditEvents = mysqlTable("auditEvents", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companyId: int("companyId"),
  actorUserId: int("actorUserId").notNull(),
  action: varchar("action", { length: 80 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: varchar("entityId", { length: 80 }).notNull(),
  beforeState: text("beforeState"),
  afterState: text("afterState"),
  correlationId: varchar("correlationId", { length: 128 }).notNull(),
  eventHash: varchar("eventHash", { length: 64 }),
  previousHash: varchar("previousHash", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type FiscalPeriod = typeof fiscalPeriods.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type BusinessDocument = typeof businessDocuments.$inferSelect;
