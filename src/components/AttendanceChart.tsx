'use client'

import { Attendance } from '@/lib/supabase'
import { formatCurrency } from '@/lib/salary-calculator'

interface AttendanceChartProps {
  attendances: Attendance[]
  days: number
  title: string
}

export default function AttendanceChart({ attendances, days, title }: AttendanceChartProps) {
  // 获取日期范围
  const getDates = () => {
    const dates = []
    const today = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  // 获取所有员工
  const getEmployees = () => {
    const employeeMap = new Map()
    attendances.forEach(attendance => {
      if (attendance.employee) {
        employeeMap.set(attendance.employee_id, attendance.employee.name)
      }
    })
    return Array.from(employeeMap.entries()).map(([id, name]) => ({ id, name }))
  }

  // 获取特定员工特定日期的考勤记录
  const getAttendanceForEmployeeAndDate = (employeeId: number, date: string) => {
    return attendances.find(a => a.employee_id === employeeId && a.date === date)
  }

  // 获取状态样式
  const getStatusStyle = (attendance?: Attendance) => {
    if (!attendance || !attendance.is_working) {
      return 'bg-gray-100 text-gray-600 border-gray-200'
    }
    if (attendance.client_count > 0) {
      return 'bg-green-100 text-green-800 border-green-200'
    }
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }

  // 获取状态文本
  const getStatusText = (attendance?: Attendance) => {
    if (!attendance || !attendance.is_working) {
      return '休'
    }
    if (attendance.client_count > 0) {
      return attendance.client_count.toString()
    }
    return '班'
  }

  // 获取状态提示
  const getStatusTooltip = (attendance?: Attendance) => {
    if (!attendance || !attendance.is_working) {
      return '未上班'
    }
    if (attendance.client_count > 0) {
      return `陪客 ${attendance.client_count} 次 - ${formatCurrency(attendance.total_salary)}`
    }
    return `上班无客人 - ${formatCurrency(attendance.total_salary)}`
  }

  const dates = getDates()
  const employees = getEmployees()

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full border-collapse border border-gray-300">
              {/* 表头 */}
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                    员工
                  </th>
                  {dates.map((date) => {
                    const dateObj = new Date(date)
                    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6
                    return (
                      <th 
                        key={date} 
                        className={`border border-gray-300 px-2 py-2 text-center text-xs font-medium uppercase tracking-wider min-w-[60px] ${
                          isWeekend ? 'bg-red-50 text-red-600' : 'text-gray-500'
                        }`}
                      >
                        <div>{dateObj.getMonth() + 1}/{dateObj.getDate()}</div>
                        <div className="text-xs">
                          {dateObj.toLocaleDateString('zh-CN', { weekday: 'short' })}
                        </div>
                      </th>
                    )
                  })}
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    统计
                  </th>
                </tr>
              </thead>
              
              {/* 表体 */}
              <tbody>
                {employees.map((employee) => {
                  // 计算员工统计
                  const employeeAttendances = attendances.filter(a => a.employee_id === employee.id)
                  const workingDays = employeeAttendances.filter(a => a.is_working).length
                  const totalClients = employeeAttendances.reduce((sum, a) => sum + a.client_count, 0)
                  const totalSalary = employeeAttendances.reduce((sum, a) => sum + a.total_salary, 0)
                  
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      {/* 员工名称 */}
                      <td className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                        {employee.name}
                      </td>
                      
                      {/* 每日状态 */}
                      {dates.map((date) => {
                        const attendance = getAttendanceForEmployeeAndDate(employee.id, date)
                        const dateObj = new Date(date)
                        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6
                        
                        return (
                          <td 
                            key={date} 
                            className={`border border-gray-300 p-1 text-center ${isWeekend ? 'bg-red-25' : ''}`}
                          >
                            <div 
                              className={`w-10 h-10 mx-auto rounded-md border-2 flex items-center justify-center text-xs font-bold cursor-help ${getStatusStyle(attendance)}`}
                              title={getStatusTooltip(attendance)}
                            >
                              {getStatusText(attendance)}
                            </div>
                          </td>
                        )
                      })}
                      
                      {/* 统计信息 */}
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                        <div className="text-center">
                          <div className="font-medium">{workingDays}天</div>
                          <div className="text-xs text-gray-500">{totalClients}客</div>
                          <div className="text-xs font-medium text-green-600">
                            {formatCurrency(totalSalary)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* 图例 */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-200 rounded mr-2"></div>
            <span>有客人（数字=陪客次数）</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 border-2 border-blue-200 rounded mr-2"></div>
            <span>上班无客人</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 border-2 border-gray-200 rounded mr-2"></div>
            <span>未上班</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-25 border border-red-200 rounded mr-2"></div>
            <span>周末</span>
          </div>
        </div>
        
        {employees.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500">所选时间范围内没有考勤记录</div>
          </div>
        )}
      </div>
    </div>
  )
}
