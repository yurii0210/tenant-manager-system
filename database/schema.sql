-- Додаємо розширення для роботи з часовими поясами (актуально для Enterprise)
SET timezone = 'UTC';

-- Таблиця об'єктів
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) NOT NULL,
    tenant_name VARCHAR(100),
    rent_amount DECIMAL(12, 2) NOT NULL, -- Збільшено точність для великих сум
    contract_end DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE, -- Додано прапорець активності
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблиця транзакцій
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(50) NOT NULL, -- Наприклад: 'rent', 'repair', 'tax', 'utilities'
    amount DECIMAL(12, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблиця лічильників
CREATE TABLE meters (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('water', 'electricity', 'gas')),
    value DECIMAL(12, 2) NOT NULL,
    reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
    previous_reading DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Автоматичне оновлення updated_at при зміні об'єкта (Функція для PostgreSQL)
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_property_modtime
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();