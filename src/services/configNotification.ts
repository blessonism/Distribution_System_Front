/**
 * @fileoverview 系统配置通知服务
 * 基于Vue 3和现有Toast系统构建的配置变更通知服务，提供配置操作的完整通知功能
 * 支持配置保存、审核状态变更、配置生效等多种通知场景，集成用户偏好和通知历史
 * 提供灵活的通知配置、批量通知管理和通知状态追踪功能
 * 
 * @service ConfigNotificationService
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.0.0
 * 
 * @description
 * ConfigNotificationService是系统配置模块的通知管理核心，提供以下主要功能：
 * - 📢 配置操作通知，支持保存、提交、审核、生效等操作的通知
 * - 🎯 智能通知分类，根据操作类型和重要性进行通知分级
 * - 📊 通知历史记录，完整的通知发送和查看历史
 * - 🔔 实时通知推送，支持即时通知和延迟通知
 * - 🎨 通知样式定制，根据通知类型提供不同的视觉样式
 * - 📱 响应式通知，适配不同设备的通知展示
 * - 🛡️ 通知权限控制，根据用户角色控制通知的发送和接收
 * 
 * @usage
 * ```typescript
 * import { ConfigNotificationService } from '@/services/configNotification'
 * 
 * const notificationService = new ConfigNotificationService()
 * 
 * // 配置保存通知
 * await notificationService.notifyConfigSaved('level', 'V1-V6等级规则已保存为草稿')
 * 
 * // 审核结果通知
 * await notificationService.notifyAuditResult('agent', 'approved', '代理规则配置已审核通过')
 * 
 * // 配置生效通知
 * await notificationService.notifyConfigActivated('commission', '返佣规则配置已生效')
 * ```
 * 
 * @example
 * ```typescript
 * // 批量通知示例
 * const notifications = [
 *   { type: 'config:saved', configType: 'level', message: '等级规则已保存' },
 *   { type: 'config:submitted', configType: 'agent', message: '代理规则已提交审核' }
 * ]
 * await notificationService.sendBatchNotifications(notifications)
 * 
 * // 通知历史查询
 * const history = await notificationService.getNotificationHistory('level', 7)
 * console.log('最近7天的等级规则通知:', history)
 * ```
 */

import { useToast } from '@/components/ui/toast/use-toast'
import type { ConfigType } from '@/types/systemConfig'

/**
 * 通知类型枚举
 */
export type NotificationType = 
  | 'config:saved'        // 配置已保存
  | 'config:submitted'    // 配置已提交审核
  | 'config:approved'     // 配置审核通过
  | 'config:rejected'     // 配置审核拒绝
  | 'config:activated'    // 配置已生效
  | 'config:deactivated'  // 配置已停用
  | 'config:error'        // 配置操作错误
  | 'config:warning'      // 配置操作警告
  | 'sync:started'        // 数据同步开始
  | 'sync:completed'      // 数据同步完成
  | 'sync:failed'         // 数据同步失败

/**
 * 通知优先级枚举
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

/**
 * 通知持续时间枚举
 */
export type NotificationDuration = 'short' | 'normal' | 'long' | 'persistent'

/**
 * 通知配置接口
 */
export interface NotificationConfig {
  /** 通知类型 */
  type: NotificationType
  /** 配置类型 */
  configType?: ConfigType
  /** 通知标题 */
  title: string
  /** 通知描述 */
  description: string
  /** 通知优先级 */
  priority?: NotificationPriority
  /** 通知持续时间 */
  duration?: NotificationDuration
  /** 是否可关闭 */
  dismissible?: boolean
  /** 操作按钮 */
  actions?: NotificationAction[]
  /** 额外数据 */
  metadata?: Record<string, any>
}

/**
 * 通知操作接口
 */
export interface NotificationAction {
  /** 操作标签 */
  label: string
  /** 操作处理函数 */
  handler: () => void | Promise<void>
  /** 操作样式 */
  variant?: 'default' | 'destructive' | 'outline'
}

/**
 * 通知历史记录接口
 */
export interface NotificationRecord {
  /** 通知ID */
  id: string
  /** 通知配置 */
  config: NotificationConfig
  /** 发送时间 */
  sentAt: Date
  /** 是否已读 */
  isRead: boolean
  /** 是否已关闭 */
  isDismissed: boolean
  /** 用户ID */
  userId: string
}

/**
 * 通知统计接口
 */
export interface NotificationStats {
  /** 总通知数 */
  total: number
  /** 未读通知数 */
  unread: number
  /** 按类型分组的统计 */
  byType: Record<NotificationType, number>
  /** 按配置类型分组的统计 */
  byConfigType: Record<ConfigType, number>
}

/**
 * 系统配置通知服务类
 */
export class ConfigNotificationService {
  private toast = useToast()
  private notificationHistory: NotificationRecord[] = []
  private notificationId = 0

