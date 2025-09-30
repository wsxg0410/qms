-- 图片表
CREATE TABLE IF NOT EXISTS queues (
  id TEXT PRIMARY KEY,
  env TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','hang','doing','done','fail','out_times')),
  errorTimes INTEGER NOT NULL DEFAULT 0,
  data TEXT,
  result TEXT,
  config TEXT,
  execAt TEXT,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_env ON queues(env);
CREATE INDEX IF NOT EXISTS idx_status ON queues(status);
CREATE INDEX IF NOT EXISTS idx_execAt ON queues(execAt);
CREATE INDEX IF NOT EXISTS idx_createdAt ON queues(createdAt);
