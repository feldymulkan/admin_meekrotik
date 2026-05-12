-- Create databases
CREATE DATABASE IF NOT EXISTS admin_db;
CREATE DATABASE IF NOT EXISTS mikhmon;

-- Admin DB tables are handled by SeaORM migrations, 
-- but we can pre-create the admin_users table if we want.
-- However, SeaORM Migrator::up will do it.

-- Mikhmon DB setup
USE mikhmon;

CREATE TABLE IF NOT EXISTS `users` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `unique_id` varchar(50) DEFAULT NULL,
    `username` varchar(255) NOT NULL,
    `password` varchar(255) NOT NULL,
    `is_active` tinyint(1) DEFAULT 1,
    `theme` varchar(50) DEFAULT 'default',
    `themecolor` varchar(50) DEFAULT 'blue',
    `lang` varchar(10) DEFAULT 'en',
    `created_date` varchar(20) DEFAULT NULL,
    `expired_date` varchar(20) DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample user for testing
INSERT IGNORE INTO `users` (`unique_id`, `username`, `password`, `is_active`) 
VALUES ('user123', 'testuser', 'testpass', 1);

-- Grant privileges to the app user for the mikhmon database
-- User 'pepadu' is created by docker-compose environment variables
GRANT ALL PRIVILEGES ON mikhmon.* TO 'pepadu'@'%';
FLUSH PRIVILEGES;
