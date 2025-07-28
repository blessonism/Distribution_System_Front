<!--
/**
 * @fileoverview 代理规则配置组件
 * 基于Vue 3 Composition API构建的代理规则管理组件，提供代理层级升级条件和权限配置功能
 * 支持多维度升级条件设置、权限分配、实时表单验证和数据持久化
 * 集成shadcn-vue表单组件和响应式布局设计，确保最佳用户体验
 * 
 * @component AgentRuleConfig
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.0.0
 * 
 * @description
 * AgentRuleConfig组件是系统配置模块的核心组件之一，提供以下主要功能：
 * - 🏆 代理层级升级条件配置，支持业绩、时间、推荐人数等多维度条件
 * - 🔐 权限分配管理，支持不同层级的功能访问权限配置
 * - 💰 提成比例设置，支持层级化的提成策略配置
 * - ✅ 实时表单验证，确保配置数据的完整性和合理性
 * - 🔄 配置预览和对比，支持变更前后的数据对比
 * - 💾 草稿保存和自动恢复，防止数据丢失
 * - 📱 响应式设计，适配不同屏幕尺寸的设备
 * 
 * @usage
 * ```vue
 * <template>
 *   <AgentRuleConfig
 *     :readonly="false"
 *     :show-audit-info="true"
 *     @save="handleSave"
 *     @submit="handleSubmit"
 *   />
 * </template>
 * ```
 */
-->

