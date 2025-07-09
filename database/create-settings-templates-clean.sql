-- 创建费用设置模板表（仅表结构，不包含预设模板）

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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_settings_templates_user_id ON settings_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_templates_is_global ON settings_templates(is_global);
CREATE INDEX IF NOT EXISTS idx_settings_templates_name ON settings_templates(name);

-- 启用RLS
ALTER TABLE settings_templates ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Allow all operations on settings_templates" ON settings_templates 
    FOR ALL USING (true) WITH CHECK (true);

-- 创建更新时间触发器
CREATE TRIGGER update_settings_templates_updated_at
    BEFORE UPDATE ON settings_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 验证创建结果
SELECT 'Settings templates table created successfully' as status;
SELECT COUNT(*) as template_count FROM settings_templates;
