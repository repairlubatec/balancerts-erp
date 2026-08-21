CREATE TABLE `saadiFeasibilityInputs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`studyId` int NOT NULL,
	`initialInvestment` varchar(40) NOT NULL,
	`discountRate` varchar(40) NOT NULL,
	`cashFlowsJson` text NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'AOA',
	`inputHash` varchar(64) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saadiFeasibilityInputs_id` PRIMARY KEY(`id`),
	CONSTRAINT `saadi_feasibility_inputs_study_unique` UNIQUE(`organizationId`,`companyId`,`studyId`)
);
--> statement-breakpoint
CREATE TABLE `saadiFinancialResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`studyId` int NOT NULL,
	`npv` varchar(40) NOT NULL,
	`irr` varchar(40) NOT NULL,
	`paybackMonths` varchar(40) NOT NULL,
	`roi` varchar(40) NOT NULL,
	`decision` enum('PROSSEGUIR','REVER','REJEITAR') NOT NULL,
	`resultJson` text NOT NULL,
	`resultHash` varchar(64) NOT NULL,
	`calculatedBy` int NOT NULL,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saadiFinancialResults_id` PRIMARY KEY(`id`),
	CONSTRAINT `saadi_financial_results_study_unique` UNIQUE(`organizationId`,`companyId`,`studyId`)
);
