CREATE TABLE `products` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100),
	`price` int NOT NULL,
	`discount` int NOT NULL DEFAULT 0,
	`stock` int NOT NULL,
	`variant` varchar(100),
	`description` text,
	`image_base64` longtext,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`qty` int NOT NULL,
	`total_price` int NOT NULL,
	`payment_method` varchar(100),
	`status` enum('pending','success','failed') NOT NULL DEFAULT 'pending',
	`credential_data` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` text NOT NULL,
	`whatsapp` varchar(50),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;