ALTER TABLE `companies` ADD `legalForm` varchar(80);--> statement-breakpoint
ALTER TABLE `companies` ADD `address` varchar(255);--> statement-breakpoint
ALTER TABLE `companies` ADD `municipality` varchar(120);--> statement-breakpoint
ALTER TABLE `companies` ADD `province` varchar(120);--> statement-breakpoint
ALTER TABLE `companies` ADD `phone` varchar(40);--> statement-breakpoint
ALTER TABLE `companies` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `companies` ADD `activity` varchar(180);--> statement-breakpoint
ALTER TABLE `companies` ADD `incorporationYear` int;--> statement-breakpoint
ALTER TABLE `companies` ADD `configurationStatus` enum('PENDING','READY','BLOCKED') DEFAULT 'PENDING' NOT NULL;