CREATE TABLE `saadiVarianceReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`studyId` int NOT NULL,
	`snapshotId` int NOT NULL,
	`metric` varchar(160) NOT NULL,
	`projectedValue` varchar(40) NOT NULL,
	`realizedValue` varchar(40) NOT NULL,
	`absoluteVariance` varchar(40) NOT NULL,
	`percentageVariance` varchar(40),
	`currency` varchar(3) NOT NULL DEFAULT 'AOA',
	`sourceHash` varchar(64) NOT NULL,
	`comparisonHash` varchar(64) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saadiVarianceReports_id` PRIMARY KEY(`id`),
	CONSTRAINT `saadi_variance_study_snapshot_metric_unique` UNIQUE(`studyId`,`snapshotId`,`metric`)
);
