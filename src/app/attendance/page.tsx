'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { EmployeeService, AttendanceService } from '@/lib/database'
import { Employee, Attendance } from '@/lib/supabase'
import { formatCurrency } from '@/lib/salary-calculator'
import { calculateSalaryWithSettings } from '@/lib/settings'
import { AuthService } from '@/lib/auth'
import AuthGuard from '@/components/AuthGuard'
import Navbar from '@/components/Navbar'

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [selectedDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setLoading(true)
      const [employeesData, attendancesData] = await Promise.all([
        EmployeeService.getAll(),
        AttendanceService.getByDate(selectedDate)
      ])
      setEmployees(employeesData)
      setAttendances(attendancesData)
    } catch (error) {
      console.error('加载数据失败:', error)
      setError('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const getAttendanceForEmployee = (employeeId: number) => {
    return attendances.find(a => a.employee_id === employeeId)
  }

  const handleAttendanceChange = async (employeeId: number, isWorking: boolean, clientCount: number) => {
    try {
      setSaving(true)
      const currentUser = AuthService.getCurrentUser()
      await AttendanceService.upsert(employeeId, selectedDate, isWorking, clientCount, currentUser?.id)
      // 重新加载数据以获取最新的计算结果
      await loadData()
      setError('')
    } catch (error) {
      console.error('保存考勤失败:', error)
      setError('保存考勤失败')
    } finally {
      setSaving(false)
    }
  }

  const calculateDayTotals = () => {
    return attendances.reduce((totals, attendance) => {
      return {
        totalSalary: totals.totalSalary + Number(attendance.total_salary),
        totalPeterCommission: totals.totalPeterCommission + Number(attendance.peter_commission),
        totalBossProfit: totals.totalBossProfit + Number(attendance.boss_profit),
        totalClients: totals.totalClients + attendance.client_count,
        workingEmployees: totals.workingEmployees + (attendance.is_working ? 1 : 0)
      }
    }, {
      totalSalary: 0,
      totalPeterCommission: 0,
      totalBossProfit: 0,
      totalClients: 0,
      workingEmployees: 0
    })
  }

  const dayTotals = calculateDayTotals()

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <Navbar currentPage="attendance" />

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 页面标题和日期选择 */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">考勤录入</h1>
            <div className="flex items-center space-x-4">
              <label htmlFor="date" className="text-sm font-medium text-gray-700">
                选择日期:
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* 日统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">员</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">上班员工</dt>
                      <dd className="text-lg font-medium text-gray-900">{dayTotals.workingEmployees}人</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">客</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">陪客次数</dt>
                      <dd className="text-lg font-medium text-gray-900">{dayTotals.totalClients}次</dd>
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
                      <dd className="text-lg font-medium text-gray-900">{formatCurrency(dayTotals.totalSalary)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">P</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Peter收入</dt>
                      <dd className="text-lg font-medium text-gray-900">{formatCurrency(dayTotals.totalPeterCommission)}</dd>
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
                      <dd className="text-lg font-medium text-gray-900">{formatCurrency(dayTotals.totalBossProfit)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 考勤录入表格 */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {new Date(selectedDate).toLocaleDateString()} 考勤录入
              </h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <div className="mt-2 text-gray-600">加载中...</div>
                </div>
              ) : employees.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          员工姓名
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          上班状态
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          陪客次数
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          基本工资
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          提成
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          总工资
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Peter收入
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          老板利润
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employees.map((employee) => {
                        const attendance = getAttendanceForEmployee(employee.id)
                        const isWorking = attendance?.is_working ?? true // 默认为上班
                        const clientCount = attendance?.client_count || 0

                        return (
                          <AttendanceRow
                            key={employee.id}
                            employee={employee}
                            isWorking={isWorking}
                            clientCount={clientCount}
                            onAttendanceChange={handleAttendanceChange}
                            saving={saving}
                          />
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">还没有员工信息</div>
                  <Link
                    href="/employees"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    添加员工
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

// 考勤行组件
interface AttendanceRowProps {
  employee: Employee
  isWorking: boolean
  clientCount: number
  onAttendanceChange: (employeeId: number, isWorking: boolean, clientCount: number) => void
  saving: boolean
}

function AttendanceRow({
  employee,
  isWorking,
  clientCount,
  onAttendanceChange,
  saving
}: AttendanceRowProps) {
  const [localIsWorking, setLocalIsWorking] = useState(isWorking)
  const [localClientCount, setLocalClientCount] = useState(clientCount)
  const [calculation, setCalculation] = useState({
    baseSalary: 0,
    commission: 0,
    totalSalary: 0,
    peterCommission: 0,
    bossProfit: 0
  })

  useEffect(() => {
    setLocalIsWorking(isWorking)
    setLocalClientCount(clientCount)
  }, [isWorking, clientCount])

  // 动态计算工资
  useEffect(() => {
    const calculateDynamic = async () => {
      try {
        const result = await calculateSalaryWithSettings(localClientCount, localIsWorking)
        setCalculation(result)
      } catch (error) {
        console.error('计算工资失败:', error)
      }
    }
    calculateDynamic()
  }, [localIsWorking, localClientCount])

  const handleWorkingChange = (working: boolean) => {
    setLocalIsWorking(working)
    if (!working) {
      setLocalClientCount(0)
      onAttendanceChange(employee.id, working, 0)
    } else {
      onAttendanceChange(employee.id, working, localClientCount)
    }
  }

  const handleClientCountChange = (count: number) => {
    const newCount = Math.max(0, count)
    setLocalClientCount(newCount)
    onAttendanceChange(employee.id, localIsWorking, newCount)
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {employee.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={localIsWorking}
            onChange={(e) => handleWorkingChange(e.target.checked)}
            disabled={saving}
            className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
          />
          <span className="ml-2 text-sm text-gray-700">
            {localIsWorking ? '上班' : '休息'}
          </span>
        </label>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <input
          type="number"
          min="0"
          value={localClientCount}
          onChange={(e) => handleClientCountChange(parseInt(e.target.value) || 0)}
          disabled={!localIsWorking || saving}
          className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:bg-gray-100"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
        {formatCurrency(calculation.baseSalary)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
        {formatCurrency(calculation.commission)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
        {formatCurrency(calculation.totalSalary)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
        {formatCurrency(calculation.peterCommission)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
        <span className={calculation.bossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
          {formatCurrency(calculation.bossProfit)}
        </span>
      </td>
    </tr>
  )
}
