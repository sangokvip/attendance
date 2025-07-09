-- 安全更新费用设置模板表（避免重复创建）

-- 创建表（如果不存在）
CREATE TABLE IF NOT EXISTS settings_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_global BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_settings_templates_user_id ON settings_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_templates_is_global ON settings_templates(is_global);
CREATE INDEX IF NOT EXISTS idx_settings_templates_name ON settings_templates(name);

-- 启用RLS（如果未启用）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'settings_templates' AND relrowsecurity = true
    ) THEN
        ALTER TABLE settings_templates ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 创建策略（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'settings_templates' 
        AND policyname = 'Allow all operations on settings_templates'
    ) THEN
        CREATE POLICY "Allow all operations on settings_templates" ON settings_templates 
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 创建触发器（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_settings_templates_updated_at'
    ) THEN
        CREATE TRIGGER update_settings_templates_updated_at
            BEFORE UPDATE ON settings_templates
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 清理可能存在的预设模板（如果您不需要的话）
-- DELETE FROM settings_templates WHERE is_global = true;

-- 验证创建结果
SELECT 'Settings templates table updated successfully' as status;
SELECT COUNT(*) as template_count FROM settings_templates;
SELECT name, description, is_global FROM settings_templates ORDER BY created_at DESC;
