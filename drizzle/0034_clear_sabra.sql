ALTER TABLE `payments` ADD `approvalStatus` enum('PENDING','APPROVED','REJECTED') DEFAULT 'APPROVED' NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `approvedBy` int;--> statement-breakpoint
ALTER TABLE `payments` ADD `approvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `payments` ADD `executionReference` varchar(160);