ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'worker';

UPDATE users SET role = 'worker' WHERE role IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

COMMENT ON COLUMN users.role IS 'Роль пользователя: admin (администратор) или worker (сотрудник)';