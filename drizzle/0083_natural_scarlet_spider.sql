CREATE TABLE `fiscalCalendarObligations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`code` varchar(120) NOT NULL,
	`tax` varchar(40) NOT NULL,
	`title` varchar(255) NOT NULL,
	`sector` varchar(40) NOT NULL,
	`regime` varchar(60) NOT NULL,
	`periodicity` varchar(40) NOT NULL,
	`deadlineType` enum('FIXED_DAY','RELATIVE_DAYS','NEXT_MONTH','ANNIVERSARY','CONDITIONAL') NOT NULL,
	`deadlineDaysByMonth` json,
	`relativeDays` int,
	`sourceReference` varchar(255) NOT NULL,
	`sourcePage` int,
	`sourceStatus` enum('CONFIRMED','PENDING_REVIEW','BLOCKED') NOT NULL DEFAULT 'PENDING_REVIEW',
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fiscalCalendarObligations_id` PRIMARY KEY(`id`),
	CONSTRAINT `fiscal_calendar_year_code_unique` UNIQUE(`year`,`code`)
);
--> statement-breakpoint
CREATE TABLE `fiscalChecklistItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`fiscalExerciseId` int,
	`fiscalPeriodId` int,
	`obligationId` int NOT NULL,
	`dueDate` timestamp,
	`status` enum('PENDING','IN_PROGRESS','COMPLETED','OVERDUE','BLOCKED') NOT NULL DEFAULT 'PENDING',
	`notes` text,
	`completedBy` int,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fiscalChecklistItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `fiscal_checklist_company_obligation_date_unique` UNIQUE(`companyId`,`obligationId`,`dueDate`)
);
--> statement-breakpoint
ALTER TABLE `fiscalChecklistItems` ADD CONSTRAINT `fiscal_check_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fiscalChecklistItems` ADD CONSTRAINT `fiscal_check_company_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fiscalChecklistItems` ADD CONSTRAINT `fiscal_check_exercise_fk` FOREIGN KEY (`fiscalExerciseId`) REFERENCES `fiscalExercises`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fiscalChecklistItems` ADD CONSTRAINT `fiscal_check_period_fk` FOREIGN KEY (`fiscalPeriodId`) REFERENCES `fiscalPeriods`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fiscalChecklistItems` ADD CONSTRAINT `fiscal_check_obligation_fk` FOREIGN KEY (`obligationId`) REFERENCES `fiscalCalendarObligations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fiscalChecklistItems` ADD CONSTRAINT `fiscal_check_user_fk` FOREIGN KEY (`completedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `fiscal_calendar_year_regime_idx` ON `fiscalCalendarObligations` (`year`,`regime`);--> statement-breakpoint
CREATE INDEX `fiscal_checklist_company_due_date_idx` ON `fiscalChecklistItems` (`companyId`,`dueDate`);--> statement-breakpoint
CREATE INDEX `fiscal_checklist_company_status_idx` ON `fiscalChecklistItems` (`companyId`,`status`);