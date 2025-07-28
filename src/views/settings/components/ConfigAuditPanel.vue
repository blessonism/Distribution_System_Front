<!--
/**
 * @fileoverview 配置审核面板组件
 * 基于Vue 3 Composition API构建的配置审核管理组件，提供配置变更对比、审核操作和审核历史功能
 * 支持等级规则、代理规则、返佣规则的统一审核流程，实时状态更新和操作反馈
 * 集成shadcn-vue对话框组件和响应式布局设计，确保最佳用户体验
 * 
 * @component ConfigAuditPanel
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.0.0
 * 
 * @description
 * ConfigAuditPanel组件是系统配置模块的审核管理组件，提供以下主要功能：
 * - 🔍 配置变更对比，支持变更前后的详细数据对比展示
 * - ✅ 审核操作界面，支持审核通过和拒绝操作
 * - 📝 审核意见录入，支持详细的审核意见和建议
 * - 📊 审核历史记录，展示完整的审核流程和状态变更
 * - 🔔 实时状态更新，审核操作后的即时反馈
 * - 🛡️ 权限控制，仅超级管理员可进行审核操作
 * - 📱 响应式设计，适配不同屏幕尺寸的设备
 * 
 * @usage
 * ```vue
 * <template>
 *   <ConfigAuditPanel
 *     :open="showAuditPanel"
 *     :audit-record="currentAuditRecord"
 *     @update:open="showAuditPanel = $event"
 *     @audit-complete="handleAuditComplete"
 *   />
 * </template>
 * ```
 */
