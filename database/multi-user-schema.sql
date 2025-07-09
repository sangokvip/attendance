-- 多用户管理系统数据库表结构

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'admin' 或 'user'
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- 用户有效期
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- 为现有表添加用户关联字段
-- 员工表添加用户ID
ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- 考勤记录表添加用户ID（通过员工关联）
-- 不需要直接添加，通过员工表的user_id关联

-- 设置表添加用户ID（每个用户可以有自己的设置）
ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE DEFAULT NULL;

-- 为users表创建更新时间戳触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略（RLS）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 创建用户表策略
-- 管理员可以查看所有用户
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid()::integer 
            AND u.role = 'admin' 
            AND u.is_active = true
        )
    );

-- 管理员可以管理所有用户
CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid()::integer 
            AND u.role = 'admin' 
            AND u.is_active = true
        )
    );

-- 用户可以查看自己的信息
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id = auth.uid()::integer);

-- 更新员工表策略：用户只能访问自己的员工
DROP POLICY IF EXISTS "Allow all operations on employees" ON employees;
CREATE POLICY "Users can manage own employees" ON employees
    FOR ALL USING (
        user_id = auth.uid()::integer 
        OR EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid()::integer 
            AND u.role = 'admin' 
            AND u.is_active = true
        )
    );

-- 更新考勤表策略：用户只能访问自己员工的考勤
DROP POLICY IF EXISTS "Allow all operations on attendance" ON attendance;
CREATE POLICY "Users can manage own attendance" ON attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.id = attendance.employee_id 
            AND (
                e.user_id = auth.uid()::integer 
                OR EXISTS (
                    SELECT 1 FROM users u 
                    WHERE u.id = auth.uid()::integer 
                    AND u.role = 'admin' 
                    AND u.is_active = true
                )
            )
        )
    );

-- 更新设置表策略：用户只能访问自己的设置
DROP POLICY IF EXISTS "Allow all operations on settings" ON settings;
CREATE POLICY "Users can manage own settings" ON settings
    FOR ALL USING (
        user_id = auth.uid()::integer 
        OR user_id IS NULL -- 全局设置
        OR EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid()::integer 
            AND u.role = 'admin' 
            AND u.is_active = true
        )
    );

-- 创建默认管理员用户（密码：admin123）
-- 注意：这里使用简单的哈希，生产环境应该使用更安全的方法
INSERT INTO users (username, password_hash, display_name, role, is_active) VALUES 
    ('admin', '$2b$10$rOzJqQZQXQXQXQXQXQXQXu', '系统管理员', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- 为现有的全局设置添加NULL user_id（表示全局设置）
UPDATE settings SET user_id = NULL WHERE user_id IS NULL;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
