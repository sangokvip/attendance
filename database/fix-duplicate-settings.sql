-- 修复重复设置项和清理系统模板的SQL脚本

-- 1. 删除重复的设置项，只保留标准的设置键名
DELETE FROM settings WHERE key NOT IN (
    'CLIENT_PAYMENT',
    'KTV_FEE', 
    'BASE_SALARY_WITH_CLIENT',
    'BASE_SALARY_NO_CLIENT',
    'FIRST_CLIENT_COMMISSION',
    'ADDITIONAL_CLIENT_COMMISSION',
    'PETER_FIRST_CLIENT',
    'PETER_ADDITIONAL_CLIENT'
);

-- 2. 确保所有必需的设置项都存在，如果不存在则创建
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

-- 3. 删除所有系统模板（全局模板）
DELETE FROM settings_templates WHERE is_global = true;

-- 4. 验证结果
SELECT 'Settings cleanup completed' as status;
SELECT key, value, description FROM settings ORDER BY key;
SELECT COUNT(*) as template_count, 
       SUM(CASE WHEN is_global THEN 1 ELSE 0 END) as global_templates,
       SUM(CASE WHEN NOT is_global THEN 1 ELSE 0 END) as user_templates
FROM settings_templates;
