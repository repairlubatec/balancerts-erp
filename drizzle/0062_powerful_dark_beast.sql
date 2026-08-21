ALTER TABLE `saadiScenarios` ADD `equityAmount` varchar(40) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `saadiScenarios` ADD `debtAmount` varchar(40) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `saadiScenarios` ADD `debtInterestRate` varchar(40) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `saadiScenarios` ADD `debtTermMonths` int DEFAULT 0 NOT NULL;