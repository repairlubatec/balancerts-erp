CREATE TABLE `balancertsIaConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`enabled` int NOT NULL DEFAULT 1,
	`localEnabled` int NOT NULL DEFAULT 1,
	`localBaseUrl` varchar(255) NOT NULL DEFAULT 'http://127.0.0.1',
	`localPort` int NOT NULL DEFAULT 11434,
	`localModel` varchar(120) NOT NULL DEFAULT 'qwen2.5:3b',
	`azureEnabled` int NOT NULL DEFAULT 0,
	`azureEndpoint` varchar(255),
	`azureDeployment` varchar(120),
	`azureSecretRef` varchar(160),
	`openaiEnabled` int NOT NULL DEFAULT 0,
	`openaiModel` varchar(120) NOT NULL DEFAULT 'gpt-5-mini',
	`openaiSecretRef` varchar(160),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `balancertsIaConfigs_id` PRIMARY KEY(`id`),
	CONSTRAINT `balancertsIaConfigs_companyId_unique` UNIQUE(`companyId`)
);
--> statement-breakpoint
CREATE TABLE `balancertsIaLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`userId` int NOT NULL,
	`operation` varchar(80) NOT NULL,
	`provider` varchar(40) NOT NULL,
	`model` varchar(120),
	`confidence` decimal(5,2),
	`requestSummary` text,
	`resultSummary` text,
	`responseMs` int,
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `balancertsIaLogs_id` PRIMARY KEY(`id`)
);
