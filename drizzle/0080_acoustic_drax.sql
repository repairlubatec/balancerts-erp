ALTER TABLE `documentTaxes` ADD `normativeRuleVersion` varchar(80);--> statement-breakpoint
ALTER TABLE `documentTaxes` ADD `legalReference` varchar(512);--> statement-breakpoint
ALTER TABLE `documentTaxes` ADD `calculationHash` varchar(64);