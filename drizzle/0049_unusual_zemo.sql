ALTER TABLE `payrollRuleSets` ADD `salaryAccountCode` varchar(30);--> statement-breakpoint
ALTER TABLE `payrollRuleSets` ADD `socialExpenseAccountCode` varchar(30);--> statement-breakpoint
ALTER TABLE `payrollRuleSets` ADD `irtPayableAccountCode` varchar(30);--> statement-breakpoint
ALTER TABLE `payrollRuleSets` ADD `netPayableAccountCode` varchar(30);--> statement-breakpoint
ALTER TABLE `payrollRuns` ADD `reviewedBy` int;--> statement-breakpoint
ALTER TABLE `payrollRuns` ADD `reviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `payrollRuns` ADD `reviewNotes` text;