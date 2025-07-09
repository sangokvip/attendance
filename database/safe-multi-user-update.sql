-- 安全的多用户系统更新脚本
-- 只执行需要的部分，避免重复创建

-- 1. 创建用户表（如果不存在）
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- 2. 为现有表添加用户关联字段（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE employees ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE settings ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE DEFAULT NULL;
    END IF;
END $$;

-- 3. 创建触发器（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_users_updated_at'
    ) THEN
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 4. 启用RLS（如果未启用）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'users' AND relrowsecurity = true
    ) THEN
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 5. 创建策略（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Allow all operations on users'
    ) THEN
        CREATE POLICY "Allow all operations on users" ON users 
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 6. 插入默认管理员用户（如果不存在）
INSERT INTO users (username, password_hash, display_name, role, is_active) VALUES 
    ('admin', '$2b$10$J9ZygSVGvHfqhRbKKGW5aekfexA5jlSO4jAzFKhh45LE2/gVgCJtq', '系统管理员', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- 7. 更新现有设置为全局设置
UPDATE settings SET user_id = NULL WHERE user_id IS NULL;

-- 8. 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- 验证结果
SELECT 'Multi-user system setup completed successfully' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT username, display_name, role, is_active FROM users;
