import { supabase, Setting } from './supabase'

// 设置服务类
export class SettingsService {
  // 获取所有设置
  static async getAll(): Promise<Setting[]> {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .order('key')
    
    if (error) throw error
    return data || []
  }

  // 获取设置值
  static async getValue(key: string): Promise<number> {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single()
    
    if (error) throw error
    return data.value
  }

  // 更新设置值
  static async updateValue(key: string, value: number): Promise<Setting> {
    const { data, error } = await supabase
      .from('settings')
      .update({ value })
      .eq('key', key)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 批量更新设置
  static async updateMultiple(updates: { key: string; value: number }[]): Promise<void> {
    for (const update of updates) {
      await this.updateValue(update.key, update.value)
    }
  }

  // 获取业务规则对象
  static async getBusinessRules() {
    const settings = await this.getAll()
    const rules: { [key: string]: number } = {}
    
    settings.forEach(setting => {
      rules[setting.key] = setting.value
    })
    
    return {
      CLIENT_PAYMENT: rules.CLIENT_PAYMENT || 900,
      KTV_FEE: rules.KTV_FEE || 120,
      BASE_SALARY_WITH_CLIENT: rules.BASE_SALARY_WITH_CLIENT || 350,
      BASE_SALARY_NO_CLIENT: rules.BASE_SALARY_NO_CLIENT || 100,
      FIRST_CLIENT_COMMISSION: rules.FIRST_CLIENT_COMMISSION || 200,
      ADDITIONAL_CLIENT_COMMISSION: rules.ADDITIONAL_CLIENT_COMMISSION || 300,
      PETER_FIRST_CLIENT: rules.PETER_FIRST_CLIENT || 50,
      PETER_ADDITIONAL_CLIENT: rules.PETER_ADDITIONAL_CLIENT || 100,
    }
  }
}

// 动态工资计算函数（使用数据库中的设置）
export async function calculateSalaryWithSettings(clientCount: number, isWorking: boolean) {
  const rules = await SettingsService.getBusinessRules()
  
  if (!isWorking) {
    return {
      baseSalary: 0,
      commission: 0,
      totalSalary: 0,
      peterCommission: 0,
      bossProfit: 0
    }
  }

  const baseSalary = clientCount > 0 
    ? rules.BASE_SALARY_WITH_CLIENT 
    : rules.BASE_SALARY_NO_CLIENT

  let commission = 0
  let peterCommission = 0
  
  if (clientCount > 0) {
    commission += rules.FIRST_CLIENT_COMMISSION
    peterCommission += rules.PETER_FIRST_CLIENT
    
    if (clientCount > 1) {
      commission += (clientCount - 1) * rules.ADDITIONAL_CLIENT_COMMISSION
      peterCommission += (clientCount - 1) * rules.PETER_ADDITIONAL_CLIENT
    }
  }

  const totalSalary = baseSalary + commission
  const totalRevenue = clientCount * rules.CLIENT_PAYMENT
  const totalKtvFee = clientCount * rules.KTV_FEE
  const bossProfit = totalRevenue - totalKtvFee - totalSalary - peterCommission

  return {
    baseSalary,
    commission,
    totalSalary,
    peterCommission,
    bossProfit
  }
}
