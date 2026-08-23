CREATE TABLE `auditEventNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int,
	`auditEventId` int NOT NULL,
	`authorUserId` int NOT NULL,
	`note` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditEventNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `auditEventNotes` ADD CONSTRAINT `auditEventNotes_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auditEventNotes` ADD CONSTRAINT `auditEventNotes_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auditEventNotes` ADD CONSTRAINT `auditEventNotes_auditEventId_auditEvents_id_fk` FOREIGN KEY (`auditEventId`) REFERENCES `auditEvents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auditEventNotes` ADD CONSTRAINT `auditEventNotes_authorUserId_users_id_fk` FOREIGN KEY (`authorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `audit_event_notes_event_scope_idx` ON `auditEventNotes` (`organizationId`,`companyId`,`auditEventId`,`createdAt`);