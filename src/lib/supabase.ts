import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库类型定义
export interface User {
  id: number
  username: string
  password_hash: string
  display_name: string
  role: 'admin' | 'user'
  is_active: boolean
  expires_at: string | null
  created_at: string
  updated_at: string
  created_by: number | null
}

export interface SettingsTemplate {
  id: number
  name: string
  description: string | null
  template_data: {
    base_salary: number
    first_client_bonus: number
    additional_client_bonus: number
    no_client_salary: number
    peter_first_client: number
    peter_additional_client: number
  }
  user_id: number | null
  is_global: boolean
  created_at: string
  updated_at: string
}

export interface Employee {
  id: number
  name: string
  last_salary_date: string | null
  user_id: number
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: number
  employee_id: number
  date: string
  is_working: boolean
  client_count: number
  base_salary: number
  commission: number
  peter_commission: number
  total_salary: number
  boss_profit: number
  created_by_user_id: number | null
  updated_by_user_id: number | null
  created_at: string
  updated_at: string
  employee?: Employee
  created_by_user?: User
  updated_by_user?: User
}

export interface Setting {
  id: number
  key: string
  value: number
  description: string
  user_id: number | null
  created_at: string
  updated_at: string
}

// 业务常量
export const BUSINESS_RULES = {
  CLIENT_PAYMENT: 900,        // 客人付款
  KTV_FEE: 120,              // KTV费用
  BASE_SALARY_WITH_CLIENT: 350,  // 有客人时的基本工资
  BASE_SALARY_NO_CLIENT: 100,    // 无客人时的基本工资
  FIRST_CLIENT_COMMISSION: 200,  // 第一次陪客提成
  ADDITIONAL_CLIENT_COMMISSION: 300, // 第二次及以后陪客提成
  PETER_FIRST_CLIENT: 50,        // Peter第一次提成
  PETER_ADDITIONAL_CLIENT: 100,  // Peter第二次及以后提成
}
