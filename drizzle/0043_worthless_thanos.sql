CREATE TABLE `organizationMemberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','admin','contabilista','financeiro','operador','auditor') NOT NULL DEFAULT 'user',
	`status` enum('INVITED','ACTIVE','SUSPENDED','REMOVED') NOT NULL DEFAULT 'INVITED',
	`invitedBy` int,
	`joinedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizationMemberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_memberships_organization_user_unique` UNIQUE(`organizationId`,`userId`)
);
