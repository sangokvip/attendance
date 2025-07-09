import { supabase, User } from './supabase'
import bcrypt from 'bcryptjs'

export interface LoginCredentials {
  username: string
  password: string
}

export interface CreateUserData {
  username: string
  password: string
  displayName: string
  role: 'admin' | 'user'
  expiresAt?: string | null
}

export interface AuthUser {
  id: number
  username: string
  displayName: string
  role: 'admin' | 'user'
  isActive: boolean
  expiresAt: string | null
}

export class AuthService {
  // 用户登录
  static async login(credentials: LoginCredentials): Promise<AuthUser> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', credentials.username)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      throw new Error('用户名或密码错误')
    }

    // 检查用户是否过期
    if (user.expires_at && new Date(user.expires_at) < new Date()) {
      throw new Error('账户已过期，请联系管理员')
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash)
    if (!isValidPassword) {
      throw new Error('用户名或密码错误')
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      isActive: user.is_active,
      expiresAt: user.expires_at
    }
  }

  // 检查用户权限
  static async checkUserPermissions(userId: number): Promise<{ canEdit: boolean; isAdmin: boolean; user: AuthUser }> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      throw new Error('用户不存在或已被禁用')
    }

    const now = new Date()
    const isExpired = user.expires_at && new Date(user.expires_at) < now
    const canEdit = !isExpired
    const isAdmin = user.role === 'admin'

    return {
      canEdit,
      isAdmin,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        isActive: user.is_active,
        expiresAt: user.expires_at
      }
    }
  }

  // 获取当前用户信息
  static getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null
    
    const userStr = localStorage.getItem('currentUser')
    if (!userStr) return null
    
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }

  // 设置当前用户
  static setCurrentUser(user: AuthUser): void {
    if (typeof window === 'undefined') return
    
    localStorage.setItem('currentUser', JSON.stringify(user))
    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('authTime', Date.now().toString())
  }

  // 清除用户登录状态
  static logout(): void {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem('currentUser')
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('authTime')
  }

  // 检查是否为管理员
  static isAdmin(): boolean {
    const user = this.getCurrentUser()
    return user?.role === 'admin'
  }

  // 检查用户是否可以编辑
  static canEdit(): boolean {
    const user = this.getCurrentUser()
    if (!user) return false
    
    if (user.role === 'admin') return true
    
    if (user.expiresAt && new Date(user.expiresAt) < new Date()) {
      return false
    }
    
    return true
  }
}

// 用户管理服务
export class UserService {
  // 获取所有用户（仅管理员）
  static async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // 创建用户（仅管理员）
  static async createUser(userData: CreateUserData, createdBy: number): Promise<User> {
    // 哈希密码
    const passwordHash = await bcrypt.hash(userData.password, 10)

    const { data, error } = await supabase
      .from('users')
      .insert({
        username: userData.username,
        password_hash: passwordHash,
        display_name: userData.displayName,
        role: userData.role,
        expires_at: userData.expiresAt,
        created_by: createdBy
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 更新用户（仅管理员）
  static async updateUser(userId: number, updates: Partial<CreateUserData>): Promise<User> {
    const updateData: any = {
      display_name: updates.displayName,
      role: updates.role,
      expires_at: updates.expiresAt
    }

    // 如果提供了新密码，则哈希它
    if (updates.password) {
      updateData.password_hash = await bcrypt.hash(updates.password, 10)
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 禁用/启用用户（仅管理员）
  static async toggleUserStatus(userId: number, isActive: boolean): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 删除用户（仅管理员）
  static async deleteUser(userId: number): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) throw error
  }
}
