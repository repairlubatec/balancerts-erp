ALTER TABLE `payrollRuns` ADD `accountingPreparedBy` int;--> statement-breakpoint
ALTER TABLE `payrollRuns` ADD `accountingPreparedAt` timestamp;--> statement-breakpoint
ALTER TABLE `payrollRuns` ADD `accountingApprovedBy` int;--> statement-breakpoint
ALTER TABLE `payrollRuns` ADD `accountingApprovedAt` timestamp;--> statement-breakpoint
ALTER TABLE `payrollRuns` ADD `accountingReference` varchar(160);