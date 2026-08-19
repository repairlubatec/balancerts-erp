CREATE TABLE `purchaseReceiptItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`receiptId` int NOT NULL,
	`orderItemId` int NOT NULL,
	`productId` int,
	`productCode` varchar(80) NOT NULL,
	`quantity` decimal(18,4) NOT NULL,
	`unitCost` decimal(18,4) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `purchaseReceiptItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchaseReceipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`orderId` int NOT NULL,
	`receiptNumber` varchar(80) NOT NULL,
	`periodId` int NOT NULL,
	`receivedAt` timestamp NOT NULL,
	`notes` text,
	`idempotencyKey` varchar(160) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `purchaseReceipts_id` PRIMARY KEY(`id`)
);
