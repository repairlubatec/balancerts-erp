CREATE TABLE `integrationOperations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`idempotencyKey` varchar(160) NOT NULL,
	`state` enum('PENDING','SENT','FAILED','RETRY','COMPLETED','RECONCILIATION_REQUIRED') NOT NULL DEFAULT 'PENDING',
	`attempts` int NOT NULL DEFAULT 0,
	`lastError` text,
	`resultPayload` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrationOperations_id` PRIMARY KEY(`id`),
	CONSTRAINT `integrationOperations_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
