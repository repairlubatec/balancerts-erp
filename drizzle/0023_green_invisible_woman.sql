CREATE TABLE `fileAssetVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileAssetId` int NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`filename` varchar(255) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`size` int NOT NULL,
	`sha256` varchar(64) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fileAssetVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `fileAssets` ADD `category` enum('FISCAL','CONTABILISTICO','CONTRATO','RH','OUTRO') DEFAULT 'OUTRO' NOT NULL;--> statement-breakpoint
ALTER TABLE `fileAssets` ADD `description` text;--> statement-breakpoint
ALTER TABLE `fileAssets` ADD `reference` varchar(180);--> statement-breakpoint
ALTER TABLE `fileAssets` ADD `currentVersion` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `fileAssets` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `fileAssets` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;