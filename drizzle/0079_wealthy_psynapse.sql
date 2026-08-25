CREATE TABLE `documentPresentationSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`logoFileAssetId` int,
	`invoiceTemplate` varchar(40) NOT NULL DEFAULT 'CORPORATIVO_A4',
	`receiptTemplate` varchar(40) NOT NULL DEFAULT 'CORPORATIVO_A4',
	`paperSize` enum('A4','A5','TALAO_80MM') NOT NULL DEFAULT 'A4',
	`orientation` enum('PORTRAIT','LANDSCAPE') NOT NULL DEFAULT 'PORTRAIT',
	`marginMm` int NOT NULL DEFAULT 12,
	`scalePercent` int NOT NULL DEFAULT 100,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documentPresentationSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `documentPresentationSettings_companyId_unique` UNIQUE(`companyId`)
);
