import { supabase, SettingsTemplate } from './supabase'

export class SettingsTemplateService {
  // 获取所有模板（全局模板 + 用户自定义模板）
  static async getAll(userId?: number): Promise<SettingsTemplate[]> {
    let query = supabase
      .from('settings_templates')
      .select('*')
      .order('is_global', { ascending: false })
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.or(`is_global.eq.true,user_id.eq.${userId}`)
    } else {
      query = query.eq('is_global', true)
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

    const settingsData = [
      { key: 'base_salary', value: template.template_data.base_salary },
      { key: 'first_client_bonus', value: template.template_data.first_client_bonus },
      { key: 'additional_client_bonus', value: template.template_data.additional_client_bonus },
      { key: 'no_client_salary', value: template.template_data.no_client_salary },
      { key: 'peter_first_client', value: template.template_data.peter_first_client },
      { key: 'peter_additional_client', value: template.template_data.peter_additional_client }
    ]

    // 更新设置
    for (const setting of settingsData) {
      const updateData: any = {
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

    // 构建模板数据
    const templateData = {
      base_salary: 350,
      first_client_bonus: 200,
      additional_client_bonus: 300,
      no_client_salary: 100,
      peter_first_client: 50,
      peter_additional_client: 100
    }

    // 从设置中更新模板数据
    settings?.forEach(setting => {
      if (setting.key in templateData) {
        (templateData as any)[setting.key] = setting.value
      }
    })

    return this.create({
      name,
      description,
      template_data: templateData,
      user_id: userId,
      is_global: false
    })
  }
}
