CREATE TABLE `ubicacions` (
	`id` text PRIMARY KEY NOT NULL,
	`topic` text NOT NULL,
	`tracker_id` text,
	`lat` real NOT NULL,
	`lon` real NOT NULL,
	`timestamp` integer NOT NULL,
	`accuracy` real,
	`altitude` real,
	`battery` integer,
	`velocity` real,
	`trigger` text,
	`connection` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_ubicacions_topic` ON `ubicacions` (`topic`);--> statement-breakpoint
CREATE INDEX `idx_ubicacions_timestamp` ON `ubicacions` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_ubicacions_tracker` ON `ubicacions` (`tracker_id`);