CREATE TABLE `documentSeries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`documentType` varchar(32) NOT NULL,
	`nextNumber` int NOT NULL DEFAULT 1,
	`active` int NOT NULL DEFAULT 1,
	CONSTRAINT `documentSeries_id` PRIMARY KEY(`id`)
);
