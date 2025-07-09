'use client'

import { useState, useEffect } from 'react'
import { AttendanceService } from '@/lib/database'
import { Attendance } from '@/lib/supabase'
import { formatCurrency } from '@/lib/salary-calculator'

interface EmployeeIncomeData {
  employeeId: number
  employeeName: string
  totalSalary: number
  baseSalary: number
  commission: number
  workingDays: number
  totalClients: number
  averageDailySalary: number
  attendances: Attendance[]
}

export default function EmployeeIncomeChart() {
  const [incomeData, setIncomeData] = useState<EmployeeIncomeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState<'totalSalary' | 'workingDays' | 'totalClients'>('totalSalary')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadIncomeData()
  }, [])

  const loadIncomeData = async () => {
    try {
      setLoading(true)
      
      // 获取过去30天的考勤记录
      const today = new Date()
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)
      
      const startDate = thirtyDaysAgo.toISOString().split('T')[0]
      const endDate = today.toISOString().split('T')[0]
      
      const attendances = await AttendanceService.getByDateRange(startDate, endDate)
      
      // 按员工分组统计
      const employeeMap = new Map<number, EmployeeIncomeData>()
      
      attendances.forEach(attendance => {
        if (!attendance.employee) return
        
        const employeeId = attendance.employee_id
        const employeeName = attendance.employee.name
        
        if (!employeeMap.has(employeeId)) {
          employeeMap.set(employeeId, {
            employeeId,
            employeeName,
            totalSalary: 0,
            baseSalary: 0,
            commission: 0,
            workingDays: 0,
            totalClients: 0,
            averageDailySalary: 0,
            attendances: []
          })
        }
        
        const data = employeeMap.get(employeeId)!
        data.totalSalary += attendance.total_salary
        data.baseSalary += attendance.base_salary
        data.commission += attendance.commission
        data.totalClients += attendance.client_count
        data.attendances.push(attendance)
        
        if (attendance.is_working) {
          data.workingDays++
        }
      })
      
      // 计算平均日薪
      const result = Array.from(employeeMap.values()).map(data => ({
        ...data,
        averageDailySalary: data.workingDays > 0 ? data.totalSalary / data.workingDays : 0
      }))
      
      setIncomeData(result)
      setError('')
    } catch (error) {
      console.error('加载收入数据失败:', error)
      setError('加载收入数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: 'totalSalary' | 'workingDays' | 'totalClients') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const sortedData = [...incomeData].sort((a, b) => {
    const aValue = a[sortBy]
    const bValue = b[sortBy]
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
  })

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  const getTotalStats = () => {
    return incomeData.reduce((totals, data) => ({
      totalSalary: totals.totalSalary + data.totalSalary,
      totalClients: totals.totalClients + data.totalClients,
      totalWorkingDays: totals.totalWorkingDays + data.workingDays
    }), { totalSalary: 0, totalClients: 0, totalWorkingDays: 0 })
  }

  const totalStats = getTotalStats()

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">员工近30天收入统计</h3>
          <button
            onClick={loadIncomeData}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {loading ? '刷新中...' : '刷新数据'}
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="mt-2 text-gray-600">加载中...</div>
          </div>
        ) : (
          <>
            {/* 总计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-blue-600 text-sm font-medium">总收入</div>
                <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalStats.totalSalary)}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-green-600 text-sm font-medium">总陪客次数</div>
                <div className="text-2xl font-bold text-green-900">{totalStats.totalClients}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-purple-600 text-sm font-medium">总工作天数</div>
                <div className="text-2xl font-bold text-purple-900">{totalStats.totalWorkingDays}</div>
              </div>
            </div>

            {/* 员工收入表格 */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      员工姓名
                    </th>
                    <th 
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('totalSalary')}
                    >
                      总收入 {getSortIcon('totalSalary')}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      基本工资
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      提成
                    </th>
                    <th 
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('workingDays')}
                    >
                      工作天数 {getSortIcon('workingDays')}
                    </th>
                    <th 
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('totalClients')}
                    >
                      陪客次数 {getSortIcon('totalClients')}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日均收入
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedData.map((data, index) => (
                    <tr key={data.employeeId} className={`hover:bg-gray-50 ${index < 3 ? 'bg-yellow-25' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index < 3 && (
                            <span className="mr-2 text-lg">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                            </span>
                          )}
                          <div className="text-sm font-medium text-gray-900">
                            {data.employeeName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-bold text-gray-900">
                          {formatCurrency(data.totalSalary)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(data.baseSalary)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(data.commission)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">{data.workingDays}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">{data.totalClients}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(data.averageDailySalary)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {incomeData.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-500">近30天没有收入记录</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
