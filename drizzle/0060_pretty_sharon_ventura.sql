CREATE TABLE `saadiDecisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`studyId` int NOT NULL,
	`versionId` int NOT NULL,
	`decision` enum('APROVAR','REJEITAR','PEDIR_REVISAO') NOT NULL,
	`justification` text NOT NULL,
	`decidedBy` int NOT NULL,
	`decidedAt` timestamp NOT NULL DEFAULT (now()),
	`decisionHash` varchar(64) NOT NULL,
	CONSTRAINT `saadiDecisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `saadi_decisions_version_unique` UNIQUE(`versionId`)
);
