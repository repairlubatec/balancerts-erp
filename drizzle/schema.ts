import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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

export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  ownerUserId: int("ownerUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  nif: varchar("nif", { length: 32 }).notNull(),
  functionalCurrency: varchar("functionalCurrency", { length: 3 }).default("AOA").notNull(),
  ivaRegime: mysqlEnum("ivaRegime", ["GERAL", "SIMPLIFICADO", "EXCLUSAO"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const fiscalPeriods = mysqlTable("fiscalPeriods", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
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

export const journalEntries = mysqlTable("journalEntries", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  periodId: int("periodId").notNull(),
  sourceDocumentId: int("sourceDocumentId"),
  idempotencyKey: varchar("idempotencyKey", { length: 120 }).notNull().unique(),
  status: mysqlEnum("status", ["POSTED", "REVERSED"]).default("POSTED").notNull(),
  description: text("description").notNull(),
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

export const businessDocuments = mysqlTable("businessDocuments", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  documentNumber: varchar("documentNumber", { length: 80 }).notNull(),
  series: varchar("series", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["DRAFT", "VALIDATED", "ISSUED", "ACCOUNTED", "CANCELLED"]).default("DRAFT").notNull(),
  documentType: varchar("documentType", { length: 32 }).notNull(),
  customerName: varchar("customerName", { length: 180 }),
  ivaRegime: mysqlEnum("ivaRegime", ["GERAL", "SIMPLIFICADO", "EXCLUSAO"]).notNull(),
  netAmount: decimal("netAmount", { precision: 18, scale: 2 }).default("0").notNull(),
  taxAmount: decimal("taxAmount", { precision: 18, scale: 2 }).default("0").notNull(),
  totalAmount: decimal("totalAmount", { precision: 18, scale: 2 }).default("0").notNull(),
  issuedAt: timestamp("issuedAt"),
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
  correlationId: varchar("correlationId", { length: 120 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type FiscalPeriod = typeof fiscalPeriods.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type BusinessDocument = typeof businessDocuments.$inferSelect;
