-- Add health check and monitoring tables for better observability

-- Create health_checks table for storing historical health data
CREATE TABLE IF NOT EXISTS health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status VARCHAR(20) NOT NULL,
  database_status VARCHAR(10) NOT NULL,
  database_latency INTEGER,
  api_uptime FLOAT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_health_checks_checked_at ON health_checks(checked_at DESC);

-- Create error_logs table for tracking application errors
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_code VARCHAR(50),
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  request_path TEXT,
  request_method VARCHAR(10),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_code ON error_logs(error_code);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);

COMMENT ON TABLE health_checks IS 'Stores historical health check data for monitoring';
COMMENT ON TABLE error_logs IS 'Stores application errors for debugging and monitoring';
