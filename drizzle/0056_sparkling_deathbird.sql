CREATE TABLE `saadiScenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`studyId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`initialInvestment` varchar(40) NOT NULL,
	`discountRate` varchar(40) NOT NULL,
	`cashFlowsJson` text NOT NULL,
	`resultJson` text,
	`resultHash` varchar(64),
	`decision` enum('PROSSEGUIR','REVER','REJEITAR'),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saadiScenarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `saadi_scenarios_study_name_unique` UNIQUE(`organizationId`,`companyId`,`studyId`,`name`)
);
