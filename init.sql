CREATE DATABASE IF NOT EXISTS admin_db;
USE admin_db;

CREATE TABLE `admin_users` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `username` varchar(255) NOT NULL,
    `password_hash` varchar(255) NOT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Password awal adalah 'admin123' (sudah di-hash dengan bcrypt)
INSERT INTO `admin_users` (`username`, `password_hash`, `is_active`) 
VALUES ('admin', '$2a$12$R9h/lIPzHZluvTFyvn.p8uW6XzvP7Gj7X5zB5zB5zB5zB5zB5zB5z', 1);
