CREATE TABLE `auditEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int,
	`actorUserId` int NOT NULL,
	`action` varchar(80) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` varchar(80) NOT NULL,
	`beforeState` text,
	`afterState` text,
	`correlationId` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `businessDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`documentNumber` varchar(80) NOT NULL,
	`series` varchar(32) NOT NULL,
	`status` enum('DRAFT','VALIDATED','ISSUED','ACCOUNTED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
	`documentType` varchar(32) NOT NULL,
	`customerName` varchar(180),
	`ivaRegime` enum('GERAL','SIMPLIFICADO','EXCLUSAO') NOT NULL,
	`netAmount` decimal(18,2) NOT NULL DEFAULT '0',
	`taxAmount` decimal(18,2) NOT NULL DEFAULT '0',
	`totalAmount` decimal(18,2) NOT NULL DEFAULT '0',
	`issuedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `businessDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chartAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(180) NOT NULL,
	`parentCode` varchar(32),
	`postable` int NOT NULL DEFAULT 1,
	`validFrom` timestamp NOT NULL,
	`validTo` timestamp,
	CONSTRAINT `chartAccounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`nif` varchar(32) NOT NULL,
	`functionalCurrency` varchar(3) NOT NULL DEFAULT 'AOA',
	`ivaRegime` enum('GERAL','SIMPLIFICADO','EXCLUSAO') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fiscalPeriods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`status` enum('OPEN','CLOSING','CLOSED','REOPENED') NOT NULL DEFAULT 'OPEN',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	CONSTRAINT `fiscalPeriods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `journalEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`periodId` int NOT NULL,
	`sourceDocumentId` int,
	`idempotencyKey` varchar(120) NOT NULL,
	`status` enum('POSTED','REVERSED') NOT NULL DEFAULT 'POSTED',
	`description` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `journalEntries_id` PRIMARY KEY(`id`),
	CONSTRAINT `journalEntries_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `journalLines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entryId` int NOT NULL,
	`accountId` int NOT NULL,
	`debit` decimal(18,2) NOT NULL DEFAULT '0',
	`credit` decimal(18,2) NOT NULL DEFAULT '0',
	`currency` varchar(3) NOT NULL DEFAULT 'AOA',
	`exchangeRate` decimal(18,8) NOT NULL DEFAULT '1',
	CONSTRAINT `journalLines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`ownerUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`)
);
