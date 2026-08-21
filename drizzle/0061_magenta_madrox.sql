ALTER TABLE `saadiFeasibilityInputs` ADD `equityAmount` varchar(40) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `saadiFeasibilityInputs` ADD `debtAmount` varchar(40) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `saadiFeasibilityInputs` ADD `debtInterestRate` varchar(40) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `saadiFeasibilityInputs` ADD `debtTermMonths` int DEFAULT 0 NOT NULL;