-- 安全的设置表更新脚本
-- 只执行需要的部分，避免重复创建

-- 检查并创建settings表（如果不存在）
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 检查并创建触发器（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_settings_updated_at'
    ) THEN
        CREATE TRIGGER update_settings_updated_at
            BEFORE UPDATE ON settings
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 启用行级安全策略（如果未启用）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'settings' AND relrowsecurity = true
    ) THEN
        ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 检查并创建策略（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'settings' 
        AND policyname = 'Allow all operations on settings'
    ) THEN
        CREATE POLICY "Allow all operations on settings" ON settings
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 插入默认设置（如果不存在）
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

-- 验证数据插入
SELECT 'Settings table created and populated successfully' as status;
SELECT COUNT(*) as settings_count FROM settings;
