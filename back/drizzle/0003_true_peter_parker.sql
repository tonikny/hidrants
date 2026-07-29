CREATE TABLE `mqtt_users` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mqtt_username` text NOT NULL,
	`mqtt_password_enc` text,
	`enabled` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_mqtt_users_user_id` ON `mqtt_users` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `mqtt_users_mqtt_username_unique` ON `mqtt_users` (`mqtt_username`);--> statement-breakpoint
DROP INDEX `users_username_adf_id_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);