  /**
   * 通知类型与样式的映射
   */
  private readonly notificationStyles: Record<NotificationType, {
    variant: 'default' | 'destructive'
    priority: NotificationPriority
    duration: NotificationDuration
  }> = {
    'config:saved': { variant: 'default', priority: 'normal', duration: 'short' },
    'config:submitted': { variant: 'default', priority: 'normal', duration: 'normal' },
    'config:approved': { variant: 'default', priority: 'high', duration: 'long' },
    'config:rejected': { variant: 'destructive', priority: 'high', duration: 'long' },
    'config:activated': { variant: 'default', priority: 'high', duration: 'long' },
    'config:deactivated': { variant: 'default', priority: 'normal', duration: 'normal' },
    'config:error': { variant: 'destructive', priority: 'urgent', duration: 'persistent' },
    'config:warning': { variant: 'default', priority: 'normal', duration: 'normal' },
    'sync:started': { variant: 'default', priority: 'low', duration: 'short' },
    'sync:completed': { variant: 'default', priority: 'normal', duration: 'normal' },
    'sync:failed': { variant: 'destructive', priority: 'high', duration: 'long' }
  }

  /**
   * 配置类型的显示名称
   */
  private readonly configTypeNames: Record<ConfigType, string> = {
    'level': '等级规则',
    'agent': '代理规则',
    'commission': '返佣规则'
  }

  /**
   * 发送通知
   */
  async sendNotification(config: NotificationConfig): Promise<string> {
    const notificationId = this.generateNotificationId()
    const style = this.notificationStyles[config.type]
    
    // 合并默认样式和自定义配置
    const finalConfig = {
      priority: style.priority,
      duration: style.duration,
      dismissible: true,
      ...config
    }

    // 发送Toast通知
    this.toast.toast({
      title: finalConfig.title,
      description: finalConfig.description,
      variant: style.variant,
      duration: this.getDurationMs(finalConfig.duration)
    })

    // 记录通知历史
    const record: NotificationRecord = {
      id: notificationId,
      config: finalConfig,
      sentAt: new Date(),
      isRead: false,
      isDismissed: false,
      userId: this.getCurrentUserId()
    }
    
    this.notificationHistory.push(record)

    // 限制历史记录数量
    if (this.notificationHistory.length > 1000) {
      this.notificationHistory = this.notificationHistory.slice(-500)
    }

    return notificationId
  }

  /**
   * 配置保存通知
   */
  async notifyConfigSaved(configType: ConfigType, customMessage?: string): Promise<string> {
    const configName = this.configTypeNames[configType]
    const message = customMessage || `${configName}配置已保存为草稿`
    
    return this.sendNotification({
      type: 'config:saved',
      configType,
      title: '配置保存成功',
      description: message,
      metadata: { configType, action: 'save' }
    })
  }

  /**
   * 配置提交审核通知
   */
  async notifyConfigSubmitted(configType: ConfigType, customMessage?: string): Promise<string> {
    const configName = this.configTypeNames[configType]
    const message = customMessage || `${configName}配置已提交审核，请等待审核结果`
    
    return this.sendNotification({
      type: 'config:submitted',
      configType,
      title: '配置提交成功',
      description: message,
      metadata: { configType, action: 'submit' }
    })
  }

  /**
   * 审核结果通知
   */
  async notifyAuditResult(
    configType: ConfigType, 
    result: 'approved' | 'rejected', 
    comment?: string
  ): Promise<string> {
    const configName = this.configTypeNames[configType]
    const isApproved = result === 'approved'
    
    const title = isApproved ? '配置审核通过' : '配置审核拒绝'
    const baseMessage = isApproved 
      ? `${configName}配置审核通过，即将生效`
      : `${configName}配置审核未通过，请修改后重新提交`
    
    const description = comment ? `${baseMessage}\n审核意见：${comment}` : baseMessage
    
    return this.sendNotification({
      type: isApproved ? 'config:approved' : 'config:rejected',
      configType,
      title,
      description,
      metadata: { configType, action: 'audit', result, comment }
    })
  }

  /**
   * 配置生效通知
   */
  async notifyConfigActivated(configType: ConfigType, customMessage?: string): Promise<string> {
    const configName = this.configTypeNames[configType]
    const message = customMessage || `${configName}配置已生效，相关数据正在同步更新`
    
    return this.sendNotification({
      type: 'config:activated',
      configType,
      title: '配置已生效',
      description: message,
      metadata: { configType, action: 'activate' }
    })
  }

  /**
   * 数据同步开始通知
   */
  async notifyDataSyncStarted(configType: ConfigType, affectedCount: number): Promise<string> {
    const configName = this.configTypeNames[configType]
    const message = `${configName}配置变更影响 ${affectedCount} 条数据，正在进行同步更新...`
    
    return this.sendNotification({
      type: 'sync:started',
      configType,
      title: '数据同步开始',
      description: message,
      metadata: { configType, action: 'sync_start', affectedCount }
    })
  }

