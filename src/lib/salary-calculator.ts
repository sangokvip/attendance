import { BUSINESS_RULES, SettingsTemplate } from './supabase'

export interface SalaryCalculation {
  baseSalary: number
  commission: number
  totalSalary: number
  peterCommission: number
  bossProfit: number
}

/**
 * 计算员工工资和相关费用（使用全局设置）
 * @param clientCount 陪客次数
 * @param isWorking 是否上班
 * @returns 工资计算结果
 */
export function calculateSalary(clientCount: number, isWorking: boolean): SalaryCalculation {
  // 如果没有上班，所有费用为0
  if (!isWorking) {
    return {
      baseSalary: 0,
      commission: 0,
      totalSalary: 0,
      peterCommission: 0,
      bossProfit: 0
    }
  }

  // 基本工资计算
  const baseSalary = clientCount > 0 
    ? BUSINESS_RULES.BASE_SALARY_WITH_CLIENT 
    : BUSINESS_RULES.BASE_SALARY_NO_CLIENT

  // 提成计算
  let commission = 0
  let peterCommission = 0
  
  if (clientCount > 0) {
    // 第一次陪客
    commission += BUSINESS_RULES.FIRST_CLIENT_COMMISSION
    peterCommission += BUSINESS_RULES.PETER_FIRST_CLIENT
    
    // 第二次及以后陪客
    if (clientCount > 1) {
      commission += (clientCount - 1) * BUSINESS_RULES.ADDITIONAL_CLIENT_COMMISSION
      peterCommission += (clientCount - 1) * BUSINESS_RULES.PETER_ADDITIONAL_CLIENT
    }
  }

  const totalSalary = baseSalary + commission

  // 老板利润计算
  const totalRevenue = clientCount * BUSINESS_RULES.CLIENT_PAYMENT
  const totalKtvFee = clientCount * BUSINESS_RULES.KTV_FEE
  const bossProfit = totalRevenue - totalKtvFee - totalSalary - peterCommission

  return {
    baseSalary,
    commission,
    totalSalary,
    peterCommission,
    bossProfit
  }
}

/**
 * 根据员工模板计算工资和相关费用
 * @param clientCount 陪客次数
 * @param isWorking 是否上班
 * @param template 员工的费用模板
 * @returns 工资计算结果
 */
export function calculateSalaryWithTemplate(
  clientCount: number,
  isWorking: boolean,
  template: SettingsTemplate
): SalaryCalculation {
  // 如果没有上班，所有费用为0
  if (!isWorking) {
    return {
      baseSalary: 0,
      commission: 0,
      totalSalary: 0,
      peterCommission: 0,
      bossProfit: 0
    }
  }

  // 基本工资计算（使用模板数据）
  const baseSalary = clientCount > 0
    ? template.template_data.base_salary
    : template.template_data.no_client_salary

  // 提成计算（使用模板数据）
  let commission = 0
  let peterCommission = 0

  if (clientCount > 0) {
    // 第一次陪客
    commission += template.template_data.first_client_bonus
    peterCommission += template.template_data.peter_first_client

    // 第二次及以后陪客
    if (clientCount > 1) {
      commission += (clientCount - 1) * template.template_data.additional_client_bonus
      peterCommission += (clientCount - 1) * template.template_data.peter_additional_client
    }
  }

  const totalSalary = baseSalary + commission

  // 老板利润计算（使用全局设置）
  const totalRevenue = clientCount * BUSINESS_RULES.CLIENT_PAYMENT
  const totalKtvFee = clientCount * BUSINESS_RULES.KTV_FEE
  const bossProfit = totalRevenue - totalKtvFee - totalSalary - peterCommission

  return {
    baseSalary,
    commission,
    totalSalary,
    peterCommission,
    bossProfit
  }
}

/**
 * 格式化金额显示
 * @param amount 金额
 * @returns 格式化后的金额字符串
 */
export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`
}

/**
 * 计算日期范围内的总计
 * @param attendances 考勤记录数组
 * @returns 总计数据
 */
export function calculateTotals(attendances: Array<{
  total_salary: number | string
  peter_commission: number | string
  boss_profit: number | string
  client_count: number
  is_working: boolean
}>) {
  return attendances.reduce((totals, attendance) => {
    return {
      totalSalary: totals.totalSalary + Number(attendance.total_salary),
      totalPeterCommission: totals.totalPeterCommission + Number(attendance.peter_commission),
      totalBossProfit: totals.totalBossProfit + Number(attendance.boss_profit),
      totalClients: totals.totalClients + attendance.client_count,
      workingDays: totals.workingDays + (attendance.is_working ? 1 : 0)
    }
  }, {
    totalSalary: 0,
    totalPeterCommission: 0,
    totalBossProfit: 0,
    totalClients: 0,
    workingDays: 0
  })
}
