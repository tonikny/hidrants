CREATE TABLE `telegram_bots` (
	`id` text PRIMARY KEY NOT NULL,
	`adf_id` integer NOT NULL,
	`bot_id` integer NOT NULL,
	`bot_username` text NOT NULL,
	`bot_name` text,
	`token_enc` text NOT NULL,
	`webhook_secret` text NOT NULL,
	`chat_id` integer,
	`group_name` text,
	`estat` text DEFAULT 'NO_CONFIGURAT',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`adf_id`) REFERENCES `adfs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `telegram_bots_adf_id_unique` ON `telegram_bots` (`adf_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `telegram_bots_bot_id_unique` ON `telegram_bots` (`bot_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `telegram_bots_chat_id_unique` ON `telegram_bots` (`chat_id`);--> statement-breakpoint
CREATE TABLE `telegram_links` (
	`id` text PRIMARY KEY NOT NULL,
	`telegram_bot_id` text NOT NULL,
	`code_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`telegram_bot_id`) REFERENCES `telegram_bots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `telegram_links_code_hash_unique` ON `telegram_links` (`code_hash`);