'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AttendanceService } from '@/lib/database'
import { Attendance } from '@/lib/supabase'
import { formatCurrency } from '@/lib/salary-calculator'
import AuthGuard from '@/components/AuthGuard'

type ReportPeriod = 'day' | 'week' | 'month'

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // 设置默认日期范围
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    switch (period) {
      case 'day':
        setStartDate(todayStr)
        setEndDate(todayStr)
        break
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        setStartDate(weekStart.toISOString().split('T')[0])
        setEndDate(weekEnd.toISOString().split('T')[0])
        break
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        setStartDate(monthStart.toISOString().split('T')[0])
        setEndDate(monthEnd.toISOString().split('T')[0])
        break
    }
  }, [period])

  useEffect(() => {
    if (startDate && endDate) {
      loadReportData()
    }
  }, [startDate, endDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadReportData = async () => {
    try {
      setLoading(true)
      const data = await AttendanceService.getByDateRange(startDate, endDate)
      setAttendances(data)
      setError('')
    } catch (error) {
      console.error('加载报表数据失败:', error)
      setError('加载报表数据失败')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = () => {
    return attendances.reduce((totals, attendance) => {
      return {
        totalSalary: totals.totalSalary + Number(attendance.total_salary),
        totalPeterCommission: totals.totalPeterCommission + Number(attendance.peter_commission),
        totalBossProfit: totals.totalBossProfit + Number(attendance.boss_profit),
        totalClients: totals.totalClients + attendance.client_count,
        workingDays: totals.workingDays + (attendance.is_working ? 1 : 0),
        totalRevenue: totals.totalRevenue + (attendance.client_count * 900),
        totalKtvFee: totals.totalKtvFee + (attendance.client_count * 120)
      }
    }, {
      totalSalary: 0,
      totalPeterCommission: 0,
      totalBossProfit: 0,
      totalClients: 0,
      workingDays: 0,
      totalRevenue: 0,
      totalKtvFee: 0
    })
  }

  const getEmployeeStats = () => {
    const employeeMap = new Map()
    
    attendances.forEach(attendance => {
      const employeeName = attendance.employee?.name || '未知员工'
      if (!employeeMap.has(employeeName)) {
        employeeMap.set(employeeName, {
          name: employeeName,
          workingDays: 0,
          totalClients: 0,
          totalSalary: 0,
          totalCommission: 0
        })
      }
      
      const stats = employeeMap.get(employeeName)
      if (attendance.is_working) {
        stats.workingDays++
      }
      stats.totalClients += attendance.client_count
      stats.totalSalary += Number(attendance.total_salary)
      stats.totalCommission += Number(attendance.commission)
    })
    
    return Array.from(employeeMap.values()).sort((a, b) => b.totalSalary - a.totalSalary)
  }

  const getDailyStats = () => {
    const dailyMap = new Map()
    
    attendances.forEach(attendance => {
      const date = attendance.date
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          workingEmployees: 0,
          totalClients: 0,
          totalSalary: 0,
          totalBossProfit: 0
        })
      }
      
      const stats = dailyMap.get(date)
      if (attendance.is_working) {
        stats.workingEmployees++
      }
      stats.totalClients += attendance.client_count
      stats.totalSalary += Number(attendance.total_salary)
      stats.totalBossProfit += Number(attendance.boss_profit)
    })
    
    return Array.from(dailyMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const exportToCSV = () => {
    const totals = calculateTotals()
    const employeeStats = getEmployeeStats()
    const dailyStats = getDailyStats()
    
    let csvContent = "data:text/csv;charset=utf-8,"
    
    // 总计信息
    csvContent += "报表总计\n"
    csvContent += `时间范围,${startDate} 至 ${endDate}\n`
    csvContent += `总收入,${totals.totalRevenue}\n`
    csvContent += `KTV费用,${totals.totalKtvFee}\n`
    csvContent += `员工工资,${totals.totalSalary}\n`
    csvContent += `Peter收入,${totals.totalPeterCommission}\n`
    csvContent += `老板利润,${totals.totalBossProfit}\n`
    csvContent += `陪客总次数,${totals.totalClients}\n`
    csvContent += `工作天数,${totals.workingDays}\n\n`
    
    // 员工统计
    csvContent += "员工统计\n"
    csvContent += "姓名,工作天数,陪客次数,总工资,提成\n"
    employeeStats.forEach(emp => {
      csvContent += `${emp.name},${emp.workingDays},${emp.totalClients},${emp.totalSalary},${emp.totalCommission}\n`
    })
    
    csvContent += "\n日统计\n"
    csvContent += "日期,上班员工,陪客次数,员工工资,老板利润\n"
    dailyStats.forEach(day => {
      csvContent += `${day.date},${day.workingEmployees},${day.totalClients},${day.totalSalary},${day.totalBossProfit}\n`
    })
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `KTV考勤报表_${startDate}_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totals = calculateTotals()
  const employeeStats = getEmployeeStats()
  const dailyStats = getDailyStats()

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
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
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
                className="text-purple-600 hover:text-purple-700 px-3 py-2 rounded-md text-sm font-medium"
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
          {/* 页面标题和控制面板 */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">报表统计</h1>
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              导出CSV
            </button>
          </div>

          {/* 时间范围选择 */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">报表周期:</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  >
                    <option value="day">日报</option>
                    <option value="week">周报</option>
                    <option value="month">月报</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">开始日期:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">结束日期:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <div className="mt-2 text-gray-600">加载中...</div>
            </div>
          ) : (
            <>
              {/* 总计统计卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">收</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">总收入</dt>
                          <dd className="text-lg font-medium text-gray-900">{formatCurrency(totals.totalRevenue)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">薪</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">员工工资</dt>
                          <dd className="text-lg font-medium text-gray-900">{formatCurrency(totals.totalSalary)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">P</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Peter收入</dt>
                          <dd className="text-lg font-medium text-gray-900">{formatCurrency(totals.totalPeterCommission)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">利</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">老板利润</dt>
                          <dd className={`text-lg font-medium ${totals.totalBossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(totals.totalBossProfit)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 详细统计信息 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* 员工统计 */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">员工统计</h3>
                    {employeeStats.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">工作天数</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">陪客次数</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">总工资</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {employeeStats.map((emp, index) => (
                              <tr key={index}>
                                <td className="px-4 py-4 text-sm font-medium text-gray-900">{emp.name}</td>
                                <td className="px-4 py-4 text-sm text-gray-900 text-center">{emp.workingDays}</td>
                                <td className="px-4 py-4 text-sm text-gray-900 text-center">{emp.totalClients}</td>
                                <td className="px-4 py-4 text-sm text-gray-900 text-center">{formatCurrency(emp.totalSalary)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">暂无数据</p>
                    )}
                  </div>
                </div>

                {/* 日统计 */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">日统计</h3>
                    {dailyStats.length > 0 ? (
                      <div className="overflow-x-auto max-h-96">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">上班员工</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">陪客次数</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">利润</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {dailyStats.map((day, index) => (
                              <tr key={index}>
                                <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                  {new Date(day.date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900 text-center">{day.workingEmployees}</td>
                                <td className="px-4 py-4 text-sm text-gray-900 text-center">{day.totalClients}</td>
                                <td className="px-4 py-4 text-sm text-center">
                                  <span className={day.totalBossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {formatCurrency(day.totalBossProfit)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">暂无数据</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      </div>
    </AuthGuard>
  )
}
