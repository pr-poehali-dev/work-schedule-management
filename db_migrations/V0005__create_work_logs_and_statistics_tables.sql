-- Создание таблицы для рабочих смен водителей
CREATE TABLE IF NOT EXISTS work_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    work_date DATE NOT NULL,
    work_hours DECIMAL(4,2) NOT NULL DEFAULT 0,
    stack_number VARCHAR(50),
    repair_hours DECIMAL(4,2) NOT NULL DEFAULT 0,
    idle_days INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, work_date)
);

-- Создание таблицы для периодов статистики (каждые 15 дней)
CREATE TABLE IF NOT EXISTS statistics_periods (
    id SERIAL PRIMARY KEY,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(start_date, end_date)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_work_logs_user_date ON work_logs(user_id, work_date DESC);
CREATE INDEX IF NOT EXISTS idx_work_logs_date ON work_logs(work_date DESC);
CREATE INDEX IF NOT EXISTS idx_statistics_periods_current ON statistics_periods(is_current) WHERE is_current = TRUE;

-- Создание первого текущего периода (15 дней с сегодня)
INSERT INTO statistics_periods (start_date, end_date, is_current)
VALUES (CURRENT_DATE, CURRENT_DATE + INTERVAL '15 days', TRUE)
ON CONFLICT DO NOTHING;