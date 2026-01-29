-- =========================================
-- Tenant Manager Database Schema
-- PostgreSQL
-- =========================================

-- Встановлюємо часову зону
SET timezone = 'UTC';

-- ===============================
-- Користувачі
-- ===============================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'owner', -- owner, admin, tenant
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- Об'єкти нерухомості
-- ===============================
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE, -- Власник об'єкта
    address VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- Орендарі
-- ===============================
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    property_id INT REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50),
    contract_start DATE NOT NULL DEFAULT CURRENT_DATE,
    contract_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- Транзакції
-- ===============================
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    property_id INT REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id INT REFERENCES tenants(id) ON DELETE SET NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL, -- хто додав транзакцію
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(50) NOT NULL, -- rent, repair, utilities, tax
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- Лічильники (meters)
-- ===============================
CREATE TABLE IF NOT EXISTS meters (
    id SERIAL PRIMARY KEY,
    property_id INT REFERENCES properties(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('water', 'electricity', 'gas')),
    value DECIMAL(12,2) NOT NULL,
    previous_reading DECIMAL(12,2),
    unit VARCHAR(20) DEFAULT '',
    reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- Сповіщення
-- ===============================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'general', -- finance, warning, general
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- Функції та тригери
-- =====================================

-- 1. Автооновлення updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_property_modtime
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_tenant_modtime
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- 2. Сповіщення про нову транзакцію
CREATE OR REPLACE FUNCTION create_finance_notification()
RETURNS TRIGGER AS $$
DECLARE
    owner_id INT;
BEGIN
    SELECT user_id INTO owner_id FROM properties WHERE id = NEW.property_id;

    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
        owner_id,
        'finance',
        'Нова транзакція',
        CONCAT('Додано ', NEW.type, ' на суму ', NEW.amount, ' для об’єкта ID ', NEW.property_id)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE PROCEDURE create_finance_notification();

-- 3. Сповіщення про новий лічильник (опціонально)
CREATE OR REPLACE FUNCTION create_meter_notification()
RETURNS TRIGGER AS $$
DECLARE
    owner_id INT;
BEGIN
    SELECT user_id INTO owner_id FROM properties WHERE id = NEW.property_id;

    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
        owner_id,
        'general',
        'Нові показники лічильника',
        CONCAT('Додано показник ', NEW.type, ' = ', NEW.value, ' для об’єкта ID ', NEW.property_id)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_meter_insert
AFTER INSERT ON meters
FOR EACH ROW
EXECUTE PROCEDURE create_meter_notification();
