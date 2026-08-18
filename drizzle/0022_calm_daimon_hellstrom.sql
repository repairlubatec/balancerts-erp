CREATE TABLE `documentImportBatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`kind` enum('counterparties','products','documents') NOT NULL,
	`status` enum('IMPORTED_REVIEW','READY_TO_CONFIRM','CONFIRMED','REJECTED') NOT NULL DEFAULT 'IMPORTED_REVIEW',
	`originalFilename` varchar(255) NOT NULL,
	`validationSummary` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documentImportBatches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentImportRows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchId` int NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`lineNumber` int NOT NULL,
	`payload` text NOT NULL,
	`status` enum('VALID','INVALID','CORRECTED','CONFIRMED') NOT NULL DEFAULT 'VALID',
	`errors` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documentImportRows_id` PRIMARY KEY(`id`)
);
