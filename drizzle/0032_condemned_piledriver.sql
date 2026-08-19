CREATE TABLE `bankStatementImports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`cashAccountId` int NOT NULL,
	`statementDate` timestamp NOT NULL,
	`openingBalance` decimal(18,2) NOT NULL,
	`closingBalance` decimal(18,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'AOA',
	`originalFilename` varchar(255) NOT NULL,
	`sha256` varchar(64) NOT NULL,
	`status` enum('IMPORTED','REVIEWING','RECONCILED','REJECTED') NOT NULL DEFAULT 'IMPORTED',
	`idempotencyKey` varchar(160) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bankStatementImports_id` PRIMARY KEY(`id`),
	CONSTRAINT `bankStatementImports_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `bankStatementLines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`importId` int NOT NULL,
	`companyId` int NOT NULL,
	`bookingDate` timestamp NOT NULL,
	`valueDate` timestamp NOT NULL,
	`description` varchar(500) NOT NULL,
	`externalReference` varchar(160),
	`counterparty` varchar(180),
	`direction` enum('IN','OUT') NOT NULL,
	`amount` decimal(18,2) NOT NULL,
	`balance` decimal(18,2),
	`matchedTreasuryTransactionId` int,
	`status` enum('UNMATCHED','SUGGESTED','MATCHED','EXCEPTION') NOT NULL DEFAULT 'UNMATCHED',
	`fingerprint` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bankStatementLines_id` PRIMARY KEY(`id`),
	CONSTRAINT `bankStatementLines_fingerprint_unique` UNIQUE(`fingerprint`)
);
--> statement-breakpoint
CREATE TABLE `fiscalTaxRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`periodId` int NOT NULL,
	`businessDocumentId` int,
	`journalEntryId` int,
	`taxType` enum('IVA','IAC','INDUSTRIAL','IRT','IEC','RETENCAO','OUTRO') NOT NULL,
	`direction` enum('OUTPUT','INPUT','WITHHELD') NOT NULL,
	`regime` varchar(40),
	`taxCode` varchar(64),
	`baseAmount` decimal(18,2) NOT NULL,
	`taxAmount` decimal(18,2) NOT NULL,
	`withheldAmount` decimal(18,2) NOT NULL DEFAULT '0',
	`currency` varchar(3) NOT NULL DEFAULT 'AOA',
	`dueDate` timestamp,
	`status` enum('DRAFT','CALCULATED','REVIEWED','SUBMITTED','PAID','CANCELLED') NOT NULL DEFAULT 'DRAFT',
	`sourceReference` varchar(160),
	`idempotencyKey` varchar(160) NOT NULL,
	`createdBy` int NOT NULL,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fiscalTaxRecords_id` PRIMARY KEY(`id`),
	CONSTRAINT `fiscalTaxRecords_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
ALTER TABLE `cashAccounts` ADD `bankName` varchar(160);--> statement-breakpoint
ALTER TABLE `cashAccounts` ADD `bankCode` varchar(32);--> statement-breakpoint
ALTER TABLE `cashAccounts` ADD `branchName` varchar(160);--> statement-breakpoint
ALTER TABLE `cashAccounts` ADD `iban` varchar(64);--> statement-breakpoint
ALTER TABLE `cashAccounts` ADD `accountingAccountId` int;--> statement-breakpoint
ALTER TABLE `cashReconciliations` ADD `statementImportId` int;