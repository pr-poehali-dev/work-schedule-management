CREATE TABLE workers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) DEFAULT 'Сотрудник',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE time_entries (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER REFERENCES workers(id),
    worker_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    hours DECIMAL(4, 2) NOT NULL CHECK (hours > 0 AND hours <= 24),
    location VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE requests (
    id SERIAL PRIMARY KEY,
    worker_name VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'processing', 'completed')),
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_time_entries_worker ON time_entries(worker_name);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_chat_created ON chat_messages(created_at);