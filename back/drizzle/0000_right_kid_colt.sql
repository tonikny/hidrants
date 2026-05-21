CREATE TABLE `hidrants` (
	`id` text PRIMARY KEY NOT NULL,
	`osm_id` integer,
	`municipi` text,
	`lat` real NOT NULL,
	`lon` real NOT NULL,
	`osm_tags` text DEFAULT '{}',
	`private_tags` text DEFAULT '{}',
	`sync_status` text DEFAULT 'SYNCED',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_hidrants_municipi` ON `hidrants` (`municipi`);--> statement-breakpoint
CREATE INDEX `idx_hidrants_osm_id` ON `hidrants` (`osm_id`);--> statement-breakpoint
CREATE INDEX `idx_hidrants_sync_status` ON `hidrants` (`sync_status`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`municipi` text NOT NULL,
	`role` text DEFAULT 'editor',
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_users_username` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `idx_users_municipi` ON `users` (`municipi`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_municipi_unique` ON `users` (`username`,`municipi`);