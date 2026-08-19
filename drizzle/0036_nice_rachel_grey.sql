CREATE TABLE `accountingAdjustments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`periodId` int NOT NULL,
	`journalEntryId` int,
	`adjustmentType` enum('REGULARIZACAO','RECLASSIFICACAO','ACRESCIMO','DIFERIMENTO','CORRECCAO') NOT NULL,
	`reason` varchar(500) NOT NULL,
	`status` enum('DRAFT','PENDING','APPROVED','REJECTED','POSTED') NOT NULL DEFAULT 'DRAFT',
	`createdBy` int NOT NULL,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accountingAdjustments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `openingBalances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`periodId` int NOT NULL,
	`accountId` int NOT NULL,
	`debit` decimal(18,2) NOT NULL DEFAULT '0',
	`credit` decimal(18,2) NOT NULL DEFAULT '0',
	`currency` varchar(3) NOT NULL DEFAULT 'AOA',
	`status` enum('DRAFT','VALIDATED','POSTED','REJECTED') NOT NULL DEFAULT 'DRAFT',
	`journalEntryId` int,
	`reason` varchar(500),
	`createdBy` int NOT NULL,
	`validatedBy` int,
	`validatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `openingBalances_id` PRIMARY KEY(`id`)
);
