CREATE TABLE `costCenters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`code` varchar(40) NOT NULL,
	`name` varchar(180) NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `costCenters_id` PRIMARY KEY(`id`)
);
