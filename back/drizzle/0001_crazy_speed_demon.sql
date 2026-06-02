CREATE TABLE `incidencia_events` (
	`id` text PRIMARY KEY NOT NULL,
	`incidencia_id` text NOT NULL,
	`usuari_id` text,
	`tipus_event` text NOT NULL,
	`dades` text DEFAULT '{}',
	`creat_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`incidencia_id`) REFERENCES `incidencies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuari_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_events_incidencia` ON `incidencia_events` (`incidencia_id`);--> statement-breakpoint
CREATE TABLE `incidencies` (
	`id` text PRIMARY KEY NOT NULL,
	`titol` text NOT NULL,
	`tipus` text NOT NULL,
	`estat` text DEFAULT 'OBERT',
	`prioritat` text DEFAULT 'MITJANA',
	`adf_id` integer,
	`lat` real NOT NULL,
	`lon` real NOT NULL,
	`precisio` text DEFAULT 'DESCONEGUDA',
	`creat_at` text DEFAULT CURRENT_TIMESTAMP,
	`actualitzat_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`adf_id`) REFERENCES `adfs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_incidencies_adf` ON `incidencies` (`adf_id`);--> statement-breakpoint
CREATE INDEX `idx_incidencies_estat` ON `incidencies` (`estat`);