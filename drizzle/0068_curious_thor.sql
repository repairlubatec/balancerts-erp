ALTER TABLE `cashAccounts` ADD `holderName` varchar(180);--> statement-breakpoint
ALTER TABLE `cashAccounts` ADD `openingBalance` decimal(18,2) DEFAULT '0.00' NOT NULL;