'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { EmployeeService } from '@/lib/database'
import { Employee } from '@/lib/supabase'
import { AuthService } from '@/lib/auth'
import AuthGuard from '@/components/AuthGuard'
import Navbar from '@/components/Navbar'

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    loadEmployees()
    checkAdminStatus()
  }, [])

  const loadEmployees = async () => {
    try {
      const data = await EmployeeService.getAll()
      setEmployees(data)
    } catch (error) {
      console.error('加载员工列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAdminStatus = () => {
    setIsAdmin(AuthService.isAdmin())
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <Navbar currentPage="home" />

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 欢迎区域 */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">欢迎使用KTV考勤系统</h2>
              <p className="text-gray-600 mb-4">
                管理员工考勤，自动计算工资和利润，让您的业务管理更加高效。
              </p>

              {/* 调试信息 - 临时显示 */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">调试信息：</h3>
                  <div className="text-xs text-yellow-700">
                    <div>是否为管理员: {isAdmin ? '是' : '否'}</div>
                    <div>当前用户: {typeof window !== 'undefined' ? localStorage.getItem('currentUser') : '服务端渲染'}</div>
                  </div>
                </div>
              )}
              <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
                <Link
                  href="/employees"
                  className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg border border-blue-200 transition-colors"
                >
                  <div className="text-blue-600 font-medium">员工管理</div>
                  <div className="text-blue-500 text-sm">添加、编辑员工信息</div>
                </Link>
                <Link
                  href="/attendance"
                  className="bg-green-50 hover:bg-green-100 p-4 rounded-lg border border-green-200 transition-colors"
                >
                  <div className="text-green-600 font-medium">考勤录入</div>
                  <div className="text-green-500 text-sm">记录每日考勤和陪客</div>
                </Link>
                <Link
                  href="/reports"
                  className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg border border-purple-200 transition-colors"
                >
                  <div className="text-purple-600 font-medium">报表统计</div>
                  <div className="text-purple-500 text-sm">查看收入和利润分析</div>
                </Link>
                <Link
                  href="/salary"
                  className="bg-orange-50 hover:bg-orange-100 p-4 rounded-lg border border-orange-200 transition-colors"
                >
                  <div className="text-orange-600 font-medium">工资结算</div>
                  <div className="text-orange-500 text-sm">管理员工工资发放</div>
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/users"
                    className="bg-red-50 hover:bg-red-100 p-4 rounded-lg border border-red-200 transition-colors"
                  >
                    <div className="text-red-600 font-medium">🔧 用户管理</div>
                    <div className="text-red-500 text-sm">管理系统用户账户（管理员专用）</div>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* 员工概览 */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">员工概览</h3>
              {loading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <div className="ml-2 text-gray-600">加载中...</div>
                </div>
              ) : employees.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employees.map((employee) => (
                    <div key={employee.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">
                        加入时间: {new Date(employee.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">还没有员工信息</div>
                  <Link
                    href="/employees"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    添加第一个员工
                  </Link>
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
