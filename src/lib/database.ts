import { supabase, Employee, Attendance } from './supabase'
import { calculateSalaryWithSettings } from './settings'

// 员工相关操作
export class EmployeeService {
  // 获取所有员工
  static async getAll(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  }

  // 添加员工
  static async create(name: string): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .insert({ name })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 更新员工
  static async update(id: number, name: string): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .update({ name })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 删除员工
  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // 更新员工工资结算日期
  static async updateSalaryDate(id: number, date: string): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .update({ last_salary_date: date })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// 考勤相关操作
export class AttendanceService {
  // 获取指定日期的考勤记录
  static async getByDate(date: string): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        employee:employees(*)
      `)
      .eq('date', date)
      .order('employee_id')
    
    if (error) throw error
    return data || []
  }

  // 获取日期范围内的考勤记录
  static async getByDateRange(startDate: string, endDate: string): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        employee:employees(*)
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
      .order('employee_id')
    
    if (error) throw error
    return data || []
  }

  // 获取员工的考勤记录
  static async getByEmployee(employeeId: number, startDate?: string, endDate?: string): Promise<Attendance[]> {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        employee:employees(*)
      `)
      .eq('employee_id', employeeId)
    
    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)
    
    const { data, error } = await query.order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // 创建或更新考勤记录
  static async upsert(employeeId: number, date: string, isWorking: boolean, clientCount: number, userId?: number): Promise<Attendance> {
    // 计算工资（使用数据库中的设置）
    const calculation = await calculateSalaryWithSettings(clientCount, isWorking)
    
    const attendanceData: any = {
      employee_id: employeeId,
      date,
      is_working: isWorking,
      client_count: clientCount,
      base_salary: calculation.baseSalary,
      commission: calculation.commission,
      peter_commission: calculation.peterCommission,
      total_salary: calculation.totalSalary,
      boss_profit: calculation.bossProfit
    }

    // 只有在提供userId时才添加用户追踪字段（避免数据库字段不存在的错误）
    if (userId) {
      attendanceData.created_by_user_id = userId
      attendanceData.updated_by_user_id = userId
    }

    const { data, error } = await supabase
      .from('attendance')
      .upsert(attendanceData, { 
        onConflict: 'employee_id,date',
        ignoreDuplicates: false 
      })
      .select(`
        *,
        employee:employees(*)
      `)
      .single()
    
    if (error) throw error
    return data
  }

  // 删除考勤记录
  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // 获取统计数据
  static async getStats(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
    
    if (error) throw error
    
    const stats = {
      totalSalary: 0,
      totalPeterCommission: 0,
      totalBossProfit: 0,
      totalClients: 0,
      workingDays: 0,
      totalDays: data?.length || 0
    }
    
    data?.forEach(record => {
      stats.totalSalary += Number(record.total_salary)
      stats.totalPeterCommission += Number(record.peter_commission)
      stats.totalBossProfit += Number(record.boss_profit)
      stats.totalClients += record.client_count
      if (record.is_working) stats.workingDays++
    })
    
    return stats
  }
}
