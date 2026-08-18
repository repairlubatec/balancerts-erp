CREATE TABLE `fixedAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`code` varchar(80) NOT NULL,
	`name` varchar(180) NOT NULL,
	`acquisitionDate` timestamp NOT NULL,
	`acquisitionCost` decimal(18,2) NOT NULL,
	`residualValue` decimal(18,2) NOT NULL DEFAULT '0',
	`usefulLifeMonths` int NOT NULL,
	`status` enum('ACTIVE','DISPOSED') NOT NULL DEFAULT 'ACTIVE',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fixedAssets_id` PRIMARY KEY(`id`)
);
