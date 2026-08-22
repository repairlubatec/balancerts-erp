CREATE TABLE `pgcEvidenceSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`versionId` int NOT NULL,
	`sourceId` int,
	`fileAssetId` int NOT NULL,
	`classCode` varchar(4) NOT NULL,
	`targetCodes` text NOT NULL,
	`evidenceType` enum('DIPLOMA','ANEXO','QUADRO','DIAGRAMA','OUTRO') NOT NULL DEFAULT 'OUTRO',
	`pageFrom` int,
	`pageTo` int,
	`notes` text,
	`status` enum('PENDING_REVIEW','UNDER_REVIEW','ACCEPTED','REJECTED') NOT NULL DEFAULT 'PENDING_REVIEW',
	`submittedBy` int NOT NULL,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNote` text,
	`correlationId` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pgcEvidenceSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `pgcEvidenceSubmissions` ADD CONSTRAINT `pgcEvidenceSubmissions_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcEvidenceSubmissions` ADD CONSTRAINT `pgcEvidenceSubmissions_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcEvidenceSubmissions` ADD CONSTRAINT `pgcEvidenceSubmissions_versionId_pgcVersions_id_fk` FOREIGN KEY (`versionId`) REFERENCES `pgcVersions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcEvidenceSubmissions` ADD CONSTRAINT `pgcEvidenceSubmissions_sourceId_pgcSources_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `pgcSources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pgcEvidenceSubmissions` ADD CONSTRAINT `pgcEvidenceSubmissions_fileAssetId_fileAssets_id_fk` FOREIGN KEY (`fileAssetId`) REFERENCES `fileAssets`(`id`) ON DELETE no action ON UPDATE no action;