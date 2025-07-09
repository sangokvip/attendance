import { supabase, Employee } from './supabase'
import { SettingsService } from './settings'
import { calculateSalaryWithTemplate } from './salary-calculator'

export interface SalarySettlement {
  employee: Employee
  lastSalaryDate: string | null
  unpaidDays: number
  unpaidBaseSalary: number
  nextPaymentDate: string
  dailyRecords: DailyRecord[]
}

export interface DailyRecord {
  date: string
  isWorking: boolean
  baseSalary: number
  hasClients: boolean
}

export class SalarySettlementService {
  // 获取所有员工的工资结算信息
  static async getAllSettlements(): Promise<SalarySettlement[]> {
    const employees = await this.getEmployeesWithSalaryInfo()
    const settlements: SalarySettlement[] = []
    
    for (const employee of employees) {
      const settlement = await this.calculateEmployeeSettlement(employee)
      settlements.push(settlement)
    }
    
    return settlements.sort((a, b) => b.unpaidBaseSalary - a.unpaidBaseSalary)
  }

  // 获取单个员工的工资结算信息
  static async getEmployeeSettlement(employeeId: number): Promise<SalarySettlement> {
    const { data: employee, error } = await supabase
      .from('employees')
      .select(`
        *,
        template:settings_templates(*)
      `)
      .eq('id', employeeId)
      .single()

    if (error) throw error
    return await this.calculateEmployeeSettlement(employee)
  }

  // 计算员工工资结算
  private static async calculateEmployeeSettlement(employee: Employee): Promise<SalarySettlement> {
    const today = new Date().toISOString().split('T')[0]
    const lastSalaryDate = employee.last_salary_date
    
    // 如果没有设置过工资结算日期，从员工创建日期开始计算
    const startDate = lastSalaryDate 
      ? this.getNextDay(lastSalaryDate)
      : employee.created_at.split('T')[0]
    
    const dailyRecords = await this.getDailyRecords(employee, startDate, today)
    const unpaidBaseSalary = await this.calculateUnpaidBaseSalary(dailyRecords)
    const unpaidDays = this.calculateWorkingDays(dailyRecords)
    
    return {
      employee,
      lastSalaryDate,
      unpaidDays,
      unpaidBaseSalary,
      nextPaymentDate: today,
      dailyRecords
    }
  }

  // 获取员工的每日记录（支持员工模板）
  private static async getDailyRecords(employee: Employee, startDate: string, endDate: string): Promise<DailyRecord[]> {
    const { data: attendances, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
    
    if (error) throw error
    
    const rules = await SettingsService.getBusinessRules()
    const records: DailyRecord[] = []
    
    // 生成日期范围内的所有日期
    const dates = this.getDateRange(startDate, endDate)
    
    for (const date of dates) {
      const attendance = attendances?.find(a => a.date === date)
      
      if (attendance) {
        // 有考勤记录，根据员工模板或全局设置计算工资
        const hasClients = attendance.client_count > 0
        let baseSalary = 0

        if (employee.template) {
          // 使用员工模板计算
          const calculation = calculateSalaryWithTemplate(
            attendance.client_count,
            attendance.is_working,
            employee.template
          )
          baseSalary = calculation.baseSalary
        } else {
          // 使用全局设置计算
          baseSalary = hasClients
            ? rules.BASE_SALARY_WITH_CLIENT
            : (attendance.is_working ? rules.BASE_SALARY_NO_CLIENT : 0)
        }

        records.push({
          date,
          isWorking: attendance.is_working,
          baseSalary,
          hasClients
        })
      } else {
        // 没有考勤记录，默认为未上班
        records.push({
          date,
          isWorking: false,
          baseSalary: 0,
          hasClients: false
        })
      }
    }
    
    return records
  }

  // 计算未支付的基本工资
  private static async calculateUnpaidBaseSalary(dailyRecords: DailyRecord[]): Promise<number> {
    return dailyRecords.reduce((total, record) => total + record.baseSalary, 0)
  }

  // 计算工作天数
  private static calculateWorkingDays(dailyRecords: DailyRecord[]): number {
    return dailyRecords.filter(record => record.isWorking).length
  }

  // 获取员工信息（包含工资结算日期和模板信息）
  private static async getEmployeesWithSalaryInfo(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        template:settings_templates(*)
      `)
      .order('name')

    if (error) throw error
    return data || []
  }

  // 生成日期范围
  private static getDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(date.toISOString().split('T')[0])
    }
    
    return dates
  }

  // 获取下一天的日期
  private static getNextDay(dateString: string): string {
    const date = new Date(dateString)
    date.setDate(date.getDate() + 1)
    return date.toISOString().split('T')[0]
  }

  // 更新员工工资结算日期
  static async updateEmployeeSalaryDate(employeeId: number, date: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .update({ last_salary_date: date })
      .eq('id', employeeId)
    
    if (error) throw error
  }
}
