CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`employeeNumber` varchar(40) NOT NULL,
	`fullName` varchar(180) NOT NULL,
	`taxId` varchar(32),
	`socialSecurityNumber` varchar(40),
	`birthDate` timestamp,
	`hireDate` timestamp NOT NULL,
	`email` varchar(320),
	`phone` varchar(40),
	`address` varchar(255),
	`bankName` varchar(120),
	`bankAccount` varchar(80),
	`status` enum('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_company_employee_number_unique` UNIQUE(`companyId`,`employeeNumber`)
);
--> statement-breakpoint
CREATE TABLE `employmentContracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companyId` int NOT NULL,
	`employeeId` int NOT NULL,
	`contractNumber` varchar(50) NOT NULL,
	`contractType` enum('INDETERMINADO','TERMO','TEMPO_PARCIAL','ESTAGIO','PRESTACAO_SERVICOS') NOT NULL,
	`position` varchar(160) NOT NULL,
	`department` varchar(120),
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`baseSalary` decimal(18,2) NOT NULL,
	`salaryCurrency` varchar(3) NOT NULL DEFAULT 'AOA',
	`weeklyHours` decimal(5,2) NOT NULL DEFAULT '44',
	`workSchedule` varchar(120),
	`status` enum('DRAFT','ACTIVE','ENDED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
	`terminationReason` varchar(255),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employmentContracts_id` PRIMARY KEY(`id`),
	CONSTRAINT `employment_contracts_company_number_unique` UNIQUE(`companyId`,`contractNumber`)
);
--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employmentContracts` ADD CONSTRAINT `employmentContracts_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employmentContracts` ADD CONSTRAINT `employmentContracts_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employmentContracts` ADD CONSTRAINT `employmentContracts_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;