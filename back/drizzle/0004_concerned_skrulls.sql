ALTER TABLE `adfs` ADD `tracking_shared` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `incidencies` ADD `visibilitat` text DEFAULT 'ADF_PRIVADA';--> statement-breakpoint
ALTER TABLE `users` RENAME COLUMN `role` TO `role_old`;--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `role` text DEFAULT 'voluntari';--> statement-breakpoint
UPDATE `users` SET `role` = CASE
	WHEN `role_old` = 'admin' THEN 'admin'
	WHEN `role_old` = 'editor' THEN 'coordinador'
	ELSE 'voluntari'
END;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `role_old`;