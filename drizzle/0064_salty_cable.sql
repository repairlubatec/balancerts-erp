ALTER TABLE `saadiStudies` MODIFY COLUMN `companyId` int;--> statement-breakpoint
ALTER TABLE `saadiStudies` ADD `entityType` enum('ERP','EXTERNA') DEFAULT 'ERP' NOT NULL;--> statement-breakpoint
ALTER TABLE `saadiStudies` ADD `externalCompanyId` int;--> statement-breakpoint
ALTER TABLE `saadiStudies` ADD `studyType` varchar(100) DEFAULT 'INVESTIMENTO' NOT NULL;--> statement-breakpoint
ALTER TABLE `saadiStudies` ADD `description` text;--> statement-breakpoint
ALTER TABLE `saadiStudies` ADD `responsibleName` varchar(180);--> statement-breakpoint
ALTER TABLE `saadiStudies` ADD `responsibleProfessionalId` varchar(80);--> statement-breakpoint
ALTER TABLE `saadiStudies` ADD `accountingFirm` varchar(180);--> statement-breakpoint
ALTER TABLE `saadiStudies` ADD `responsibleContact` varchar(120);--> statement-breakpoint
ALTER TABLE `saadiStudies` ADD `responsibleEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `saadiStudies` ADD `studyDate` timestamp;--> statement-breakpoint
ALTER TABLE `saadiStudies` ADD `workflowStatus` enum('RASCUNHO','EM_ANALISE','AGUARDANDO_VALIDACAO','VALIDADO','CONCLUIDO','ARQUIVADO') DEFAULT 'RASCUNHO' NOT NULL;