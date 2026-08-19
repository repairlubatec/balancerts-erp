CREATE TABLE `payrollItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`runId` int NOT NULL,
	`employeeId` int NOT NULL,
	`contractId` int NOT NULL,
	`grossAmount` decimal(18,2) NOT NULL,
	`socialEmployeeAmount` decimal(18,2) NOT NULL,
	`irtAmount` decimal(18,2) NOT NULL,
	`socialEmployerAmount` decimal(18,2) NOT NULL,
	`netAmount` decimal(18,2) NOT NULL,
	`breakdown` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payrollItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payrollRuleSets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`version` varchar(40) NOT NULL,
	`effectiveFrom` timestamp NOT NULL,
	`effectiveTo` timestamp,
	`socialEmployeeRate` decimal(7,4) NOT NULL,
	`socialEmployerRate` decimal(7,4) NOT NULL,
	`irtBrackets` text NOT NULL,
	`sourceUrl` varchar(512),
	`verificationStatus` enum('INTERNAL_REVIEW','EXTERNALLY_VERIFIED','SUPERSEDED') NOT NULL DEFAULT 'INTERNAL_REVIEW',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payrollRuleSets_id` PRIMARY KEY(`id`),
	CONSTRAINT `payroll_rule_sets_company_version_unique` UNIQUE(`companyId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `payrollRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`ruleSetId` int NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`status` enum('DRAFT','CALCULATED','APPROVED','POSTED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
	`grossTotal` decimal(18,2) NOT NULL DEFAULT '0',
	`socialEmployeeTotal` decimal(18,2) NOT NULL DEFAULT '0',
	`irtTotal` decimal(18,2) NOT NULL DEFAULT '0',
	`socialEmployerTotal` decimal(18,2) NOT NULL DEFAULT '0',
	`netTotal` decimal(18,2) NOT NULL DEFAULT '0',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payrollRuns_id` PRIMARY KEY(`id`),
	CONSTRAINT `payroll_runs_company_period_unique` UNIQUE(`companyId`,`year`,`month`)
);
--> statement-breakpoint
ALTER TABLE `payrollItems` ADD CONSTRAINT `payrollItems_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payrollItems` ADD CONSTRAINT `payrollItems_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payrollItems` ADD CONSTRAINT `payrollItems_runId_payrollRuns_id_fk` FOREIGN KEY (`runId`) REFERENCES `payrollRuns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payrollItems` ADD CONSTRAINT `payrollItems_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payrollItems` ADD CONSTRAINT `payrollItems_contractId_employmentContracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `employmentContracts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payrollRuleSets` ADD CONSTRAINT `payrollRuleSets_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payrollRuleSets` ADD CONSTRAINT `payrollRuleSets_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payrollRuns` ADD CONSTRAINT `payrollRuns_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payrollRuns` ADD CONSTRAINT `payrollRuns_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payrollRuns` ADD CONSTRAINT `payrollRuns_ruleSetId_payrollRuleSets_id_fk` FOREIGN KEY (`ruleSetId`) REFERENCES `payrollRuleSets`(`id`) ON DELETE no action ON UPDATE no action;