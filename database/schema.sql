-- KTV考勤系统数据库表结构

-- 员工表
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    last_salary_date DATE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 考勤记录表
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_working BOOLEAN NOT NULL DEFAULT false,
    client_count INTEGER NOT NULL DEFAULT 0 CHECK (client_count >= 0),
    base_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
    commission DECIMAL(10,2) NOT NULL DEFAULT 0,
    peter_commission DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
    boss_profit DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 确保每个员工每天只有一条记录
    UNIQUE(employee_id, date)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为employees表创建更新时间戳触发器
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为attendance表创建更新时间戳触发器
DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance;
CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略（RLS）
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有操作（因为这是个人使用的系统）
CREATE POLICY "Allow all operations on employees" ON employees
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on attendance" ON attendance
    FOR ALL USING (true) WITH CHECK (true);

-- 系统设置表
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为settings表创建更新时间戳触发器
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略（RLS）
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有操作
CREATE POLICY "Allow all operations on settings" ON settings
    FOR ALL USING (true) WITH CHECK (true);

-- 插入默认设置
INSERT INTO settings (key, value, description) VALUES
    ('CLIENT_PAYMENT', 900, '客人付款金额'),
    ('KTV_FEE', 120, 'KTV费用'),
    ('BASE_SALARY_WITH_CLIENT', 350, '有陪客时的基本工资'),
    ('BASE_SALARY_NO_CLIENT', 100, '无陪客时的基本工资'),
    ('FIRST_CLIENT_COMMISSION', 200, '第一次陪客提成'),
    ('ADDITIONAL_CLIENT_COMMISSION', 300, '第二次及以后陪客提成'),
    ('PETER_FIRST_CLIENT', 50, 'Peter第一次陪客收入'),
    ('PETER_ADDITIONAL_CLIENT', 100, 'Peter第二次及以后陪客收入')
ON CONFLICT (key) DO NOTHING;

-- 插入一些示例数据（可选）
INSERT INTO employees (name) VALUES
    ('小美'),
    ('小丽'),
    ('小芳')
ON CONFLICT (name) DO NOTHING;
