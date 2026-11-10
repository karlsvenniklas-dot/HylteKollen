CREATE TABLE `correction_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `agenda_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`text` text NOT NULL,
	`protocol_document_id` text NOT NULL,
	`page` integer NOT NULL,
	`verified_at` text NOT NULL,
	`verified_by` text NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `agenda_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`protocol_document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`hash` text,
	`checked_at` text NOT NULL,
	`fetch_status` text NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `agenda_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_documents_item` ON `documents` (`item_id`);--> statement-breakpoint
CREATE TABLE `follow_ups` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`title` text NOT NULL,
	`status` text NOT NULL,
	`due_date` text,
	`source_id` text,
	FOREIGN KEY (`item_id`) REFERENCES `agenda_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `imports` (
	`id` text PRIMARY KEY NOT NULL,
	`completed_at` text NOT NULL,
	`item_count` integer NOT NULL,
	`document_count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `agenda_items` (
	`id` text PRIMARY KEY NOT NULL,
	`meeting_id` text NOT NULL,
	`number` integer NOT NULL,
	`title` text NOT NULL,
	`location` text NOT NULL,
	`status` text DEFAULT 'underlag' NOT NULL,
	FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_items_meeting` ON `agenda_items` (`meeting_id`);--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`source_url` text NOT NULL,
	`source_hash` text NOT NULL,
	`checked_at` text NOT NULL,
	`protocol_published` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_meetings_date` ON `meetings` (`date`);--> statement-breakpoint
CREATE TABLE `corrections` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`previous` text NOT NULL,
	`replacement` text NOT NULL,
	`reason` text NOT NULL,
	`source_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `source_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`hash` text NOT NULL,
	`observed_at` text NOT NULL,
	`content` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_versions_source` ON `source_versions` (`source_id`);