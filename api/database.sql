CREATE DATABASE IF NOT EXISTS velora_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE velora_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('admin', 'vendedor', 'client') NOT NULL DEFAULT 'client',
    status ENUM('ativo', 'pendente') NOT NULL DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendedor_id INT DEFAULT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    imagem_url VARCHAR(500) DEFAULT NULL,
    categoria VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendedor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE wallet (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    saldo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    saldo_bloqueado DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE rastreio_pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    localizacao VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT DEFAULT NULL,
    product_nome VARCHAR(255) DEFAULT NULL,
    preco DECIMAL(10,2) DEFAULT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    origem ENUM('local', 'api') NOT NULL DEFAULT 'local',
    imagem_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (user_id, product_id, origem)
) ENGINE=InnoDB;

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status ENUM('pendente', 'pago', 'processando', 'enviado', 'entregue', 'cancelado') NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT DEFAULT NULL,
    product_nome VARCHAR(255) NOT NULL,
    quantidade INT NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    origem ENUM('local', 'api') NOT NULL DEFAULT 'local',
    vendedor_id INT DEFAULT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (vendedor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Migração para BD existente
-- ALTER TABLE products ADD COLUMN stock INT NOT NULL DEFAULT 0 AFTER preco;
-- CREATE TABLE wallet (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL UNIQUE, saldo DECIMAL(10,2) NOT NULL DEFAULT 0.00, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);
-- RENAME TABLE cart TO cart_old;
-- CREATE TABLE cart (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, product_id INT DEFAULT NULL, product_nome VARCHAR(255) DEFAULT NULL, preco DECIMAL(10,2) DEFAULT NULL, quantidade INT NOT NULL DEFAULT 1, origem ENUM('local','api') NOT NULL DEFAULT 'local', imagem_url VARCHAR(500) DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, UNIQUE KEY unique_cart_item (user_id, product_id, origem));
-- ALTER TABLE order_items ADD COLUMN origem ENUM('local','api') NOT NULL DEFAULT 'local' AFTER preco;
-- ALTER TABLE order_items ADD COLUMN vendedor_id INT DEFAULT NULL AFTER origem;
-- ALTER TABLE order_items MODIFY COLUMN product_id INT NULL;
-- ALTER TABLE order_items DROP FOREIGN KEY order_items_ibfk_2;
-- ALTER TABLE order_items ADD FOREIGN KEY (vendedor_id) REFERENCES users(id) ON DELETE SET NULL;

-- Admin padrão (senha: admin123)
INSERT INTO users (nome, email, senha, tipo, status) VALUES
('Admin VELORA', 'admin@velora.ao', '$2y$10$VbZXKkKFFqa/6aG90M/CIO9me496BAJC3us/ZW.qwUncCghypaoTC', 'admin', 'ativo');

-- Carteira do admin
-- Migração para BD existente
-- ALTER TABLE wallet ADD COLUMN saldo_bloqueado DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER saldo;
-- CREATE TABLE rastreio_pedidos (id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, status VARCHAR(50) NOT NULL, descricao TEXT NOT NULL, localizacao VARCHAR(255) DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE) ENGINE=InnoDB;
-- ALTER TABLE orders MODIFY status ENUM('pendente','pago','processando','enviado','entregue','cancelado') NOT NULL DEFAULT 'pendente';

INSERT INTO wallet (user_id, saldo) SELECT id, 0 FROM users WHERE email = 'admin@velora.ao';
