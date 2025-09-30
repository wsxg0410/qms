CREATE TABLE `queues` (
	`id` text PRIMARY KEY NOT NULL,
	`env` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`errorTimes` integer DEFAULT 0 NOT NULL,
	`data` text DEFAULT '{}',
	`config` text DEFAULT '{}',
	`priority` integer DEFAULT 0 NOT NULL,
	`result` text,
	`execAt` text NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
