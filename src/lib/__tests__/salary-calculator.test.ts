// 业务常量
const BUSINESS_RULES = {
  CLIENT_PAYMENT: 900,
  KTV_FEE: 120,
  BASE_SALARY_WITH_CLIENT: 350,
  BASE_SALARY_NO_CLIENT: 100,
  FIRST_CLIENT_COMMISSION: 200,
  ADDITIONAL_CLIENT_COMMISSION: 300,
  PETER_FIRST_CLIENT: 50,
  PETER_ADDITIONAL_CLIENT: 100,
}

// 工资计算函数
function calculateSalary(clientCount: number, isWorking: boolean) {
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
    ? BUSINESS_RULES.BASE_SALARY_WITH_CLIENT
    : BUSINESS_RULES.BASE_SALARY_NO_CLIENT

  let commission = 0
  let peterCommission = 0

  if (clientCount > 0) {
    commission += BUSINESS_RULES.FIRST_CLIENT_COMMISSION
    peterCommission += BUSINESS_RULES.PETER_FIRST_CLIENT

    if (clientCount > 1) {
      commission += (clientCount - 1) * BUSINESS_RULES.ADDITIONAL_CLIENT_COMMISSION
      peterCommission += (clientCount - 1) * BUSINESS_RULES.PETER_ADDITIONAL_CLIENT
    }
  }

  const totalSalary = baseSalary + commission
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

describe('工资计算测试', () => {
  test('员工不上班时工资为0', () => {
    const result = calculateSalary(0, false)
    expect(result.baseSalary).toBe(0)
    expect(result.commission).toBe(0)
    expect(result.totalSalary).toBe(0)
    expect(result.peterCommission).toBe(0)
    expect(result.bossProfit).toBe(0)
  })

  test('员工上班但无客人时工资为100元', () => {
    const result = calculateSalary(0, true)
    expect(result.baseSalary).toBe(100)
    expect(result.commission).toBe(0)
    expect(result.totalSalary).toBe(100)
    expect(result.peterCommission).toBe(0)
    expect(result.bossProfit).toBe(-100) // 亏损100元
  })

  test('员工陪1次客人的工资计算', () => {
    const result = calculateSalary(1, true)
    expect(result.baseSalary).toBe(350)
    expect(result.commission).toBe(200)
    expect(result.totalSalary).toBe(550)
    expect(result.peterCommission).toBe(50)
    expect(result.bossProfit).toBe(180) // 900 - 120 - 550 - 50 = 180
  })

  test('员工陪2次客人的工资计算', () => {
    const result = calculateSalary(2, true)
    expect(result.baseSalary).toBe(350)
    expect(result.commission).toBe(500) // 200 + 300
    expect(result.totalSalary).toBe(850)
    expect(result.peterCommission).toBe(150) // 50 + 100
    expect(result.bossProfit).toBe(560) // 1800 - 240 - 850 - 150 = 560
  })

  test('员工陪3次客人的工资计算', () => {
    const result = calculateSalary(3, true)
    expect(result.baseSalary).toBe(350)
    expect(result.commission).toBe(800) // 200 + 300 + 300
    expect(result.totalSalary).toBe(1150)
    expect(result.peterCommission).toBe(250) // 50 + 100 + 100
    expect(result.bossProfit).toBe(940) // 2700 - 360 - 1150 - 250 = 940
  })
})