-->

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center space-x-2">
          <ClipboardCheckIcon class="h-5 w-5" />
          <span>配置审核</span>
        </DialogTitle>
        <DialogDescription>
          审核配置变更并决定是否通过
        </DialogDescription>
      </DialogHeader>

      <div v-if="auditRecord" class="space-y-6">
        <!-- 审核基本信息 -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">审核信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label class="text-sm font-medium text-gray-600">配置类型</Label>
                <p class="text-sm">{{ getConfigTypeText(auditRecord.configType) }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-gray-600">提交人</Label>
                <p class="text-sm">{{ auditRecord.submitter }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-gray-600">提交时间</Label>
                <p class="text-sm">{{ formatDate(auditRecord.submittedAt) }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-gray-600">审核状态</Label>
                <Badge :variant="getStatusBadgeVariant(auditRecord.status)">
                  {{ getAuditStatusText(auditRecord.status) }}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 配置变更对比 -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg flex items-center space-x-2">
              <GitCompareIcon class="h-5 w-5" />
              <span>配置变更对比</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <!-- 变更类型选择 -->
              <div class="flex space-x-2">
                <Button
                  v-for="viewType in ['side-by-side', 'unified']"
                  :key="viewType"
                  type="button"
                  :variant="compareViewType === viewType ? 'default' : 'outline'"
                  size="sm"
                  @click="compareViewType = viewType"
                >
                  {{ viewType === 'side-by-side' ? '并排对比' : '统一视图' }}
                </Button>
              </div>

              <!-- 并排对比视图 -->
              <div v-if="compareViewType === 'side-by-side'" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- 当前配置 -->
                <div class="border rounded-lg p-4">
                  <h4 class="font-medium mb-3 text-green-700 flex items-center">
                    <CheckCircleIcon class="h-4 w-4 mr-2" />
                    当前配置
                  </h4>
                  <div class="bg-green-50 rounded-lg p-3 max-h-96 overflow-y-auto">
                    <pre class="text-sm text-green-800 whitespace-pre-wrap">{{ formatConfigForDisplay(currentConfig) }}</pre>
                  </div>
                </div>

                <!-- 待审核配置 -->
                <div class="border rounded-lg p-4">
                  <h4 class="font-medium mb-3 text-blue-700 flex items-center">
                    <ClockIcon class="h-4 w-4 mr-2" />
                    待审核配置
                  </h4>
                  <div class="bg-blue-50 rounded-lg p-3 max-h-96 overflow-y-auto">
                    <pre class="text-sm text-blue-800 whitespace-pre-wrap">{{ formatConfigForDisplay(auditRecord.configData) }}</pre>
                  </div>
                </div>
              </div>

              <!-- 统一视图 -->
              <div v-else class="space-y-4">
                <div class="border rounded-lg p-4">
                  <h4 class="font-medium mb-3">配置变更详情</h4>
                  <div class="space-y-2">
                    <div v-for="change in configChanges" :key="change.field" 
                         class="flex items-start space-x-3 p-2 rounded-lg"
                         :class="getChangeTypeClass(change.changeType)">
                      <div class="flex-shrink-0 mt-1">
                        <component :is="getChangeIcon(change.changeType)" class="h-4 w-4" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium">{{ change.field }}</p>
                        <div class="text-sm space-y-1">
                          <div v-if="change.changeType !== 'create'" class="flex items-center space-x-2">
                            <span class="text-gray-500">原值:</span>
                            <code class="bg-gray-100 px-1 rounded text-xs">{{ formatValue(change.oldValue) }}</code>
                          </div>
                          <div v-if="change.changeType !== 'delete'" class="flex items-center space-x-2">
                            <span class="text-gray-500">新值:</span>
                            <code class="bg-gray-100 px-1 rounded text-xs">{{ formatValue(change.newValue) }}</code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 审核操作 -->
        <Card v-if="auditRecord.status === 'pending' && canAudit">
          <CardHeader>
            <CardTitle class="text-lg">审核操作</CardTitle>
          </CardHeader>
          <CardContent>
            <Form @submit="handleAuditSubmit">
              <div class="space-y-4">
                <!-- 审核决策 -->
                <FormField v-slot="{ componentField }" name="action">
                  <FormItem>
                    <FormLabel>审核决策 *</FormLabel>
                    <FormControl>
                      <Select v-bind="componentField" v-model="auditForm.action">
                        <SelectTrigger>
                          <SelectValue placeholder="请选择审核决策" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approve">
                            <div class="flex items-center space-x-2">
                              <CheckIcon class="h-4 w-4 text-green-600" />
                              <span>审核通过</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="reject">
                            <div class="flex items-center space-x-2">
                              <XIcon class="h-4 w-4 text-red-600" />
                              <span>审核拒绝</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <!-- 审核意见 -->
                <FormField v-slot="{ componentField }" name="comment">
                  <FormItem>
                    <FormLabel>审核意见 *</FormLabel>
                    <FormControl>
                      <Textarea
                        v-bind="componentField"
                        v-model="auditForm.comment"
                        placeholder="请输入审核意见和建议"
                        rows="4"
                        class="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <!-- 操作按钮 -->
                <div class="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    @click="$emit('update:open', false)"
                    :disabled="loading"
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    :disabled="loading || !auditForm.action || !auditForm.comment.trim()"
                  >
                    <LoaderIcon v-if="loading" class="h-4 w-4 mr-2 animate-spin" />
                    <CheckIcon v-else class="h-4 w-4 mr-2" />
                    提交审核
                  </Button>
                </div>
              </div>
            </Form>
          </CardContent>
        </Card>

        <!-- 审核结果显示 -->
        <Card v-else-if="auditRecord.status !== 'pending'">
          <CardHeader>
            <CardTitle class="text-lg">审核结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div class="flex items-center space-x-3">
                <component 
                  :is="auditRecord.status === 'approved' ? CheckCircleIcon : XCircleIcon"
                  :class="auditRecord.status === 'approved' ? 'text-green-600' : 'text-red-600'"
                  class="h-5 w-5"
                />
                <span class="font-medium">
                  {{ auditRecord.status === 'approved' ? '审核通过' : '审核拒绝' }}
                </span>
              </div>
              <div v-if="auditRecord.auditor" class="text-sm text-gray-600">
                审核人: {{ auditRecord.auditor }}
              </div>
              <div v-if="auditRecord.auditedAt" class="text-sm text-gray-600">
                审核时间: {{ formatDate(auditRecord.auditedAt) }}
              </div>
              <div v-if="auditRecord.comment" class="mt-3">
                <Label class="text-sm font-medium text-gray-600">审核意见</Label>
                <div class="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p class="text-sm">{{ auditRecord.comment }}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 权限不足提示 -->
        <Card v-else-if="!canAudit">
          <CardContent class="pt-6">
            <div class="text-center py-8">
              <ShieldOffIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p class="text-gray-600">您没有权限进行配置审核</p>
              <p class="text-sm text-gray-500 mt-1">仅超级管理员可以审核配置变更</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- 无审核记录 -->
      <div v-else class="text-center py-8">
        <FileTextIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-600">暂无审核记录</p>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
/**
 * @fileoverview ConfigAuditPanel组件的核心逻辑实现
 * 使用Vue 3 Composition API实现配置审核面板的完整功能
 */
import { ref, reactive, computed, watch } from 'vue'
import {
  ClipboardCheckIcon, GitCompareIcon, CheckCircleIcon, ClockIcon,
  CheckIcon, XIcon, LoaderIcon, XCircleIcon, ShieldOffIcon, FileTextIcon,
  PlusIcon, MinusIcon, EditIcon
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Form, FormField, FormItem, FormLabel,
  FormControl, FormMessage
} from '@/components/ui/form'
import { useToast } from '@/components/ui/toast/use-toast'
import { useSystemConfigStore } from '@/store/systemConfig'
import { useUserStore } from '@/store/user'
import { useSystemConfigPermission } from '@/composables/useSystemConfigPermission'
import type {
  ConfigType,
  SystemConfig,
  AuditDecision,
  ConfigChange
} from '@/types/systemConfig'
import type { ConfigAuditRecord } from '@/api/systemConfig'
import dayjs from 'dayjs'

/**
 * 组件Props接口定义
 */
interface ConfigAuditPanelProps {
  /** 对话框是否打开 */
  open: boolean
  /** 审核记录 */
  auditRecord: ConfigAuditRecord | null
  /** 当前配置（用于对比） */
  currentConfig?: SystemConfig | null
}

/**
 * 组件Emits接口定义
 */
interface ConfigAuditPanelEmits {
  /** 更新对话框打开状态 */
  (e: 'update:open', value: boolean): void
  /** 审核完成事件 */
  (e: 'audit-complete', result: { success: boolean; action: string }): void
}

// Props和Emits定义
const props = withDefaults(defineProps<ConfigAuditPanelProps>(), {
  currentConfig: null
})

const emit = defineEmits<ConfigAuditPanelEmits>()

// 依赖注入
const { toast } = useToast()
const configStore = useSystemConfigStore()
const userStore = useUserStore()
const permission = useSystemConfigPermission()

// 响应式状态
const loading = ref(false)
const compareViewType = ref<'side-by-side' | 'unified'>('side-by-side')

/**
 * 审核表单数据
 */
const auditForm = reactive({
  action: '' as 'approve' | 'reject' | '',
  comment: ''
})

// 计算属性
const canAudit = computed(() => {
  return permission.canAudit.value
})

const configChanges = computed(() => {
  if (!props.auditRecord || !props.currentConfig) return []

  // 这里应该实现配置变更的详细对比逻辑
  // 为了演示，返回一些示例变更
  return generateConfigChanges(props.currentConfig, props.auditRecord.configData)
})

/**
 * 获取配置类型文本
 */
const getConfigTypeText = (type: ConfigType) => {
  const typeMap: Record<ConfigType, string> = {
    'level': '等级规则',
    'agent': '代理规则',
    'commission': '返佣规则'
  }
  return typeMap[type] || type
}

/**
 * 获取审核状态文本
 */
const getAuditStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': '待审核',
    'approved': '已通过',
    'rejected': '已驳回'
  }
  return statusMap[status] || status
}

/**
 * 获取状态徽章样式
 */
const getStatusBadgeVariant = (status: string) => {
  const variantMap: Record<string, string> = {
    'pending': 'secondary',
    'approved': 'default',
    'rejected': 'destructive'
  }
  return variantMap[status] || 'secondary'
}

/**
 * 格式化日期
 */
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * 格式化配置数据用于显示
 */
const formatConfigForDisplay = (config: SystemConfig) => {
  if (!config) return '无配置数据'

  try {
    // 创建一个更友好的显示格式
    const displayData = {
      配置类型: getConfigTypeText(config.type),
      配置版本: `v${config.version}`,
      配置状态: getStatusText(config.status),
      创建时间: formatDate(config.createdAt),
      更新时间: formatDate(config.updatedAt),
      规则数量: config.rules?.length || 0,
      规则详情: config.rules
    }
    return JSON.stringify(displayData, null, 2)
  } catch (error) {
    return '配置数据格式错误'
  }
}

/**
 * 获取配置状态文本
 */
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'draft': '草稿',
    'pending': '待审核',
    'active': '生效中',
    'archived': '已归档'
  }
  return statusMap[status] || status
}

