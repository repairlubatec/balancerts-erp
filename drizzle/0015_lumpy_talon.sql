CREATE TABLE `cashAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`kind` enum('CASH','BANK') NOT NULL,
	`accountNumber` varchar(80),
	`currency` varchar(3) NOT NULL DEFAULT 'AOA',
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cashAccounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `counterparties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`kind` enum('CUSTOMER','SUPPLIER') NOT NULL,
	`taxId` varchar(32),
	`name` varchar(180) NOT NULL,
	`email` varchar(320),
	`phone` varchar(40),
	`address` varchar(255),
	`municipality` varchar(120),
	`province` varchar(120),
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `counterparties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`documentId` int NOT NULL,
	`lineNumber` int NOT NULL,
	`productId` int,
	`description` varchar(255) NOT NULL,
	`quantity` decimal(18,4) NOT NULL,
	`unitPrice` decimal(18,4) NOT NULL,
	`netAmount` decimal(18,2) NOT NULL,
	`taxAmount` decimal(18,2) NOT NULL DEFAULT '0',
	`totalAmount` decimal(18,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentTaxes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`documentId` int NOT NULL,
	`itemId` int,
	`taxType` varchar(40) NOT NULL,
	`regime` enum('GERAL','SIMPLIFICADO','EXCLUSAO') NOT NULL,
	`rate` decimal(8,4) NOT NULL DEFAULT '0',
	`baseAmount` decimal(18,2) NOT NULL,
	`taxAmount` decimal(18,2) NOT NULL DEFAULT '0',
	`normativeRuleId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentTaxes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `normativeRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int,
	`code` varchar(80) NOT NULL,
	`title` varchar(255) NOT NULL,
	`instrument` varchar(160) NOT NULL,
	`version` varchar(40) NOT NULL,
	`effectiveFrom` timestamp NOT NULL,
	`effectiveTo` timestamp,
	`module` varchar(80) NOT NULL,
	`sourceUrl` varchar(512),
	`verificationStatus` enum('INTERNAL_REVIEW','EXTERNAL_PENDING','EXTERNALLY_VERIFIED') NOT NULL DEFAULT 'INTERNAL_REVIEW',
	`parameters` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `normativeRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`documentId` int,
	`direction` enum('RECEIPT','PAYMENT') NOT NULL,
	`amount` decimal(18,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'AOA',
	`paidAt` timestamp NOT NULL,
	`method` enum('CASH','BANK_TRANSFER','CARD','OTHER') NOT NULL,
	`status` enum('PENDING','CONFIRMED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`journalEntryId` int,
	`idempotencyKey` varchar(160) NOT NULL,
	`correlationId` varchar(128) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`code` varchar(80) NOT NULL,
	`name` varchar(180) NOT NULL,
	`kind` enum('GOOD','SERVICE') NOT NULL,
	`unitCode` varchar(16) NOT NULL DEFAULT 'UN',
	`taxCode` varchar(40),
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treasuryTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`cashAccountId` int NOT NULL,
	`paymentId` int,
	`direction` enum('IN','OUT') NOT NULL,
	`amount` decimal(18,2) NOT NULL,
	`valueDate` timestamp NOT NULL,
	`reconciliationStatus` enum('UNRECONCILED','RECONCILED','EXCEPTION') NOT NULL DEFAULT 'UNRECONCILED',
	`journalEntryId` int,
	`correlationId` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasuryTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `businessDocuments` ADD `counterpartyId` int;--> statement-breakpoint
ALTER TABLE `businessDocuments` ADD `currency` varchar(3) DEFAULT 'AOA' NOT NULL;--> statement-breakpoint
ALTER TABLE `businessDocuments` ADD `immutableHash` varchar(64);