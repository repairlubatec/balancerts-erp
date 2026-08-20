CREATE TABLE `saadiProvenance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`snapshotId` int NOT NULL,
	`sourceType` varchar(80) NOT NULL,
	`sourceEntityId` varchar(120) NOT NULL,
	`sourceHash` varchar(64) NOT NULL,
	`capturedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saadiProvenance_id` PRIMARY KEY(`id`),
	CONSTRAINT `saadi_provenance_source_unique` UNIQUE(`snapshotId`,`sourceType`,`sourceEntityId`)
);
--> statement-breakpoint
CREATE TABLE `saadiSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`studyId` int NOT NULL,
	`asOf` timestamp NOT NULL,
	`sourceFingerprint` varchar(64) NOT NULL,
	`payloadJson` text NOT NULL,
	`status` enum('READY','STALE','INVALID') NOT NULL DEFAULT 'READY',
	`idempotencyKey` varchar(160) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saadiSnapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `saadi_snapshots_idempotency_unique` UNIQUE(`organizationId`,`companyId`,`idempotencyKey`),
	CONSTRAINT `saadi_snapshots_fingerprint_unique` UNIQUE(`organizationId`,`companyId`,`sourceFingerprint`)
);
--> statement-breakpoint
CREATE TABLE `saadiStudies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`studyCode` varchar(64) NOT NULL,
	`name` varchar(180) NOT NULL,
	`status` enum('DRAFT','ACTIVE','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`baseCurrency` varchar(3) NOT NULL DEFAULT 'AOA',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saadiStudies_id` PRIMARY KEY(`id`),
	CONSTRAINT `saadi_studies_org_company_code_unique` UNIQUE(`organizationId`,`companyId`,`studyCode`)
);
--> statement-breakpoint
CREATE TABLE `saadiVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`studyId` int NOT NULL,
	`snapshotId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`status` enum('DRAFT','IN_REVIEW','APPROVED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`assumptionsJson` text NOT NULL,
	`projectionsJson` text NOT NULL,
	`versionHash` varchar(64) NOT NULL,
	`createdBy` int NOT NULL,
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saadiVersions_id` PRIMARY KEY(`id`),
	CONSTRAINT `saadi_versions_study_version_unique` UNIQUE(`studyId`,`versionNumber`),
	CONSTRAINT `saadi_versions_hash_unique` UNIQUE(`organizationId`,`companyId`,`versionHash`)
);