/**
 * 格式化值用于显示
 */
const formatValue = (value: any) => {
  if (value === null || value === undefined) return '空'
  if (typeof value === 'object') {
    try {
      // 对于对象，使用更简洁的显示方式
      if (Array.isArray(value)) {
        return `[${value.length}项]`
      }
      return JSON.stringify(value, null, 1).replace(/\n\s*/g, ' ')
    } catch {
      return '[对象]'
    }
  }
  return String(value)
}

/**
 * 获取变更类型的样式类
 */
const getChangeTypeClass = (changeType: string) => {
  const classMap: Record<string, string> = {
    'create': 'bg-green-50 border-green-200',
    'update': 'bg-blue-50 border-blue-200',
    'delete': 'bg-red-50 border-red-200'
  }
  return classMap[changeType] || 'bg-gray-50 border-gray-200'
}

/**
 * 获取变更类型的图标
 */
const getChangeIcon = (changeType: string) => {
  const iconMap: Record<string, any> = {
    'create': PlusIcon,
    'update': EditIcon,
    'delete': MinusIcon
  }
  return iconMap[changeType] || EditIcon
}

/**
 * 生成配置变更记录
 * 对比两个配置对象，生成详细的变更记录
 */
const generateConfigChanges = (oldConfig: SystemConfig, newConfig: SystemConfig): ConfigChange[] => {
  const changes: ConfigChange[] = []

  if (!oldConfig || !newConfig) return changes

  // 简化的变更检测逻辑
  // 实际项目中应该实现更复杂的深度对比算法
  try {
    const oldRules = oldConfig.rules || []
    const newRules = newConfig.rules || []

    // 检查规则数量变化
    if (oldRules.length !== newRules.length) {
      changes.push({
        field: '规则数量',
        oldValue: oldRules.length,
        newValue: newRules.length,
        changeType: 'update'
      })
    }

    // 检查每个规则的变化
    newRules.forEach((newRule, index) => {
      const oldRule = oldRules[index]
      if (!oldRule) {
        changes.push({
          field: `规则${index + 1}`,
          oldValue: null,
          newValue: newRule,
          changeType: 'create'
        })
      } else {
        // 检查规则字段变化
        Object.keys(newRule).forEach(key => {
          if (JSON.stringify(oldRule[key]) !== JSON.stringify(newRule[key])) {
            changes.push({
              field: `规则${index + 1}.${key}`,
              oldValue: oldRule[key],
              newValue: newRule[key],
              changeType: 'update'
            })
          }
        })
      }
    })

    // 检查删除的规则
    if (oldRules.length > newRules.length) {
      for (let i = newRules.length; i < oldRules.length; i++) {
        changes.push({
          field: `规则${i + 1}`,
          oldValue: oldRules[i],
          newValue: null,
          changeType: 'delete'
        })
      }
    }
  } catch (error) {
    console.error('生成配置变更记录失败:', error)
  }

  return changes
}

