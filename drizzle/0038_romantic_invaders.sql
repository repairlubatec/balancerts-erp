ALTER TABLE `counterparties` ADD `paymentTermsDays` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `counterparties` ADD `creditLimit` decimal(18,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `counterparties` ADD `preferredCurrency` varchar(3) DEFAULT 'AOA' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `salePrice` decimal(18,4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `purchasePrice` decimal(18,4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `stockManaged` int DEFAULT 1 NOT NULL;