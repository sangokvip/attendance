'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { EmployeeService } from '@/lib/database'
import { Employee } from '@/lib/supabase'
import AuthGuard from '@/components/AuthGuard'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const data = await EmployeeService.getAll()
      setEmployees(data)
    } catch (error) {
      console.error('加载员工列表失败:', error)
      setError('加载员工列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmployeeName.trim()) {
      setError('请输入员工姓名')
      return
    }

    try {
      await EmployeeService.create(newEmployeeName.trim())
      setNewEmployeeName('')
      setShowAddForm(false)
      setError('')
      await loadEmployees()
    } catch (error: unknown) {
      console.error('添加员工失败:', error)
      const errorMessage = error instanceof Error ? error.message : ''
      const errorCode = (error as { code?: string })?.code
      if (errorMessage?.includes('duplicate') || errorCode === '23505') {
        setError('员工姓名已存在')
      } else {
        setError('添加员工失败')
      }
    }
  }

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmployee || !newEmployeeName.trim()) {
      setError('请输入员工姓名')
      return
    }

    try {
      await EmployeeService.update(editingEmployee.id, newEmployeeName.trim())
      setEditingEmployee(null)
      setNewEmployeeName('')
      setError('')
      await loadEmployees()
    } catch (error: unknown) {
      console.error('更新员工失败:', error)
      const errorMessage = error instanceof Error ? error.message : ''
      const errorCode = (error as { code?: string })?.code
      if (errorMessage?.includes('duplicate') || errorCode === '23505') {
        setError('员工姓名已存在')
      } else {
        setError('更新员工失败')
      }
    }
  }

  const handleDeleteEmployee = async (employee: Employee) => {
    if (!confirm(`确定要删除员工 "${employee.name}" 吗？这将同时删除该员工的所有考勤记录。`)) {
      return
    }

    try {
      await EmployeeService.delete(employee.id)
      await loadEmployees()
    } catch (error) {
      console.error('删除员工失败:', error)
      setError('删除员工失败')
    }
  }

  const startEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setNewEmployeeName(employee.name)
    setShowAddForm(false)
    setError('')
  }

  const cancelEdit = () => {
    setEditingEmployee(null)
    setNewEmployeeName('')
    setError('')
  }

  const startAdd = () => {
    setShowAddForm(true)
    setEditingEmployee(null)
    setNewEmployeeName('')
    setError('')
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
                KTV考勤系统
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/employees"
                className="text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                员工管理
              </Link>
              <Link
                href="/attendance"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                考勤录入
              </Link>
              <Link
                href="/reports"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                报表统计
              </Link>
              <Link
                href="/settings"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                系统设置
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 页面标题和添加按钮 */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">员工管理</h1>
            <button
              onClick={startAdd}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              添加员工
            </button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* 添加/编辑表单 */}
          {(showAddForm || editingEmployee) && (
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingEmployee ? '编辑员工' : '添加新员工'}
                </h3>
                <form onSubmit={editingEmployee ? handleEditEmployee : handleAddEmployee}>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700 mb-1">
                        员工姓名
                      </label>
                      <input
                        type="text"
                        id="employeeName"
                        value={newEmployeeName}
                        onChange={(e) => setNewEmployeeName(e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="请输入员工姓名"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {editingEmployee ? '更新' : '添加'}
                      </button>
                      <button
                        type="button"
                        onClick={editingEmployee ? cancelEdit : () => setShowAddForm(false)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 员工列表 */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">员工列表</h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <div className="mt-2 text-gray-600">加载中...</div>
                </div>
              ) : employees.length > 0 ? (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          姓名
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          加入时间
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employees.map((employee) => (
                        <tr key={employee.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {employee.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(employee.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => startEdit(employee)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(employee)}
                              className="text-red-600 hover:text-red-900"
                            >
                              删除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">还没有员工信息</div>
                  <button
                    onClick={startAdd}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    添加第一个员工
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
