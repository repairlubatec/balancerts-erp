CREATE TABLE `saadiCompanyLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int,
	`externalCompanyId` int,
	`linkType` enum('ESTUDO_OPERACIONAL','REFERENCIA_EXTERNA') NOT NULL,
	`status` enum('PENDENTE','AUTORIZADA','REVOGADA') NOT NULL DEFAULT 'PENDENTE',
	`authorizedBy` int,
	`authorizedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saadiCompanyLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saadiIntegrationRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int,
	`studyId` int NOT NULL,
	`source` varchar(80) NOT NULL,
	`requestHash` varchar(64) NOT NULL,
	`status` enum('PENDENTE','EM_PROCESSAMENTO','CONCLUIDA','RETRY','FALHADA','RECONCILIACAO_NECESSARIA') NOT NULL DEFAULT 'PENDENTE',
	`attempts` int NOT NULL DEFAULT 0,
	`errorCode` varchar(80),
	`errorMessage` text,
	`startedAt` timestamp,
	`finishedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saadiIntegrationRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saadiMetricProvenance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int,
	`studyId` int NOT NULL,
	`versionId` int,
	`metric` varchar(160) NOT NULL,
	`periodYear` int,
	`value` varchar(80) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'AOA',
	`authoritySource` enum('ERP','DOCUMENTO','UTILIZADOR','IA') NOT NULL,
	`dataNature` enum('REALIZADO','PREMISSA','PROJECCAO','DERIVADO','INTRODUZIDO_UTILIZADOR','SUGESTAO_IA') NOT NULL,
	`sourceDocumentId` int,
	`sourcePage` int,
	`sourceField` varchar(120),
	`transformation` text,
	`valueHash` varchar(64) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saadiMetricProvenance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saadiProjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int,
	`externalCompanyId` int,
	`code` varchar(64) NOT NULL,
	`name` varchar(180) NOT NULL,
	`description` text,
	`status` enum('RASCUNHO','EM_ANALISE','APROVADO','ARQUIVADO') NOT NULL DEFAULT 'RASCUNHO',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saadiProjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `saadi_project_code_unique` UNIQUE(`organizationId`,`code`)
);
--> statement-breakpoint
CREATE TABLE `saadiVersionSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int,
	`versionId` int NOT NULL,
	`snapshotId` int NOT NULL,
	`relationType` enum('BASE','SUPORTE','RECONCILIACAO') NOT NULL DEFAULT 'SUPORTE',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saadiVersionSnapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `saadi_version_snapshot_unique` UNIQUE(`versionId`,`snapshotId`)
);
