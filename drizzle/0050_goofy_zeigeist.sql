CREATE TABLE `humanResourcesTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`payrollRunId` int,
	`title` varchar(180) NOT NULL,
	`status` enum('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`assigneeUserId` int,
	`dueDate` timestamp,
	`createdBy` int NOT NULL,
	`completedBy` int,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `humanResourcesTasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_tasks_company_id_index` UNIQUE(`companyId`,`id`)
);
--> statement-breakpoint
ALTER TABLE `humanResourcesTasks` ADD CONSTRAINT `humanResourcesTasks_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `humanResourcesTasks` ADD CONSTRAINT `humanResourcesTasks_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `humanResourcesTasks` ADD CONSTRAINT `humanResourcesTasks_payrollRunId_payrollRuns_id_fk` FOREIGN KEY (`payrollRunId`) REFERENCES `payrollRuns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `humanResourcesTasks` ADD CONSTRAINT `humanResourcesTasks_assigneeUserId_users_id_fk` FOREIGN KEY (`assigneeUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `humanResourcesTasks` ADD CONSTRAINT `humanResourcesTasks_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `humanResourcesTasks` ADD CONSTRAINT `humanResourcesTasks_completedBy_users_id_fk` FOREIGN KEY (`completedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;