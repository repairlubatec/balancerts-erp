ALTER TABLE `businessDocuments` ADD `sourceReceiptId` int;--> statement-breakpoint
ALTER TABLE `businessDocuments` ADD `conversionKey` varchar(160);--> statement-breakpoint
ALTER TABLE `businessDocuments` ADD CONSTRAINT `businessDocuments_conversionKey_unique` UNIQUE(`conversionKey`);