import { supabase, SettingsTemplate } from './supabase'

export class SettingsTemplateService {
  // 获取用户自定义模板（不包含系统模板）
  static async getAll(userId?: number): Promise<SettingsTemplate[]> {
    let query = supabase
      .from('settings_templates')
      .select('*')
      .eq('is_global', false) // 只获取用户自定义模板
      .order('created_at', { ascending: false })

    if (userId && userId > 0) {
      // 只有有效的用户ID才查询用户模板
      query = query.eq('user_id', userId)
    } else {
      // 对于临时管理员（ID=0）或无用户ID，查询user_id为null的模板
      query = query.is('user_id', null)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  // 获取全局模板
  static async getGlobalTemplates(): Promise<SettingsTemplate[]> {
    const { data, error } = await supabase
      .from('settings_templates')
      .select('*')
      .eq('is_global', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // 获取用户自定义模板
  static async getUserTemplates(userId: number): Promise<SettingsTemplate[]> {
    const { data, error } = await supabase
      .from('settings_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_global', false)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // 创建新模板
  static async create(template: {
    name: string
    description?: string
    template_data: {
      base_salary: number
      first_client_bonus: number
      additional_client_bonus: number
      no_client_salary: number
      peter_first_client: number
      peter_additional_client: number
    }
    user_id?: number
    is_global?: boolean
  }): Promise<SettingsTemplate> {
    const { data, error } = await supabase
      .from('settings_templates')
      .insert({
        name: template.name,
        description: template.description || null,
        template_data: template.template_data,
        user_id: template.user_id || null,
        is_global: template.is_global || false
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 更新模板
  static async update(id: number, updates: {
    name?: string
    description?: string
    template_data?: {
      base_salary: number
      first_client_bonus: number
      additional_client_bonus: number
      no_client_salary: number
      peter_first_client: number
      peter_additional_client: number
    }
  }): Promise<SettingsTemplate> {
    const { data, error } = await supabase
      .from('settings_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 删除模板
  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('settings_templates')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // 根据ID获取模板
  static async getById(id: number): Promise<SettingsTemplate | null> {
    const { data, error } = await supabase
      .from('settings_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // 未找到记录
      throw error
    }
    return data
  }

  // 应用模板到当前设置
  static async applyTemplate(templateId: number, userId?: number): Promise<void> {
    const template = await this.getById(templateId)
    if (!template) throw new Error('模板不存在')

    // 映射模板数据到正确的设置键名
    const settingsData = [
      { key: 'BASE_SALARY_WITH_CLIENT', value: template.template_data.base_salary },
      { key: 'FIRST_CLIENT_COMMISSION', value: template.template_data.first_client_bonus },
      { key: 'ADDITIONAL_CLIENT_COMMISSION', value: template.template_data.additional_client_bonus },
      { key: 'BASE_SALARY_NO_CLIENT', value: template.template_data.no_client_salary },
      { key: 'PETER_FIRST_CLIENT', value: template.template_data.peter_first_client },
      { key: 'PETER_ADDITIONAL_CLIENT', value: template.template_data.peter_additional_client }
    ]

    // 更新设置
    for (const setting of settingsData) {
      const updateData: Record<string, unknown> = {
        key: setting.key,
        value: setting.value
      }

      if (userId) {
        updateData.user_id = userId
      }

      const { error } = await supabase
        .from('settings')
        .upsert(updateData, {
          onConflict: userId ? 'key,user_id' : 'key',
          ignoreDuplicates: false
        })

      if (error) throw error
    }
  }

  // 从当前设置创建模板
  static async createFromCurrentSettings(
    name: string,
    description: string,
    userId?: number
  ): Promise<SettingsTemplate> {
    // 获取当前设置
    let query = supabase
      .from('settings')
      .select('key, value')

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`)
    } else {
      query = query.is('user_id', null)
    }

    const { data: settings, error } = await query

    if (error) throw error

    // 构建模板数据，使用默认值
    const templateData = {
      base_salary: 350,
      first_client_bonus: 200,
      additional_client_bonus: 300,
      no_client_salary: 100,
      peter_first_client: 50,
      peter_additional_client: 100
    }

    // 设置键名映射
    const keyMapping: Record<string, keyof typeof templateData> = {
      'BASE_SALARY_WITH_CLIENT': 'base_salary',
      'FIRST_CLIENT_COMMISSION': 'first_client_bonus',
      'ADDITIONAL_CLIENT_COMMISSION': 'additional_client_bonus',
      'BASE_SALARY_NO_CLIENT': 'no_client_salary',
      'PETER_FIRST_CLIENT': 'peter_first_client',
      'PETER_ADDITIONAL_CLIENT': 'peter_additional_client'
    }

    // 从设置中更新模板数据
    settings?.forEach(setting => {
      const templateKey = keyMapping[setting.key]
      if (templateKey) {
        templateData[templateKey] = setting.value
      }
    })

    return this.create({
      name,
      description,
      template_data: templateData,
      user_id: (userId && userId > 0) ? userId : null, // 临时管理员保存为全局模板
      is_global: false
    })
  }
}
