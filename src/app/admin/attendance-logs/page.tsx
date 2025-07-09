'use client'

import { useState, useEffect } from 'react'
import { AttendanceService } from '@/lib/database'
import { Attendance, supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/salary-calculator'
import AuthGuard from '@/components/AuthGuard'
import Navbar from '@/components/Navbar'

export default function AttendanceLogsPage() {
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30天前
    end: new Date().toISOString().split('T')[0] // 今天
  })

  useEffect(() => {
    loadAttendanceLogs()
  }, [dateRange])

  const loadAttendanceLogs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          employee:employees(name),
          created_by_user:users!attendance_created_by_user_id_fkey(username, display_name),
          updated_by_user:users!attendance_updated_by_user_id_fkey(username, display_name)
        `)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAttendanceLogs(data || [])
      setError('')
    } catch (error) {
      console.error('加载考勤记录失败:', error)
      setError('加载考勤记录失败')
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getStatusBadge = (isWorking: boolean) => {
    return isWorking ? (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        上班
      </span>
    ) : (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
        未上班
      </span>
    )
  }

  return (
    <AuthGuard requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="admin" />

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* 页面标题和筛选 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
              <h1 className="text-2xl font-bold text-gray-900">考勤记录追踪</h1>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">开始日期:</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">结束日期:</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* 考勤记录表格 */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  考勤记录详情 ({attendanceLogs.length} 条记录)
                </h3>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <div className="mt-2 text-gray-600">加载中...</div>
                  </div>
                ) : attendanceLogs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            员工
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            日期
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            状态
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            陪客次数
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            工资
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            录入人
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            录入时间
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendanceLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {log.employee?.name || '未知员工'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(log.date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(log.is_working)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{log.client_count}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatCurrency(log.total_salary)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {log.created_by_user?.display_name || log.created_by_user?.username || '系统'}
                              </div>
                              {log.updated_by_user && log.updated_by_user.id !== log.created_by_user?.id && (
                                <div className="text-xs text-gray-500">
                                  修改: {log.updated_by_user.display_name || log.updated_by_user.username}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDateTime(log.created_at)}
                              </div>
                              {log.updated_at !== log.created_at && (
                                <div className="text-xs text-gray-500">
                                  修改: {formatDateTime(log.updated_at)}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-4">所选时间范围内没有考勤记录</div>
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
