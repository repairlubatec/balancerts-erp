ALTER TABLE `businessDocuments` ADD `counterpartyType` enum('CUSTOMER','SUPPLIER') DEFAULT 'CUSTOMER' NOT NULL;--> statement-breakpoint
ALTER TABLE `businessDocuments` ADD `dueDate` timestamp;--> statement-breakpoint
ALTER TABLE `businessDocuments` ADD `settledAmount` decimal(18,2) DEFAULT '0' NOT NULL;