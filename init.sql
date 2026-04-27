CREATE DATABASE IF NOT EXISTS admin_db;
USE admin_db;

CREATE TABLE `admin_users` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `username` varchar(255) NOT NULL,
    `password_hash` varchar(255) NOT NULL,
    `totp_secret` varchar(255) DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Note: Admin user will be automatically created by the backend application 
-- using ADMIN_USERNAME and ADMIN_PASSWORD environment variables if no users exist.

-- Note: Ensure mikhmon database 'users' table has 'created_date' and 'expired_date' columns (VARCHAR or DATE).
-- ALTER TABLE users ADD COLUMN created_date VARCHAR(20);
-- ALTER TABLE users ADD COLUMN expired_date VARCHAR(20);
