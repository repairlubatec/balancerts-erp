ALTER TABLE `ivaNormativeRules` DROP INDEX `iva_normative_rules_organization_code_unique`;
--> statement-breakpoint
ALTER TABLE `ivaNormativeRules` ADD CONSTRAINT `iva_normative_rules_organization_code_effective_from_unique` UNIQUE(`organizationId`,`code`,`effectiveFrom`);
