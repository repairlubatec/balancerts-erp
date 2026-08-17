CREATE TABLE `cashReconciliations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`cashAccountId` int NOT NULL,
	`statementDate` timestamp NOT NULL,
	`openingBalance` decimal(18,2) NOT NULL,
	`closingBalance` decimal(18,2) NOT NULL,
	`systemBalance` decimal(18,2) NOT NULL,
	`difference` decimal(18,2) NOT NULL,
	`status` enum('OPEN','RECONCILED') NOT NULL DEFAULT 'OPEN',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cashReconciliations_id` PRIMARY KEY(`id`)
);
