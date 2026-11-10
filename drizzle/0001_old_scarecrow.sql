CREATE TABLE `tracked_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`docket` text NOT NULL,
	`title` text NOT NULL,
	`status` text NOT NULL,
	`evidence_as_of` text NOT NULL,
	`source_hash` text NOT NULL,
	`payload` text NOT NULL
);
