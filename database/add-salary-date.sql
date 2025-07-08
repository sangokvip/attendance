-- 为员工表添加工资结算日期字段
-- 如果字段不存在则添加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'last_salary_date'
    ) THEN
        ALTER TABLE employees ADD COLUMN last_salary_date DATE DEFAULT NULL;
    END IF;
END $$;

-- 验证字段添加成功
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'employees' 
ORDER BY ordinal_position;
