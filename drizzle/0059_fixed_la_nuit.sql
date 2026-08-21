CREATE TABLE `saadiRisks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`studyId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`probability` int NOT NULL,
	`impact` int NOT NULL,
	`exposure` int NOT NULL,
	`response` enum('EVITAR','REDUZIR','TRANSFERIR','ACEITAR') NOT NULL DEFAULT 'REDUZIR',
	`status` enum('ABERTO','MITIGADO','ACEITE','ENCERRADO') NOT NULL DEFAULT 'ABERTO',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saadiRisks_id` PRIMARY KEY(`id`),
	CONSTRAINT `saadi_risks_study_title_unique` UNIQUE(`studyId`,`title`)
);