/**
 * 处理审核提交
 */
const handleAuditSubmit = async () => {
  if (!props.auditRecord || !auditForm.action || !auditForm.comment.trim()) {
    toast({
      title: '表单验证失败',
      description: '请选择审核决策并填写审核意见',
      variant: 'destructive'
    })
    return
  }

  loading.value = true

  try {
    // 权限检查
    await permission.requirePermission('config:audit')

    const decision: AuditDecision = {
      action: auditForm.action,
      comment: auditForm.comment.trim(),
      auditorId: userStore.userInfo?.id || ''
    }

    await configStore.auditConfig(props.auditRecord.auditId, decision)

    emit('audit-complete', {
      success: true,
      action: auditForm.action
    })

    emit('update:open', false)

    toast({
      title: '审核成功',
      description: `配置${auditForm.action === 'approve' ? '已通过' : '已拒绝'}审核`,
      variant: 'default'
    })

    // 重置表单
    auditForm.action = ''
    auditForm.comment = ''
  } catch (error) {
    console.error('审核配置失败:', error)
    toast({
      title: '审核失败',
      description: error instanceof Error ? error.message : '审核过程中发生错误',
      variant: 'destructive'
    })

    emit('audit-complete', {
      success: false,
      action: auditForm.action
    })
  } finally {
    loading.value = false
  }
}

// 监听对话框关闭，重置表单
watch(
  () => props.open,
  (newOpen) => {
    if (!newOpen) {
      auditForm.action = ''
      auditForm.comment = ''
    }
  }
)
</script>
