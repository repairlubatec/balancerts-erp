CREATE TABLE `fileAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`ownerUserId` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`filename` varchar(255) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`size` int NOT NULL,
	`sha256` varchar(64) NOT NULL,
	`allowedUserIds` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fileAssets_id` PRIMARY KEY(`id`)
);
