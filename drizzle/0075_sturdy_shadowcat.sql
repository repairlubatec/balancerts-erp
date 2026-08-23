CREATE TABLE `auditEventReviewStates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int,
	`auditEventId` int NOT NULL,
	`status` enum('OPEN','REVIEWED','RESOLVED') NOT NULL DEFAULT 'OPEN',
	`updatedBy` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditEventReviewStates_id` PRIMARY KEY(`id`),
	CONSTRAINT `audit_event_review_states_event_unique` UNIQUE(`auditEventId`)
);
--> statement-breakpoint
ALTER TABLE `auditEventReviewStates` ADD CONSTRAINT `auditEventReviewStates_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auditEventReviewStates` ADD CONSTRAINT `auditEventReviewStates_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auditEventReviewStates` ADD CONSTRAINT `auditEventReviewStates_auditEventId_auditEvents_id_fk` FOREIGN KEY (`auditEventId`) REFERENCES `auditEvents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auditEventReviewStates` ADD CONSTRAINT `auditEventReviewStates_updatedBy_users_id_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `audit_event_review_states_scope_idx` ON `auditEventReviewStates` (`organizationId`,`companyId`,`status`,`updatedAt`);