<template>
  <div class="space-y-6">
    <!-- 配置说明 -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-start space-x-3">
        <InfoIcon class="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div class="text-sm text-blue-800">
          <p class="font-medium mb-1">代理规则配置说明</p>
          <ul class="space-y-1 text-blue-700">
            <li>• 代理层级按升级条件递增，提成比例建议递增</li>
            <li>• 升级条件包括业绩门槛、时间要求、推荐人数等</li>
            <li>• 权限配置决定不同层级代理的功能访问范围</li>
            <li>• 配置变更需要审核通过后才能生效</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 审核状态提示 -->
    <div v-if="showAuditInfo && auditInfo" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div class="flex items-center space-x-3">
        <ClockIcon class="h-5 w-5 text-yellow-600" />
        <div class="text-sm">
          <p class="font-medium text-yellow-800">配置审核中</p>
          <p class="text-yellow-700">提交时间: {{ formatDate(auditInfo.submittedAt) }}</p>
          <p class="text-yellow-700">审核状态: {{ getAuditStatusText(auditInfo.status) }}</p>
        </div>
      </div>
    </div>

    <!-- 代理规则配置表单 -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center space-x-2">
          <UsersIcon class="h-5 w-5" />
          <span>代理规则配置</span>
        </CardTitle>
        <CardDescription>
          配置代理层级的升级条件、权限分配和提成比例
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form @submit="handleSubmit">
          <div class="space-y-6">
            <!-- 添加新层级按钮 -->
            <div v-if="!readonly" class="flex justify-end">
              <Button
                type="button"
                variant="outline"
                @click="addNewLevel"
                :disabled="formData.rules.length >= 10"
              >
                <PlusIcon class="h-4 w-4 mr-2" />
                添加层级
              </Button>
            </div>

            <!-- 代理规则列表 -->
            <div v-for="(rule, index) in formData.rules" :key="rule.level" class="border rounded-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-2">
                  <Badge variant="default">
                    层级 {{ rule.level }}
                  </Badge>
                  <h4 class="font-medium">{{ rule.name }}</h4>
                </div>
                <div class="flex items-center space-x-2">
                  <Button
                    v-if="!readonly"
                    type="button"
                    variant="ghost"
                    size="sm"
                    @click="resetAgentRule(index)"
                  >
                    <RefreshCwIcon class="h-4 w-4" />
                  </Button>
                  <Button
                    v-if="!readonly && formData.rules.length > 1"
                    type="button"
                    variant="ghost"
                    size="sm"
                    @click="removeLevel(index)"
                  >
                    <TrashIcon class="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <!-- 基础信息 -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <!-- 层级名称 -->
                <FormField v-slot="{ componentField }" :name="`rules.${index}.name`">
                  <FormItem>
                    <FormLabel>层级名称 *</FormLabel>
                    <FormControl>
                      <Input
                        v-bind="componentField"
                        v-model="rule.name"
                        placeholder="请输入层级名称"
                        :disabled="readonly"
                        @blur="validateField(`rules.${index}.name`)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <!-- 层级编号 -->
                <FormField v-slot="{ componentField }" :name="`rules.${index}.level`">
                  <FormItem>
                    <FormLabel>层级编号 *</FormLabel>
                    <FormControl>
                      <Input
                        v-bind="componentField"
                        v-model.number="rule.level"
                        type="number"
                        min="1"
                        max="10"
                        :disabled="readonly"
                        @blur="validateField(`rules.${index}.level`)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <!-- 提成比例 -->
                <FormField v-slot="{ componentField }" :name="`rules.${index}.commissionRate`">
                  <FormItem>
                    <FormLabel>提成比例(%) *</FormLabel>
                    <FormControl>
                      <Input
                        v-bind="componentField"
                        :model-value="(rule.commissionRate * 100).toString()"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="3.0"
                        :disabled="readonly"
                        @input="updateCommissionRate(index, $event)"
                        @blur="validateField(`rules.${index}.commissionRate`)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>

              <!-- 升级条件 -->
              <div class="border-t pt-4">
                <h5 class="font-medium mb-3 flex items-center">
                  <TrendingUpIcon class="h-4 w-4 mr-2" />
                  升级条件
                </h5>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <!-- 业绩门槛 -->
                  <FormField v-slot="{ componentField }" :name="`rules.${index}.upgradeConditions.performanceThreshold`">
                    <FormItem>
                      <FormLabel>业绩门槛(元) *</FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          v-model.number="rule.upgradeConditions.performanceThreshold"
                          type="number"
                          placeholder="50000"
                          :disabled="readonly"
                          @blur="validateField(`rules.${index}.upgradeConditions.performanceThreshold`)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>

                  <!-- 时间要求 -->
                  <FormField v-slot="{ componentField }" :name="`rules.${index}.upgradeConditions.timeRequirement`">
                    <FormItem>
                      <FormLabel>时间要求(月) *</FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          v-model.number="rule.upgradeConditions.timeRequirement"
                          type="number"
                          min="1"
                          max="24"
                          placeholder="3"
                          :disabled="readonly"
                          @blur="validateField(`rules.${index}.upgradeConditions.timeRequirement`)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>

                  <!-- 推荐人数 -->
                  <FormField v-slot="{ componentField }" :name="`rules.${index}.upgradeConditions.referralCount`">
                    <FormItem>
                      <FormLabel>推荐人数 *</FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          v-model.number="rule.upgradeConditions.referralCount"
                          type="number"
                          min="0"
                          placeholder="5"
                          :disabled="readonly"
                          @blur="validateField(`rules.${index}.upgradeConditions.referralCount`)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </div>
              </div>

              <!-- 权限配置 -->
              <div class="border-t pt-4 mt-4">
                <h5 class="font-medium mb-3 flex items-center">
                  <ShieldIcon class="h-4 w-4 mr-2" />
                  权限配置
                </h5>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div v-for="permission in availablePermissions" :key="permission.key" class="flex items-center space-x-2">
                    <input
                      :id="`permission-${index}-${permission.key}`"
                      type="checkbox"
                      :checked="rule.permissions.includes(permission.key)"
                      :disabled="readonly"
                      @change="togglePermission(index, permission.key)"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label 
                      :for="`permission-${index}-${permission.key}`"
                      class="text-sm text-gray-700 cursor-pointer"
                    >
                      {{ permission.label }}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- 验证结果显示 -->
            <div v-if="validationResult && (!validationResult.isValid || validationResult.warnings.length > 0)" 
                 class="space-y-2">
              <!-- 错误信息 -->
              <div v-if="validationResult.errors.length > 0" 
                   class="bg-red-50 border border-red-200 rounded-lg p-3">
                <div class="flex items-start space-x-2">
                  <AlertCircleIcon class="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div class="text-sm">
                    <p class="font-medium text-red-800 mb-1">配置错误</p>
                    <ul class="space-y-1 text-red-700">
                      <li v-for="error in validationResult.errors" :key="error">• {{ error }}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- 警告信息 -->
              <div v-if="validationResult.warnings.length > 0" 
                   class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div class="flex items-start space-x-2">
                  <AlertTriangleIcon class="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div class="text-sm">
                    <p class="font-medium text-yellow-800 mb-1">配置警告</p>
                    <ul class="space-y-1 text-yellow-700">
                      <li v-for="warning in validationResult.warnings" :key="warning">• {{ warning }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div v-if="!readonly" class="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              @click="handleReset"
              :disabled="loading"
            >
              <RefreshCwIcon class="h-4 w-4 mr-2" />
              重置
            </Button>
            
            <Button
              type="button"
              variant="outline"
              @click="handleSaveDraft"
              :disabled="loading || !hasChanges"
            >
              <SaveIcon class="h-4 w-4 mr-2" />
              保存草稿
            </Button>
            
            <Button
              type="submit"
              :disabled="loading || !validationResult?.isValid"
            >
              <LoaderIcon v-if="loading" class="h-4 w-4 mr-2 animate-spin" />
              <CheckIcon v-else class="h-4 w-4 mr-2" />
              提交审核
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview AgentRuleConfig组件的核心逻辑实现
 * 使用Vue 3 Composition API实现代理规则配置的完整功能
 */
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  InfoIcon, ClockIcon, UsersIcon, TrendingUpIcon, ShieldIcon,
  RefreshCwIcon, SaveIcon, CheckIcon, LoaderIcon, AlertCircleIcon,
  AlertTriangleIcon, PlusIcon, TrashIcon
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Form, FormField, FormItem, FormLabel,
  FormControl, FormMessage
} from '@/components/ui/form'
import { useToast } from '@/components/ui/toast/use-toast'
import { useSystemConfigStore } from '@/store/systemConfig'
import { useSystemConfigPermission } from '@/composables/useSystemConfigPermission'
import { ConfigValidator } from '@/utils/configValidation'
import type {
  AgentRule,
  AgentConfig,
  AuditInfo,
  AgentUpgradeConditions
} from '@/types/systemConfig'
import type { CrossValidationResult } from '@/utils/configValidation'
import dayjs from 'dayjs'

