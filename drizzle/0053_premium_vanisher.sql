ALTER TABLE `humanResourcesTasks` ADD `description` text;--> statement-breakpoint
ALTER TABLE `humanResourcesTasks` ADD `priority` enum('LOW','NORMAL','HIGH','URGENT') DEFAULT 'NORMAL' NOT NULL;