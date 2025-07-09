'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SalarySettlementService, SalarySettlement } from '@/lib/salary-settlement'
import { formatCurrency } from '@/lib/salary-calculator'
import AuthGuard from '@/components/AuthGuard'
import Navbar from '@/components/Navbar'

export default function SalaryPage() {
  const [settlements, setSettlements] = useState<SalarySettlement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<number | null>(null)

  useEffect(() => {
    loadSettlements()
  }, [])

  const loadSettlements = async () => {
    try {
      setLoading(true)
      const data = await SalarySettlementService.getAllSettlements()
      setSettlements(data)
      setError('')
    } catch (error) {
      console.error('加载工资结算信息失败:', error)
      setError('加载工资结算信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSalaryDate = async (employeeId: number, date: string) => {
    try {
      setUpdating(employeeId)
      await SalarySettlementService.updateEmployeeSalaryDate(employeeId, date)
      await loadSettlements()
      setError('')
    } catch (error) {
      console.error('更新工资结算日期失败:', error)
      setError('更新工资结算日期失败')
    } finally {
      setUpdating(null)
    }
  }



  const getTotalUnpaidSalary = () => {
    return settlements.reduce((total, settlement) => total + settlement.unpaidBaseSalary, 0)
  }

  // 按模板分组员工
  const getGroupedSettlements = () => {
    const groups: { [key: string]: SalarySettlement[] } = {}

    settlements.forEach(settlement => {
      const templateName = settlement.employee.template?.name || '全局设置'
      if (!groups[templateName]) {
        groups[templateName] = []
      }
      groups[templateName].push(settlement)
    })

    return groups
  }

  // 计算各模板的总工资
  const getTemplateTotal = (templateSettlements: SalarySettlement[]) => {
    return templateSettlements.reduce((total, settlement) => total + settlement.unpaidBaseSalary, 0)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* 导航栏 */}
        <Navbar currentPage="salary" />

        {/* 主要内容 */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* 页面标题 */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">工资结算管理</h1>
              <button
                onClick={loadSettlements}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {loading ? '刷新中...' : '刷新数据'}
              </button>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* 总计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* 总计 */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">总</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">待发放工资总额</dt>
                        <dd className="text-2xl font-bold text-red-600">{formatCurrency(getTotalUnpaidSalary())}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* 各模板分组总计 */}
              {Object.entries(getGroupedSettlements()).map(([templateName, templateSettlements], index) => (
                <div key={templateName} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          templateName === '全局设置'
                            ? 'bg-gray-500'
                            : index % 2 === 0
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                        }`}>
                          <span className="text-white text-xs font-medium">
                            {templateName === '全局设置' ? '默' : templateName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            {templateName} ({templateSettlements.length}人)
                          </dt>
                          <dd className="text-lg font-bold text-gray-900">
                            {formatCurrency(getTemplateTotal(templateSettlements))}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 工资结算列表 */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">员工工资结算详情</h3>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                    <div className="mt-2 text-gray-600">加载中...</div>
                  </div>
                ) : settlements.length > 0 ? (
                  <div className="space-y-8">
                    {Object.entries(getGroupedSettlements()).map(([templateName, templateSettlements]) => (
                      <div key={templateName} className="space-y-4">
                        {/* 模板分组标题 */}
                        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                          <h4 className="text-lg font-medium text-gray-900 flex items-center">
                            <span className={`w-3 h-3 rounded-full mr-2 ${
                              templateName === '全局设置'
                                ? 'bg-gray-500'
                                : 'bg-blue-500'
                            }`}></span>
                            {templateName}
                          </h4>
                          <div className="text-sm text-gray-600">
                            {templateSettlements.length} 人 · {formatCurrency(getTemplateTotal(templateSettlements))}
                          </div>
                        </div>

                        {/* 该模板下的员工 */}
                        <div className="space-y-4">
                          {templateSettlements.map((settlement) => (
                            <EmployeeSettlementCard
                              key={settlement.employee.id}
                              settlement={settlement}
                              onUpdateSalaryDate={handleUpdateSalaryDate}
                              updating={updating === settlement.employee.id}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-4">暂无员工信息</div>
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

// 员工工资结算卡片组件
interface EmployeeSettlementCardProps {
  settlement: SalarySettlement
  onUpdateSalaryDate: (employeeId: number, date: string) => void
  updating: boolean
}

function EmployeeSettlementCard({ settlement, onUpdateSalaryDate, updating }: EmployeeSettlementCardProps) {
  const [newSalaryDate, setNewSalaryDate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSalaryDate) {
      onUpdateSalaryDate(settlement.employee.id, newSalaryDate)
      setNewSalaryDate('')
    }
  }

  const getStatusColor = () => {
    if (settlement.unpaidBaseSalary > 1000) return 'border-red-200 bg-red-50'
    if (settlement.unpaidBaseSalary > 500) return 'border-yellow-200 bg-yellow-50'
    return 'border-green-200 bg-green-50'
  }

  return (
    <div className={`border rounded-lg p-6 ${getStatusColor()}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="text-lg font-medium text-gray-900">{settlement.employee.name}</h4>
            {settlement.employee.template && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {settlement.employee.template.name}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            上次结算日期: {settlement.lastSalaryDate ? new Date(settlement.lastSalaryDate).toLocaleDateString() : '未设置'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(settlement.unpaidBaseSalary)}</div>
          <div className="text-sm text-gray-600">{settlement.unpaidDays} 个工作日</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">工资明细</h5>
          <div className="text-sm text-gray-600">
            <div>基本工资: {formatCurrency(settlement.unpaidBaseSalary)}</div>
            <div>工作天数: {settlement.unpaidDays} 天</div>
            <div>计算周期: {settlement.lastSalaryDate ? new Date(settlement.lastSalaryDate).toLocaleDateString() : '员工入职'} 至今</div>
          </div>
        </div>
        
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">更新结算日期</h5>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="date"
              value={newSalaryDate}
              onChange={(e) => setNewSalaryDate(e.target.value)}
              className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 text-sm"
              max={new Date().toISOString().split('T')[0]}
            />
            <button
              type="submit"
              disabled={!newSalaryDate || updating}
              className="px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
            >
              {updating ? '更新中...' : '更新'}
            </button>
          </form>
        </div>
      </div>

      {/* 最近几天的工作记录 */}
      <div>
        <h5 className="text-sm font-medium text-gray-700 mb-2">最近工作记录</h5>
        <div className="grid grid-cols-7 gap-1">
          {settlement.dailyRecords.slice(-14).map((record, index) => (
            <div
              key={index}
              className={`text-xs p-2 rounded text-center ${
                record.isWorking
                  ? record.hasClients
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
              title={`${record.date}: ${record.isWorking ? (record.hasClients ? '有客人' : '无客人') : '未上班'} - ${formatCurrency(record.baseSalary)}`}
            >
              <div>{new Date(record.date).getDate()}</div>
              <div>{formatCurrency(record.baseSalary)}</div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          <span className="inline-block w-3 h-3 bg-green-100 rounded mr-1"></span>有客人
          <span className="inline-block w-3 h-3 bg-blue-100 rounded mr-1 ml-2"></span>无客人
          <span className="inline-block w-3 h-3 bg-gray-100 rounded mr-1 ml-2"></span>未上班
        </div>
      </div>
    </div>
  )
}
