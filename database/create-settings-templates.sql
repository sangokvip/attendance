-- 创建费用设置模板表

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

-- 插入一些默认模板
INSERT INTO settings_templates (name, description, template_data, is_global) VALUES 
    ('标准模式', '默认的费用设置', '{
        "base_salary": 350,
        "first_client_bonus": 200,
        "additional_client_bonus": 300,
        "no_client_salary": 100,
        "peter_first_client": 50,
        "peter_additional_client": 100
    }', true),
    ('高提成模式', '提高陪客提成的设置', '{
        "base_salary": 350,
        "first_client_bonus": 250,
        "additional_client_bonus": 350,
        "no_client_salary": 100,
        "peter_first_client": 60,
        "peter_additional_client": 120
    }', true),
    ('保底模式', '提高基础工资的设置', '{
        "base_salary": 400,
        "first_client_bonus": 150,
        "additional_client_bonus": 250,
        "no_client_salary": 150,
        "peter_first_client": 40,
        "peter_additional_client": 80
    }', true)
ON CONFLICT DO NOTHING;

-- 验证创建结果
SELECT 'Settings templates table created successfully' as status;
SELECT COUNT(*) as template_count FROM settings_templates;
SELECT name, description, is_global FROM settings_templates ORDER BY id;
