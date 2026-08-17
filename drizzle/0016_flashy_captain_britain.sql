ALTER TABLE `businessDocuments` ADD `correctsDocumentId` int;--> statement-breakpoint
ALTER TABLE `businessDocuments` ADD `cancellationReason` varchar(255);--> statement-breakpoint
ALTER TABLE `businessDocuments` ADD `archivedAt` timestamp;