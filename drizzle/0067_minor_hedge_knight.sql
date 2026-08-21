CREATE TABLE `accountingRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int,
	`versionId` int NOT NULL,
	`operation` varchar(80) NOT NULL,
	`documentType` varchar(60),
	`debitAccountId` int,
	`creditAccountId` int,
	`ivaAccountId` int,
	`nature` varchar(40),
	`costCenterCode` varchar(80),
	`priority` int NOT NULL DEFAULT 100,
	`effectiveFrom` timestamp NOT NULL,
	`effectiveTo` timestamp,
	`sourceId` int,
	`active` int NOT NULL DEFAULT 1,
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accountingRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pgcAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`versionId` int NOT NULL,
	`sourceId` int,
	`code` varchar(32) NOT NULL,
	`name` varchar(180) NOT NULL,
	`description` text,
	`classCode` varchar(4) NOT NULL,
	`parentId` int,
	`parentCode` varchar(32),
	`level` int NOT NULL,
	`accountType` enum('CLASS','GROUP','MOVEMENT','ANALYTICAL') NOT NULL,
	`nature` enum('DEBIT','CREDIT','MIXED','NOT_APPLICABLE') NOT NULL,
	`balanceType` enum('DEBIT','CREDIT','VARIABLE','NOT_APPLICABLE') NOT NULL,
	`acceptsEntries` int NOT NULL DEFAULT 0,
	`acceptsChildren` int NOT NULL DEFAULT 1,
	`active` int NOT NULL DEFAULT 1,
	`fiscal` int NOT NULL DEFAULT 0,
	`iva` int NOT NULL DEFAULT 0,
	`balanceSheet` int NOT NULL DEFAULT 0,
	`incomeStatement` int NOT NULL DEFAULT 0,
	`validFrom` timestamp NOT NULL,
	`validTo` timestamp,
	`validationStatus` enum('CONFIRMED','NEEDS_NORMATIVE_VALIDATION','INVALID','DUPLICATE','MISSING_PARENT') NOT NULL DEFAULT 'NEEDS_NORMATIVE_VALIDATION',
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pgcAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `pgc_accounts_version_code_unique` UNIQUE(`versionId`,`code`)
);
--> statement-breakpoint
CREATE TABLE `pgcAuditFindings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`auditRunId` int NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`legacyAccountId` int,
	`legacyCode` varchar(32),
	`pgcAccountId` int,
	`classification` enum('CORRECT','INCORRECT','WRONG_LOCATION','WRONG_NAME','WRONG_CODE','MISSING','DUPLICATE','UNVALIDATED','NO_PARENT','GROUP_WITH_MOVEMENTS') NOT NULL,
	`details` text NOT NULL,
	`requiresReview` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pgcAuditFindings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pgcAuditRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`versionId` int,
	`status` enum('RUNNING','COMPLETED','FAILED') NOT NULL DEFAULT 'RUNNING',
	`totalChecked` int NOT NULL DEFAULT 0,
	`validCount` int NOT NULL DEFAULT 0,
	`correctedCount` int NOT NULL DEFAULT 0,
	`missingCount` int NOT NULL DEFAULT 0,
	`duplicateCount` int NOT NULL DEFAULT 0,
	`unclassifiedCount` int NOT NULL DEFAULT 0,
	`needsValidationCount` int NOT NULL DEFAULT 0,
	`startedBy` int NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`error` text,
	CONSTRAINT `pgcAuditRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pgcMigrationMaps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`versionId` int NOT NULL,
	`legacyAccountId` int NOT NULL,
	`legacyCode` varchar(32) NOT NULL,
	`newAccountId` int,
	`newCode` varchar(32),
	`action` enum('KEEP','REPLACE','MERGE','SPLIT','DEACTIVATE','MAP','NEEDS_REVIEW') NOT NULL DEFAULT 'NEEDS_REVIEW',
	`reason` text NOT NULL,
	`sourceId` int,
	`historicalMovements` int NOT NULL DEFAULT 0,
	`status` enum('DRAFT','REVIEWED','APPROVED','APPLIED','REJECTED') NOT NULL DEFAULT 'DRAFT',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pgcMigrationMaps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pgcSources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`versionId` int NOT NULL,
	`instrument` varchar(180) NOT NULL,
	`instrumentNumber` varchar(80),
	`article` varchar(80),
	`title` varchar(255) NOT NULL,
	`sourceUrl` varchar(512),
	`issuedAt` timestamp,
	`effectiveFrom` timestamp,
	`verificationStatus` enum('PENDING','CONFIRMED','CONFLICT','REJECTED') NOT NULL DEFAULT 'PENDING',
	`conflictNote` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pgcSources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pgcVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`status` enum('DRAFT','UNDER_REVIEW','VALIDATED','ACTIVE','SUPERSEDED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`sourceType` enum('PGC_BASE','LEGISLATIVE_CHANGE','FISCAL_RULE','SECTOR_PLAN') NOT NULL,
	`effectiveFrom` timestamp NOT NULL,
	`effectiveTo` timestamp,
	`activatedAt` timestamp,
	`activatedBy` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pgcVersions_id` PRIMARY KEY(`id`),
	CONSTRAINT `pgc_versions_org_code_unique` UNIQUE(`organizationId`,`code`)
);
--> statement-breakpoint
ALTER TABLE `accountingRules` ADD CONSTRAINT `accountingRules_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accountingRules` ADD CONSTRAINT `accountingRules_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accountingRules` ADD CONSTRAINT `accountingRules_versionId_pgcVersions_id_fk` FOREIGN KEY (`versionId`) REFERENCES `pgcVersions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accountingRules` ADD CONSTRAINT `accountingRules_debitAccountId_pgcAccounts_id_fk` FOREIGN KEY (`debitAccountId`) REFERENCES `pgcAccounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accountingRules` ADD CONSTRAINT `accountingRules_creditAccountId_pgcAccounts_id_fk` FOREIGN KEY (`creditAccountId`) REFERENCES `pgcAccounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accountingRules` ADD CONSTRAINT `accountingRules_ivaAccountId_pgcAccounts_id_fk` FOREIGN KEY (`ivaAccountId`) REFERENCES `pgcAccounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accountingRules` ADD CONSTRAINT `accountingRules_sourceId_pgcSources_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `pgcSources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcAccounts` ADD CONSTRAINT `pgcAccounts_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcAccounts` ADD CONSTRAINT `pgcAccounts_versionId_pgcVersions_id_fk` FOREIGN KEY (`versionId`) REFERENCES `pgcVersions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcAccounts` ADD CONSTRAINT `pgcAccounts_sourceId_pgcSources_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `pgcSources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcAuditFindings` ADD CONSTRAINT `pgcAuditFindings_auditRunId_pgcAuditRuns_id_fk` FOREIGN KEY (`auditRunId`) REFERENCES `pgcAuditRuns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcAuditFindings` ADD CONSTRAINT `pgcAuditFindings_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcAuditFindings` ADD CONSTRAINT `pgcAuditFindings_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcAuditFindings` ADD CONSTRAINT `pgcAuditFindings_pgcAccountId_pgcAccounts_id_fk` FOREIGN KEY (`pgcAccountId`) REFERENCES `pgcAccounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcAuditRuns` ADD CONSTRAINT `pgcAuditRuns_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcAuditRuns` ADD CONSTRAINT `pgcAuditRuns_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcAuditRuns` ADD CONSTRAINT `pgcAuditRuns_versionId_pgcVersions_id_fk` FOREIGN KEY (`versionId`) REFERENCES `pgcVersions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcMigrationMaps` ADD CONSTRAINT `pgcMigrationMaps_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcMigrationMaps` ADD CONSTRAINT `pgcMigrationMaps_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcMigrationMaps` ADD CONSTRAINT `pgcMigrationMaps_versionId_pgcVersions_id_fk` FOREIGN KEY (`versionId`) REFERENCES `pgcVersions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcMigrationMaps` ADD CONSTRAINT `pgcMigrationMaps_newAccountId_pgcAccounts_id_fk` FOREIGN KEY (`newAccountId`) REFERENCES `pgcAccounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcMigrationMaps` ADD CONSTRAINT `pgcMigrationMaps_sourceId_pgcSources_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `pgcSources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcSources` ADD CONSTRAINT `pgcSources_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcSources` ADD CONSTRAINT `pgcSources_versionId_pgcVersions_id_fk` FOREIGN KEY (`versionId`) REFERENCES `pgcVersions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcVersions` ADD CONSTRAINT `pgcVersions_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;