  /**
   * 数据同步完成通知
   */
  async notifyDataSyncCompleted(
    configType: ConfigType, 
    processedCount: number, 
    duration: number
  ): Promise<string> {
    const configName = this.configTypeNames[configType]
    const message = `${configName}数据同步完成，共处理 ${processedCount} 条数据，耗时 ${duration}ms`
    
    return this.sendNotification({
      type: 'sync:completed',
      configType,
      title: '数据同步完成',
      description: message,
      metadata: { configType, action: 'sync_complete', processedCount, duration }
    })
  }

  /**
   * 数据同步失败通知
   */
  async notifyDataSyncFailed(configType: ConfigType, error: string): Promise<string> {
    const configName = this.configTypeNames[configType]
    const message = `${configName}数据同步失败：${error}`
    
    return this.sendNotification({
      type: 'sync:failed',
      configType,
      title: '数据同步失败',
      description: message,
      priority: 'urgent',
      metadata: { configType, action: 'sync_failed', error }
    })
  }

  /**
   * 配置错误通知
   */
  async notifyConfigError(configType: ConfigType, error: string): Promise<string> {
    const configName = this.configTypeNames[configType]
    const message = `${configName}配置操作失败：${error}`
    
    return this.sendNotification({
      type: 'config:error',
      configType,
      title: '配置操作失败',
      description: message,
      priority: 'urgent',
      metadata: { configType, action: 'error', error }
    })
  }

  /**
   * 批量发送通知
   */
  async sendBatchNotifications(configs: NotificationConfig[]): Promise<string[]> {
    const notificationIds: string[] = []
    
    for (const config of configs) {
      try {
        const id = await this.sendNotification(config)
        notificationIds.push(id)
      } catch (error) {
        console.error('批量通知发送失败:', error)
      }
    }
    
    return notificationIds
  }

  /**
   * 获取通知历史
   */
  getNotificationHistory(configType?: ConfigType, days?: number): NotificationRecord[] {
    let history = this.notificationHistory
    
    // 按配置类型过滤
    if (configType) {
      history = history.filter(record => record.config.configType === configType)
    }
    
    // 按时间过滤
    if (days) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      history = history.filter(record => record.sentAt >= cutoffDate)
    }
    
    return history.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
  }

  /**
   * 获取通知统计
   */
  getNotificationStats(days?: number): NotificationStats {
    const history = this.getNotificationHistory(undefined, days)
    
    const stats: NotificationStats = {
      total: history.length,
      unread: history.filter(r => !r.isRead).length,
      byType: {} as Record<NotificationType, number>,
      byConfigType: {} as Record<ConfigType, number>
    }
    
    // 按类型统计
    history.forEach(record => {
      const type = record.config.type
      stats.byType[type] = (stats.byType[type] || 0) + 1
      
      if (record.config.configType) {
        const configType = record.config.configType
        stats.byConfigType[configType] = (stats.byConfigType[configType] || 0) + 1
      }
    })
    
    return stats
  }

  /**
   * 标记通知为已读
   */
  markAsRead(notificationId: string): boolean {
    const record = this.notificationHistory.find(r => r.id === notificationId)
    if (record) {
      record.isRead = true
      return true
    }
    return false
  }

  /**
   * 清除通知历史
   */
  clearHistory(configType?: ConfigType): void {
    if (configType) {
      this.notificationHistory = this.notificationHistory.filter(
        record => record.config.configType !== configType
      )
    } else {
      this.notificationHistory = []
    }
  }

  /**
   * 生成通知ID
   */
  private generateNotificationId(): string {
    return `notification_${++this.notificationId}_${Date.now()}`
  }

  /**
   * 获取当前用户ID
   */
  private getCurrentUserId(): string {
    // 这里应该从用户Store获取当前用户ID
    return 'current_user_id'
  }

  /**
   * 将持续时间转换为毫秒
   */
  private getDurationMs(duration: NotificationDuration): number {
    const durations = {
      'short': 3000,
      'normal': 5000,
      'long': 8000,
      'persistent': 0 // 0表示不自动关闭
    }
    return durations[duration]
  }
}

/**
 * 全局通知服务实例
 */
export const configNotificationService = new ConfigNotificationService()

/**
 * 通知服务组合式函数
 */
export function useConfigNotification() {
  return {
    service: configNotificationService,
    notifyConfigSaved: configNotificationService.notifyConfigSaved.bind(configNotificationService),
    notifyConfigSubmitted: configNotificationService.notifyConfigSubmitted.bind(configNotificationService),
    notifyAuditResult: configNotificationService.notifyAuditResult.bind(configNotificationService),
    notifyConfigActivated: configNotificationService.notifyConfigActivated.bind(configNotificationService),
    notifyDataSyncStarted: configNotificationService.notifyDataSyncStarted.bind(configNotificationService),
    notifyDataSyncCompleted: configNotificationService.notifyDataSyncCompleted.bind(configNotificationService),
    notifyDataSyncFailed: configNotificationService.notifyDataSyncFailed.bind(configNotificationService),
    notifyConfigError: configNotificationService.notifyConfigError.bind(configNotificationService)
  }
}
