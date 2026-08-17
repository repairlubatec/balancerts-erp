CREATE TABLE `stockMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`periodId` int NOT NULL,
	`productCode` varchar(80) NOT NULL,
	`type` enum('IN','OUT') NOT NULL,
	`quantity` decimal(18,4) NOT NULL,
	`unitCost` decimal(18,4) NOT NULL,
	`sourceDocumentId` int,
	`journalEntryId` int,
	`correlationId` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stockMovements_id` PRIMARY KEY(`id`)
);
