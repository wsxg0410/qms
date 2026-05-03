DROP INDEX `idx_execAt`;--> statement-breakpoint
DROP INDEX `idx_createdAt`;--> statement-breakpoint
CREATE INDEX `idx_env_type_status_execAt` ON `queues` (`env`,`type`,`status`,`execAt`);--> statement-breakpoint
CREATE INDEX `idx_env_status` ON `queues` (`env`,`status`);