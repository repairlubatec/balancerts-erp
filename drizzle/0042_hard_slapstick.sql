CREATE TABLE `stockCountItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`countId` int NOT NULL,
	`productCode` varchar(80) NOT NULL,
	`expectedQuantity` decimal(18,4) NOT NULL,
	`countedQuantity` decimal(18,4) NOT NULL,
	`unitCost` decimal(18,4) NOT NULL,
	`adjustmentMovementId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stockCountItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `stock_count_items_count_product_unique` UNIQUE(`countId`,`productCode`)
);
--> statement-breakpoint
CREATE TABLE `stockCounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`periodId` int NOT NULL,
	`warehouseId` int,
	`reference` varchar(80) NOT NULL,
	`countDate` timestamp NOT NULL,
	`status` enum('DRAFT','VALIDATED','APPLIED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
	`notes` text,
	`createdBy` int NOT NULL,
	`validatedBy` int,
	`appliedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stockCounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `stock_counts_company_reference_unique` UNIQUE(`companyId`,`reference`)
);
