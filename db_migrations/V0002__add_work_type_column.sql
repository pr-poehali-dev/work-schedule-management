ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS work_type VARCHAR(50) DEFAULT 'вывозка леса';

UPDATE time_entries SET work_type = 'вывозка леса' WHERE work_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_time_entries_worker_type ON time_entries(worker_name, work_type);