CREATE DATABASE IF NOT EXISTS eval_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eval_db;

DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL,
  emp_score INT DEFAULT NULL,
  boss_score INT DEFAULT NULL,
  dir_score INT DEFAULT NULL,
  file_url VARCHAR(255) DEFAULT NULL
);

INSERT INTO users (username, password, name, role, emp_score, boss_score, dir_score, file_url) VALUES
('emp1', '1234', 'สมชาย ใจดี', 'employee', NULL, NULL, NULL, NULL),
('emp2', '1234', 'สมหญิง สดใส', 'employee', NULL, NULL, NULL, NULL),
('emp3', '1234', 'ประสิทธิ์ ขยัน', 'employee', NULL, NULL, NULL, NULL),
('emp4', '1234', 'วรรณา มีสุข', 'employee', NULL, NULL, NULL, NULL),
('boss', '1234', 'หัวหน้าสมศักดิ์', 'boss', NULL, NULL, NULL, NULL),
('dir', '1234', 'ผอ.เกรียงไกร', 'director', NULL, NULL, NULL, NULL);
