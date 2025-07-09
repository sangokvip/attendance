-- 为员工表添加模板字段

-- 添加template_id字段到employees表
ALTER TABLE employees 
ADD COLUMN template_id INTEGER REFERENCES settings_templates(id) ON DELETE SET NULL;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_employees_template_id ON employees(template_id);

-- 验证修改
SELECT 'Employee template field added successfully' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'employees' 
ORDER BY ordinal_position;
