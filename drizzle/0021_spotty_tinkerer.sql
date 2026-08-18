CREATE TABLE `agtEstablishments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`establishmentNumber` varchar(200) NOT NULL,
	`name` varchar(180) NOT NULL,
	`address` varchar(255),
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agtEstablishments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agtSeries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`establishmentId` int NOT NULL,
	`seriesCode` varchar(60) NOT NULL,
	`seriesYear` int NOT NULL,
	`documentType` varchar(2) NOT NULL,
	`seriesStatus` enum('A','U','F') NOT NULL DEFAULT 'A',
	`contingencyIndicator` enum('N','C') NOT NULL DEFAULT 'N',
	`invoicingMethod` varchar(4) NOT NULL DEFAULT 'FESF',
	`firstDocumentApproved` varchar(60),
	`lastDocumentApproved` varchar(60),
	`firstDocumentCreated` varchar(60),
	`lastDocumentCreated` varchar(60),
	`seriesCreationDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agtSeries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agtSignatureKeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`keyType` enum('SOFTWARE','ISSUER') NOT NULL,
	`signatureVersion` int NOT NULL,
	`publicKeyReference` varchar(512) NOT NULL,
	`privateKeyReference` varchar(512),
	`status` enum('PENDING','ACTIVE','ROTATING','REVOKED') NOT NULL DEFAULT 'PENDING',
	`effectiveFrom` timestamp,
	`revokedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agtSignatureKeys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agtSubmissionDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` int NOT NULL,
	`companyId` int NOT NULL,
	`documentId` int,
	`documentNo` varchar(60) NOT NULL,
	`documentStatus` enum('PENDING','VALID','INVALID','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`errorCode` varchar(8),
	`errorDescription` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agtSubmissionDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agtSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`operation` varchar(40) NOT NULL,
	`submissionUUID` varchar(64) NOT NULL,
	`requestID` varchar(15),
	`integrationOperationId` int,
	`state` enum('PENDING','PROCESSING','COMPLETED','PARTIAL','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`resultCode` varchar(8),
	`payload` text NOT NULL,
	`responsePayload` text,
	`nextPollAt` timestamp,
	`lastPolledAt` timestamp,
	`attempts` int NOT NULL DEFAULT 0,
	`lastError` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agtSubmissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `agtSubmissions_submissionUUID_unique` UNIQUE(`submissionUUID`)
);
