ALTER TABLE `auditEvents` MODIFY COLUMN `correlationId` varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE `auditEvents` ADD `eventHash` varchar(64);--> statement-breakpoint
ALTER TABLE `auditEvents` ADD `previousHash` varchar(64);