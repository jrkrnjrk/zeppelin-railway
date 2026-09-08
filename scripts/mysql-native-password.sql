-- Railway MySQL 8 often uses caching_sha2_password.
-- Zeppelin's client still expects mysql_native_password on many builds.
-- Run in the MySQL service Query tab. Replace CHANGE_ME with MYSQLPASSWORD.

ALTER USER 'root' IDENTIFIED WITH mysql_native_password BY 'CHANGE_ME';
FLUSH PRIVILEGES;
