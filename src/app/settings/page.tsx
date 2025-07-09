'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SettingsService } from '@/lib/settings'
import { Setting } from '@/lib/supabase'
import { formatCurrency } from '@/lib/salary-calculator'
import AuthGuard from '@/components/AuthGuard'
import Navbar from '@/components/Navbar'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editedValues, setEditedValues] = useState<{ [key: string]: number }>({})

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await SettingsService.getAll()
      setSettings(data)
      
      // 初始化编辑值
      const initialValues: { [key: string]: number } = {}
      data.forEach(setting => {
        initialValues[setting.key] = setting.value
      })
      setEditedValues(initialValues)
    } catch (error) {
      console.error('加载设置失败:', error)
      setError('加载设置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleValueChange = (key: string, value: number) => {
    setEditedValues(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      // 找出有变化的设置
      const updates = settings
        .filter(setting => editedValues[setting.key] !== setting.value)
        .map(setting => ({
          key: setting.key,
          value: editedValues[setting.key]
        }))

      if (updates.length === 0) {
        setSuccess('没有需要保存的更改')
        return
      }

      await SettingsService.updateMultiple(updates)
      await loadSettings()
      setSuccess(`成功更新了 ${updates.length} 项设置`)
    } catch (error) {
      console.error('保存设置失败:', error)
      setError('保存设置失败')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    const initialValues: { [key: string]: number } = {}
    settings.forEach(setting => {
      initialValues[setting.key] = setting.value
    })
    setEditedValues(initialValues)
    setError('')
    setSuccess('')
  }

  const getSettingDisplayName = (key: string) => {
    const names: { [key: string]: string } = {
      'CLIENT_PAYMENT': '客人付款',
      'KTV_FEE': 'KTV费用',
      'BASE_SALARY_WITH_CLIENT': '有陪客基本工资',
      'BASE_SALARY_NO_CLIENT': '无陪客基本工资',
      'FIRST_CLIENT_COMMISSION': '第一次陪客提成',
      'ADDITIONAL_CLIENT_COMMISSION': '第二次及以后陪客提成',
      'PETER_FIRST_CLIENT': 'Peter第一次陪客收入',
      'PETER_ADDITIONAL_CLIENT': 'Peter第二次及以后陪客收入'
    }
    return names[key] || key
  }

  const hasChanges = settings.some(setting => editedValues[setting.key] !== setting.value)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <Navbar currentPage="settings" />

      {/* 主要内容 */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 页面标题 */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
            <div className="flex space-x-3">
              <button
                onClick={handleReset}
                disabled={!hasChanges || saving}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                重置
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '保存设置'}
              </button>
            </div>
          </div>

          {/* 提示信息 */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* 设置表单 */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">费用设置</h3>
              <p className="text-sm text-gray-600 mb-6">
                修改以下设置将影响工资计算规则。请谨慎操作，建议在非营业时间进行调整。
              </p>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  <div className="mt-2 text-gray-600">加载中...</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {settings.map((setting) => (
                    <div key={setting.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {getSettingDisplayName(setting.key)}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">¥</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editedValues[setting.key] || 0}
                          onChange={(e) => handleValueChange(setting.key, parseFloat(e.target.value) || 0)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        />
                      </div>
                      <div className="text-sm text-gray-500">
                        {editedValues[setting.key] !== setting.value && (
                          <span className="text-orange-600">
                            原值: {formatCurrency(setting.value)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 说明信息 */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">设置说明</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>客人付款</strong>: 每次陪客客人支付的金额</li>
              <li>• <strong>KTV费用</strong>: 每次陪客需要支付给KTV的费用</li>
              <li>• <strong>有陪客基本工资</strong>: 员工当天有陪客时的基本工资</li>
              <li>• <strong>无陪客基本工资</strong>: 员工当天上班但无陪客时的基本工资</li>
              <li>• <strong>第一次陪客提成</strong>: 员工当天第一次陪客的提成</li>
              <li>• <strong>第二次及以后陪客提成</strong>: 员工当天第二次及以后陪客的提成</li>
              <li>• <strong>Peter收入</strong>: Peter从员工陪客中获得的收入</li>
            </ul>
          </div>
        </div>
      </main>
      </div>
    </AuthGuard>
  )
}
