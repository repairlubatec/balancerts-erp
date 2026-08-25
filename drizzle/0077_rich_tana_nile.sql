ALTER TABLE `fixedAssets` ADD `inServiceDate` timestamp;--> statement-breakpoint
ALTER TABLE `fixedAssets` ADD `disposalDate` timestamp;--> statement-breakpoint
ALTER TABLE `fixedAssets` ADD `disposalProceeds` decimal(18,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `fixedAssets` ADD `disposalReason` varchar(255);