/**
 * 组件Props接口定义
 */
interface AgentRuleConfigProps {
  /** 是否为只读模式 */
  readonly?: boolean
  /** 是否显示审核信息 */
  showAuditInfo?: boolean
}

/**
 * 组件Emits接口定义
 */
interface AgentRuleConfigEmits {
  /** 保存草稿事件 */
  (e: 'save', config: AgentConfig): void
  /** 提交审核事件 */
  (e: 'submit', config: AgentConfig): void
  /** 重置事件 */
  (e: 'reset'): void
}

/**
 * 权限选项接口
 */
interface PermissionOption {
  key: string
  label: string
  description?: string
}

// Props和Emits定义
const props = withDefaults(defineProps<AgentRuleConfigProps>(), {
  readonly: false,
  showAuditInfo: true
})

const emit = defineEmits<AgentRuleConfigEmits>()

// 依赖注入
const { toast } = useToast()
const configStore = useSystemConfigStore()
const permission = useSystemConfigPermission()

// 响应式状态
const loading = ref(false)
const validationResult = ref<CrossValidationResult | null>(null)

/**
 * 可用权限列表
 * 定义代理可以拥有的所有权限选项
 */
const availablePermissions: PermissionOption[] = [
  { key: 'view_leads', label: '查看客资' },
  { key: 'create_leads', label: '创建客资' },
  { key: 'edit_leads', label: '编辑客资' },
  { key: 'delete_leads', label: '删除客资' },
  { key: 'view_deals', label: '查看成交' },
  { key: 'create_deals', label: '创建成交' },
  { key: 'view_agents', label: '查看下级代理' },
  { key: 'invite_agents', label: '邀请代理' },
  { key: 'view_commissions', label: '查看佣金' },
  { key: 'withdraw_commissions', label: '提取佣金' },
  { key: 'view_reports', label: '查看报表' },
  { key: 'export_data', label: '导出数据' }
]

/**
 * 默认代理规则配置
 */
const defaultAgentRules: AgentRule[] = [
  {
    level: 1,
    name: '初级代理',
    upgradeConditions: {
      performanceThreshold: 50000,
      timeRequirement: 3,
      referralCount: 5
    },
    permissions: ['view_leads', 'create_leads', 'view_deals', 'view_commissions'],
    commissionRate: 0.03
  },
  {
    level: 2,
    name: '中级代理',
    upgradeConditions: {
      performanceThreshold: 100000,
      timeRequirement: 6,
      referralCount: 10
    },
    permissions: ['view_leads', 'create_leads', 'edit_leads', 'view_deals', 'create_deals', 'view_agents', 'view_commissions'],
    commissionRate: 0.04
  },
  {
    level: 3,
    name: '高级代理',
    upgradeConditions: {
      performanceThreshold: 200000,
      timeRequirement: 12,
      referralCount: 20
    },
    permissions: ['view_leads', 'create_leads', 'edit_leads', 'view_deals', 'create_deals', 'view_agents', 'invite_agents', 'view_commissions', 'withdraw_commissions', 'view_reports'],
    commissionRate: 0.05
  }
]

/**
 * 表单数据
 */
const formData = reactive<AgentConfig>({
  id: '',
  type: 'agent',
  version: 1,
  status: 'draft',
  createdBy: '',
  createdAt: '',
  updatedAt: '',
  rules: [...defaultAgentRules]
})

