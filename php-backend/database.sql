-- Database Schema for Partes App
-- Helper: Use utf8mb4 for full unicode support

CREATE DATABASE IF NOT EXISTS partes_app_db;
USE partes_app_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- In production, use password_hash()
    role VARCHAR(50) DEFAULT 'user',
    user_metadata TEXT, -- JSON string
    avatar_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Partes Table
CREATE TABLE IF NOT EXISTS partes (
    id BIGINT PRIMARY KEY, -- Using BIGINT for timestamp-based IDs
    type VARCHAR(100),
    description TEXT,
    status VARCHAR(50) DEFAULT 'ABIERTO',
    start_date DATETIME, -- Maps to start_date or created_at
    user_id VARCHAR(50),
    created_by VARCHAR(255),
    client_id VARCHAR(50),
    pdf_file VARCHAR(500), -- Path to file
    pdf_file_signed VARCHAR(500), -- Path to signed file
    closed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- Actuaciones Table
CREATE TABLE IF NOT EXISTS actuaciones (
    id BIGINT PRIMARY KEY,
    parte_id BIGINT NOT NULL,
    type VARCHAR(100),
    description TEXT,
    date DATETIME,
    duration INT DEFAULT 0,
    user VARCHAR(255), -- Name of the user/technician
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parte_id) REFERENCES partes(id) ON DELETE CASCADE
);

-- Verifications (for code codes)
CREATE TABLE IF NOT EXISTS verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    expires BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
