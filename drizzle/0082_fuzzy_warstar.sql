CREATE TABLE `pgcNormativeLayers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`baseVersionId` int NOT NULL,
	`sourceId` int NOT NULL,
	`code` varchar(80) NOT NULL,
	`name` varchar(255) NOT NULL,
	`layerType` enum('ACCOUNTING_AMENDMENT','FISCAL_ACCOUNTS','TAX_CODE','TAX_AMENDMENT','DECLARATIVE_MODEL') NOT NULL,
	`description` text NOT NULL,
	`effectiveFrom` timestamp NOT NULL,
	`effectiveTo` timestamp,
	`status` enum('PENDING','CONFIRMED','CONFLICT','REJECTED') NOT NULL DEFAULT 'PENDING',
	`evidenceHash` varchar(64),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pgcNormativeLayers_id` PRIMARY KEY(`id`),
	CONSTRAINT `pgc_normative_layer_code_unique` UNIQUE(`organizationId`,`baseVersionId`,`code`)
);
--> statement-breakpoint
ALTER TABLE `pgcNormativeLayers` ADD CONSTRAINT `pgcNormativeLayers_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcNormativeLayers` ADD CONSTRAINT `pgcNormativeLayers_baseVersionId_pgcVersions_id_fk` FOREIGN KEY (`baseVersionId`) REFERENCES `pgcVersions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcNormativeLayers` ADD CONSTRAINT `pgcNormativeLayers_sourceId_pgcSources_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `pgcSources`(`id`) ON DELETE no action ON UPDATE no action;