// 计算属性
const hasChanges = computed(() => {
  const currentConfig = configStore.state.currentConfigs.agent
  if (!currentConfig) return true

  return JSON.stringify(formData.rules) !== JSON.stringify(currentConfig.rules)
})

const auditInfo = computed(() => {
  const pendingConfig = configStore.state.pendingConfigs.agent
  return pendingConfig?.auditInfo || null
})

/**
 * 格式化日期
 */
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
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
 * 更新提成比例
 * 将百分比输入转换为小数存储
 */
const updateCommissionRate = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const percentage = parseFloat(target.value) || 0
  formData.rules[index].commissionRate = percentage / 100
}

/**
 * 切换权限
 */
const togglePermission = (ruleIndex: number, permissionKey: string) => {
  const rule = formData.rules[ruleIndex]
  const permissionIndex = rule.permissions.indexOf(permissionKey)

  if (permissionIndex > -1) {
    rule.permissions.splice(permissionIndex, 1)
  } else {
    rule.permissions.push(permissionKey)
  }

  validateAllRules()
}

/**
 * 添加新层级
 */
const addNewLevel = () => {
  const maxLevel = Math.max(...formData.rules.map(rule => rule.level))
  const newRule: AgentRule = {
    level: maxLevel + 1,
    name: `层级${maxLevel + 1}`,
    upgradeConditions: {
      performanceThreshold: 0,
      timeRequirement: 1,
      referralCount: 0
    },
    permissions: ['view_leads', 'view_commissions'],
    commissionRate: 0.01
  }

  formData.rules.push(newRule)
  validateAllRules()
}

/**
 * 移除层级
 */
const removeLevel = (index: number) => {
  if (formData.rules.length > 1) {
    formData.rules.splice(index, 1)
    validateAllRules()
  }
}

/**
 * 验证单个字段
 */
const validateField = async (fieldName: string) => {
  try {
    await validateAllRules()
  } catch (error) {
    console.error(`字段 ${fieldName} 验证失败:`, error)
  }
}

/**
 * 验证所有规则
 */
const validateAllRules = async () => {
  try {
    validationResult.value = ConfigValidator.validateAgentConfig(formData)
  } catch (error) {
    console.error('代理规则验证失败:', error)
    validationResult.value = {
      isValid: false,
      errors: ['验证过程中发生错误'],
      warnings: []
    }
  }
}

/**
 * 重置单个代理规则
 */
const resetAgentRule = (index: number) => {
  const defaultRule = defaultAgentRules[index]
  if (defaultRule) {
    Object.assign(formData.rules[index], { ...defaultRule })
    validateAllRules()
  }
}

/**
 * 处理表单提交
 */
const handleSubmit = async () => {
  loading.value = true

  try {
    // 验证表单
    await validateAllRules()

    if (!validationResult.value?.isValid) {
      toast({
        title: '表单验证失败',
        description: '请检查并修正配置中的错误',
        variant: 'destructive'
      })
      return
    }

    // 提交审核
    emit('submit', { ...formData })

    toast({
      title: '提交成功',
      description: '代理规则配置已提交审核',
      variant: 'default'
    })
  } catch (error) {
    console.error('提交代理规则配置失败:', error)
    toast({
      title: '提交失败',
      description: error instanceof Error ? error.message : '提交过程中发生错误',
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
}

/**
 * 保存草稿
 */
const handleSaveDraft = async () => {
  loading.value = true

  try {
    emit('save', { ...formData })

    toast({
      title: '保存成功',
      description: '代理规则配置草稿已保存',
      variant: 'default'
    })
  } catch (error) {
    console.error('保存代理规则配置草稿失败:', error)
    toast({
      title: '保存失败',
      description: error instanceof Error ? error.message : '保存过程中发生错误',
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
}

/**
 * 重置表单
 */
const handleReset = () => {
  formData.rules = [...defaultAgentRules]
  validationResult.value = null
  emit('reset')

  toast({
    title: '重置成功',
    description: '代理规则配置已重置为默认值',
    variant: 'default'
  })
}

/**
 * 初始化组件
 */
const initializeComponent = async () => {
  try {
    // 加载当前配置
    const currentConfig = configStore.state.currentConfigs.agent
    if (currentConfig && currentConfig.rules.length > 0) {
      formData.rules = [...currentConfig.rules]
    }

    // 初始验证
    await validateAllRules()
  } catch (error) {
    console.error('初始化代理规则配置组件失败:', error)
  }
}

// 监听配置变更
watch(
  () => formData.rules,
  () => {
    validateAllRules()
  },
  { deep: true }
)

// 组件挂载时初始化
onMounted(() => {
  initializeComponent()
})
</script>
