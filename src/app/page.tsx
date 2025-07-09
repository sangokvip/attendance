'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { EmployeeService } from '@/lib/database'
import { Employee } from '@/lib/supabase'
import { AuthService } from '@/lib/auth'
import { IncomeStatsService, UserIncomeStats, IncomeStats } from '@/lib/income-stats'
import AuthGuard from '@/components/AuthGuard'
import Navbar from '@/components/Navbar'

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userIncomeStats, setUserIncomeStats] = useState<UserIncomeStats | null>(null)
  const [todayStats, setTodayStats] = useState<IncomeStats | null>(null)
  const [monthStats, setMonthStats] = useState<IncomeStats | null>(null)
  const [incomeLoading, setIncomeLoading] = useState(true)

  useEffect(() => {
    loadEmployees()
    checkAdminStatus()
    loadIncomeStats()
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

  const loadIncomeStats = async () => {
    try {
      setIncomeLoading(true)
      const [userStats, todayData, monthData] = await Promise.all([
        IncomeStatsService.getCurrentUserIncomeStats(),
        IncomeStatsService.getTodayIncomeStats(),
        IncomeStatsService.getThisMonthIncomeStats()
      ])
      setUserIncomeStats(userStats)
      setTodayStats(todayData)
      setMonthStats(monthData)
    } catch (error) {
      console.error('加载收入统计失败:', error)
    } finally {
      setIncomeLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
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

          {/* 收入统计 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">收入统计</h3>
            {incomeLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <div className="ml-2 text-gray-600">加载收入数据中...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* 当前用户Peter收入 */}
                <div className="bg-blue-50 overflow-hidden shadow rounded-lg border border-blue-200">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">P</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-blue-600 truncate">我的总收入 (Peter)</dt>
                          <dd className="text-xl font-bold text-blue-900">
                            {userIncomeStats ? formatCurrency(userIncomeStats.userPeterCommission) : '¥0'}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 所有员工总收入 */}
                <div className="bg-green-50 overflow-hidden shadow rounded-lg border border-green-200">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">员</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-green-600 truncate">员工总收入</dt>
                          <dd className="text-xl font-bold text-green-900">
                            {userIncomeStats ? formatCurrency(userIncomeStats.totalEmployeeSalary) : '¥0'}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Adam收入 - 只有管理员可见 */}
                {isAdmin && userIncomeStats?.totalAdamIncome !== undefined && (
                  <div className="bg-purple-50 overflow-hidden shadow rounded-lg border border-purple-200">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">A</span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-purple-600 truncate">Adam总收入</dt>
                            <dd className="text-xl font-bold text-purple-900">
                              {formatCurrency(userIncomeStats.totalAdamIncome)}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 本月统计 */}
                <div className="bg-orange-50 overflow-hidden shadow rounded-lg border border-orange-200">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">月</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-orange-600 truncate">本月客人数</dt>
                          <dd className="text-xl font-bold text-orange-900">
                            {monthStats ? monthStats.totalClients : 0} 人次
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 今日和本月对比 */}
            {!incomeLoading && todayStats && monthStats && (
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">今日 vs 本月统计</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">今日数据</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">客人数:</span>
                          <span className="text-sm font-medium">{todayStats.totalClients} 人次</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">员工收入:</span>
                          <span className="text-sm font-medium">{formatCurrency(todayStats.totalEmployeeSalary)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Peter收入:</span>
                          <span className="text-sm font-medium">{formatCurrency(todayStats.totalPeterCommission)}</span>
                        </div>
                        {isAdmin && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Adam收入:</span>
                            <span className="text-sm font-medium">{formatCurrency(todayStats.totalAdamIncome)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">本月累计</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">客人数:</span>
                          <span className="text-sm font-medium">{monthStats.totalClients} 人次</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">员工收入:</span>
                          <span className="text-sm font-medium">{formatCurrency(monthStats.totalEmployeeSalary)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Peter收入:</span>
                          <span className="text-sm font-medium">{formatCurrency(monthStats.totalPeterCommission)}</span>
                        </div>
                        {isAdmin && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Adam收入:</span>
                            <span className="text-sm font-medium">{formatCurrency(monthStats.totalAdamIncome)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{employee.name}</div>
                        {employee.template && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {employee.template.name}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        加入时间: {new Date(employee.created_at).toLocaleDateString()}
                      </div>
                      {!employee.template && (
                        <div className="text-xs text-gray-400 mt-1">使用全局设置</div>
                      )}
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
