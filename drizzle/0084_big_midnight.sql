ALTER TABLE `accountingRules` ADD `taxType` enum('NONE','IVA','IRT') DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
ALTER TABLE `accountingRules` ADD `calculationBase` enum('NONE','NET','GROSS','WITHHOLDING_BASE','FIXED') DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
ALTER TABLE `accountingRules` ADD `taxRate` decimal(7,4);