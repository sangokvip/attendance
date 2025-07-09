import { supabase } from './supabase'
import { AuthService } from './auth'

export interface IncomeStats {
  totalEmployeeSalary: number
  totalPeterCommission: number
  totalAdamIncome: number
  totalRevenue: number
  totalClients: number
  workingDays: number
  startDate: string
  endDate: string
}

export interface UserIncomeStats {
  userPeterCommission: number
  totalEmployeeSalary: number
  totalAdamIncome?: number // 只有管理员才有
}

export class IncomeStatsService {
  // 获取当前用户的收入统计
  static async getCurrentUserIncomeStats(): Promise<UserIncomeStats> {
    const isAdmin = AuthService.isAdmin()
    
    // 获取从系统开始到现在的所有考勤记录
    const { data: attendances, error } = await supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) throw error
    
    const stats = this.calculateIncomeFromAttendances(attendances || [])
    
    if (isAdmin) {
      // 管理员可以看到所有收入
      return {
        userPeterCommission: stats.totalPeterCommission,
        totalEmployeeSalary: stats.totalEmployeeSalary,
        totalAdamIncome: stats.totalAdamIncome
      }
    } else {
      // 普通用户只能看到Peter收入和员工总收入
      return {
        userPeterCommission: stats.totalPeterCommission,
        totalEmployeeSalary: stats.totalEmployeeSalary
      }
    }
  }

  // 获取指定日期范围的收入统计
  static async getIncomeStats(startDate: string, endDate: string): Promise<IncomeStats> {
    const { data: attendances, error } = await supabase
      .from('attendance')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
    
    if (error) throw error
    
    const stats = this.calculateIncomeFromAttendances(attendances || [])
    
    return {
      ...stats,
      startDate,
      endDate
    }
  }

  // 获取今日收入统计
  static async getTodayIncomeStats(): Promise<IncomeStats> {
    const today = new Date().toISOString().split('T')[0]
    return this.getIncomeStats(today, today)
  }

  // 获取本月收入统计
  static async getThisMonthIncomeStats(): Promise<IncomeStats> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const today = now.toISOString().split('T')[0]
    return this.getIncomeStats(startOfMonth, today)
  }

  // 从考勤记录计算收入统计
  private static calculateIncomeFromAttendances(attendances: Array<{
    total_salary?: number | string
    peter_commission?: number | string
    boss_profit?: number | string
    client_count: number
    is_working: boolean
  }>): Omit<IncomeStats, 'startDate' | 'endDate'> {
    return attendances.reduce((totals, attendance) => {
      return {
        totalEmployeeSalary: totals.totalEmployeeSalary + Number(attendance.total_salary || 0),
        totalPeterCommission: totals.totalPeterCommission + Number(attendance.peter_commission || 0),
        totalAdamIncome: totals.totalAdamIncome + Number(attendance.boss_profit || 0),
        totalRevenue: totals.totalRevenue + (attendance.client_count * 900), // 客人付费
        totalClients: totals.totalClients + attendance.client_count,
        workingDays: totals.workingDays + (attendance.is_working ? 1 : 0)
      }
    }, {
      totalEmployeeSalary: 0,
      totalPeterCommission: 0,
      totalAdamIncome: 0,
      totalRevenue: 0,
      totalClients: 0,
      workingDays: 0
    })
  }

  // 获取按模板分组的收入统计
  static async getIncomeStatsByTemplate(): Promise<{ [templateName: string]: IncomeStats }> {
    // 获取所有员工及其模板信息
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select(`
        *,
        template:settings_templates(*)
      `)

    if (employeeError) throw employeeError

    // 获取所有考勤记录
    const { data: attendances, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: false })

    if (attendanceError) throw attendanceError

    const templateStats: { [templateName: string]: Array<{
      total_salary?: number | string
      peter_commission?: number | string
      boss_profit?: number | string
      client_count: number
      is_working: boolean
    }> } = {}
    
    // 按员工模板分组考勤记录
    attendances?.forEach(attendance => {
      const employee = employees?.find(emp => emp.id === attendance.employee_id)
      const templateName = employee?.template?.name || '全局设置'
      
      if (!templateStats[templateName]) {
        templateStats[templateName] = []
      }
      templateStats[templateName].push(attendance)
    })
    
    // 计算各模板的收入统计
    const result: { [templateName: string]: IncomeStats } = {}
    
    Object.entries(templateStats).forEach(([templateName, templateAttendances]) => {
      const stats = this.calculateIncomeFromAttendances(templateAttendances)
      result[templateName] = {
        ...stats,
        startDate: '',
        endDate: ''
      }
    })
    
    return result
  }
}
