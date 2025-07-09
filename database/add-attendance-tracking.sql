-- 为考勤表添加录入用户追踪字段

-- 添加录入用户ID字段
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'created_by_user_id'
    ) THEN
        ALTER TABLE attendance ADD COLUMN created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 添加最后修改用户ID字段
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'updated_by_user_id'
    ) THEN
        ALTER TABLE attendance ADD COLUMN updated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_attendance_created_by_user_id ON attendance(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_updated_by_user_id ON attendance(updated_by_user_id);

-- 验证字段添加成功
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'attendance' 
AND column_name IN ('created_by_user_id', 'updated_by_user_id')
ORDER BY column_name;
