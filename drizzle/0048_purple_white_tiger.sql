ALTER TABLE `payrollRuns` ADD `approvedBy` int;--> statement-breakpoint
ALTER TABLE `payrollRuns` ADD `approvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `payrollRuns` ADD `closedBy` int;--> statement-breakpoint
ALTER TABLE `payrollRuns` ADD `closedAt` timestamp;--> statement-breakpoint
ALTER TABLE `payrollRuns` ADD `accountingLinkStatus` enum('NOT_PREPARED','PREPARED','POSTED') DEFAULT 'NOT_PREPARED' NOT NULL;