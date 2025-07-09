'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { UserService, CreateUserData } from '@/lib/auth'
import { User } from '@/lib/supabase'
import AuthGuard from '@/components/AuthGuard'

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<CreateUserData>({
    username: '',
    password: '',
    displayName: '',
    role: 'user',
    expiresAt: null
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await UserService.getAllUsers()
      setUsers(data)
      setError('')
    } catch (error) {
      console.error('加载用户列表失败:', error)
      setError('加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.username.trim() || !formData.displayName.trim()) {
      setError('请填写用户名和显示名称')
      return
    }

    if (!editingUser && !formData.password.trim()) {
      setError('请设置密码')
      return
    }

    try {
      if (editingUser) {
        await UserService.updateUser(editingUser.id, formData)
      } else {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
        await UserService.createUser(formData, currentUser.id)
      }
      
      resetForm()
      await loadUsers()
      setError('')
    } catch (error: unknown) {
      console.error('保存用户失败:', error)
      const errorMessage = error instanceof Error ? error.message : '保存用户失败'
      setError(errorMessage)
    }
  }

  const handleToggleStatus = async (userId: number, isActive: boolean) => {
    try {
      await UserService.toggleUserStatus(userId, isActive)
      await loadUsers()
    } catch (error) {
      console.error('更新用户状态失败:', error)
      setError('更新用户状态失败')
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`确定要删除用户 "${user.display_name}" 吗？这将删除该用户的所有数据。`)) {
      return
    }

    try {
      await UserService.deleteUser(user.id)
      await loadUsers()
    } catch (error) {
      console.error('删除用户失败:', error)
      setError('删除用户失败')
    }
  }

  const startEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      password: '',
      displayName: user.display_name,
      role: user.role,
      expiresAt: user.expires_at
    })
    setShowAddForm(true)
    setError('')
  }

  const resetForm = () => {
    setEditingUser(null)
    setFormData({
      username: '',
      password: '',
      displayName: '',
      role: 'user',
      expiresAt: null
    })
    setShowAddForm(false)
    setError('')
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '永久'
    return new Date(dateString).toLocaleDateString()
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* 导航栏 */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
                  KTV考勤系统 - 用户管理
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  返回首页
                </Link>
                <button
                  onClick={() => {
                    if (confirm('确定要退出登录吗？')) {
                      localStorage.clear()
                      window.location.href = '/login'
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium border border-gray-300 hover:border-gray-400"
                >
                  退出
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* 主要内容 */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* 页面标题和添加按钮 */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                添加用户
              </button>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* 添加/编辑表单 */}
            {showAddForm && (
              <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingUser ? '编辑用户' : '添加新用户'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          用户名
                        </label>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({...formData, username: e.target.value})}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="请输入用户名"
                          required
                          disabled={!!editingUser}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          显示名称
                        </label>
                        <input
                          type="text"
                          value={formData.displayName}
                          onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="请输入显示名称"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          密码 {editingUser && '(留空则不修改)'}
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="请输入密码"
                          required={!editingUser}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          角色
                        </label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({...formData, role: e.target.value as 'admin' | 'user'})}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="user">普通用户</option>
                          <option value="admin">管理员</option>
                        </select>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          有效期 (留空表示永久有效)
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.expiresAt || ''}
                          onChange={(e) => setFormData({...formData, expiresAt: e.target.value || null})}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {editingUser ? '更新' : '添加'}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        取消
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 用户列表 */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">用户列表</h3>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <div className="mt-2 text-gray-600">加载中...</div>
                  </div>
                ) : users.length > 0 ? (
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            用户信息
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            角色
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            状态
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            有效期
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.display_name}</div>
                                <div className="text-sm text-gray-500">@{user.username}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.role === 'admin' ? '管理员' : '普通用户'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.is_active && !isExpired(user.expires_at)
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.is_active 
                                  ? isExpired(user.expires_at) ? '已过期' : '正常'
                                  : '已禁用'
                                }
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(user.expires_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => startEdit(user)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => handleToggleStatus(user.id, !user.is_active)}
                                className={`mr-4 ${
                                  user.is_active 
                                    ? 'text-red-600 hover:text-red-900' 
                                    : 'text-green-600 hover:text-green-900'
                                }`}
                              >
                                {user.is_active ? '禁用' : '启用'}
                              </button>
                              {user.role !== 'admin' && (
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  删除
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-4">还没有用户</div>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      添加第一个用户
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
