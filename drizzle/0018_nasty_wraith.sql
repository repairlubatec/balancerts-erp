CREATE TABLE `agt_integration_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`company_id` int NOT NULL,
	`version` varchar(32) NOT NULL,
	`xsd_version` varchar(64),
	`xsd_reference` varchar(512),
	`endpoint_reference` varchar(512),
	`auth_reference` varchar(255),
	`official_codes` json,
	`homologation_status` enum('NOT_AVAILABLE','INTERNAL_READY','TECHNICAL_PENDING','AGT_APPROVED') NOT NULL DEFAULT 'NOT_AVAILABLE',
	`active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agt_integration_configs_id` PRIMARY KEY(`id`)
);
