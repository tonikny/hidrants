CREATE TABLE `adfs` (
	`id` integer PRIMARY KEY NOT NULL,
	`nom` text NOT NULL,
	`osm_relations` text NOT NULL,
	`bbox` text,
	`center` text,
	`boundary_geojson` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `hidrants` (
	`id` text PRIMARY KEY NOT NULL,
	`osm_id` integer,
	`adf_id` integer,
	`municipi` text,
	`lat` real NOT NULL,
	`lon` real NOT NULL,
	`osm_tags` text DEFAULT '{}',
	`private_tags` text DEFAULT '{}',
	`sync_status` text DEFAULT 'SYNCED',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`adf_id`) REFERENCES `adfs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_hidrants_adf` ON `hidrants` (`adf_id`);--> statement-breakpoint
CREATE INDEX `idx_hidrants_osm_id` ON `hidrants` (`osm_id`);--> statement-breakpoint
CREATE INDEX `idx_hidrants_sync_status` ON `hidrants` (`sync_status`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`adf_id` integer,
	`role` text DEFAULT 'editor',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`adf_id`) REFERENCES `adfs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_users_username` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `idx_users_adf` ON `users` (`adf_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_adf_id_unique` ON `users` (`username`,`adf_id`);