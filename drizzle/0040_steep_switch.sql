CREATE TABLE `warehouses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`code` varchar(40) NOT NULL,
	`name` varchar(180) NOT NULL,
	`address` varchar(255),
	`active` int NOT NULL DEFAULT 1,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `warehouses_id` PRIMARY KEY(`id`),
	CONSTRAINT `warehouses_company_code_unique` UNIQUE(`companyId`,`code`)
);
--> statement-breakpoint
ALTER TABLE `stockMovements` ADD `warehouseId` int;