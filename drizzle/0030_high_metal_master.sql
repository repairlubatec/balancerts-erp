ALTER TABLE `journalEntries` ADD `supportFileAssetId` int;--> statement-breakpoint
ALTER TABLE `journalEntries` ADD `documentReference` varchar(120);--> statement-breakpoint
ALTER TABLE `journalEntries` ADD `journalCode` varchar(32) DEFAULT 'GERAL' NOT NULL;--> statement-breakpoint
ALTER TABLE `journalEntries` ADD `costCenter` varchar(80);--> statement-breakpoint
ALTER TABLE `journalEntries` ADD `analyticalDimension` varchar(120);--> statement-breakpoint
ALTER TABLE `journalEntries` ADD `reviewStatus` enum('PENDING','APPROVED') DEFAULT 'APPROVED' NOT NULL;--> statement-breakpoint
ALTER TABLE `journalEntries` ADD `reviewedBy` int;--> statement-breakpoint
ALTER TABLE `journalEntries` ADD `reviewedAt` timestamp;