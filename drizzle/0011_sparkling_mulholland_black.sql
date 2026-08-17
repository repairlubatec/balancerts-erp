CREATE TABLE `fiscalExercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`year` int NOT NULL,
	`status` enum('OPEN','CLOSED') NOT NULL DEFAULT 'OPEN',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fiscalExercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `fiscalPeriods` ADD `exerciseId` int;