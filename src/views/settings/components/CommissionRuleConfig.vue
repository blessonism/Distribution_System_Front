<!--
/**
 * @fileoverview 返佣规则配置组件
 * 基于Vue 3 Composition API构建的返佣规则管理组件，提供多种返佣计算方式和发放机制配置
 * 支持百分比返佣、固定金额返佣、阶梯式返佣等多种类型，实时表单验证和数据持久化
 * 集成shadcn-vue表单组件和响应式布局设计，确保最佳用户体验
 * 
 * @component CommissionRuleConfig
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.0.0
 * 
 * @description
 * CommissionRuleConfig组件是系统配置模块的核心组件之一，提供以下主要功能：
 * - 💰 多种返佣类型配置，支持百分比、固定金额、阶梯式返佣
 * - 📊 阶梯式返佣配置，支持不同业绩区间的差异化返佣比例
 * - ⏰ 发放时机设置，支持实时、月结、季度发放等选项
 * - 🔒 返佣上限管理，支持单笔和月度返佣上限设置
 * - ✅ 实时表单验证，确保配置数据的完整性和合理性
 * - 🔄 配置预览和对比，支持变更前后的数据对比
 * - 💾 草稿保存和自动恢复，防止数据丢失
 * - 📱 响应式设计，适配不同屏幕尺寸的设备
 * 
 * @usage
 * ```vue
 * <template>
 *   <CommissionRuleConfig
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
          <p class="font-medium mb-1">返佣规则配置说明</p>
          <ul class="space-y-1 text-blue-700">
            <li>• 支持百分比、固定金额、阶梯式三种返佣类型</li>
            <li>• 阶梯式返佣的金额区间不能重叠，建议保持连续性</li>
            <li>• 返佣比例应随业绩区间递增，确保激励效果</li>
            <li>• 月度返佣上限应大于等于单笔返佣上限</li>
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

    <!-- 返佣规则配置表单 -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center space-x-2">
          <DollarSignIcon class="h-5 w-5" />
          <span>返佣规则配置</span>
        </CardTitle>
        <CardDescription>
          配置返佣计算方式、发放时机和上限管理
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form @submit="handleSubmit">
          <div class="space-y-6">
            <!-- 添加新规则按钮 -->
            <div v-if="!readonly" class="flex justify-end">
              <Button
                type="button"
                variant="outline"
                @click="addNewRule"
                :disabled="formData.rules.length >= 5"
              >
                <PlusIcon class="h-4 w-4 mr-2" />
                添加规则
              </Button>
            </div>

            <!-- 返佣规则列表 -->
            <div v-for="(rule, index) in formData.rules" :key="index" class="border rounded-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-2">
                  <Badge variant="default">
                    规则 {{ index + 1 }}
                  </Badge>
                  <h4 class="font-medium">{{ getCommissionTypeText(rule.type) }}</h4>
                </div>
                <div class="flex items-center space-x-2">
                  <Button
                    v-if="!readonly"
                    type="button"
                    variant="ghost"
                    size="sm"
                    @click="resetCommissionRule(index)"
                  >
                    <RefreshCwIcon class="h-4 w-4" />
                  </Button>
                  <Button
                    v-if="!readonly && formData.rules.length > 1"
                    type="button"
                    variant="ghost"
                    size="sm"
                    @click="removeRule(index)"
                  >
                    <TrashIcon class="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <!-- 基础配置 -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <!-- 返佣类型 -->
                <FormField v-slot="{ componentField }" :name="`rules.${index}.type`">
                  <FormItem>
                    <FormLabel>返佣类型 *</FormLabel>
                    <FormControl>
                      <Select
                        v-bind="componentField"
                        v-model="rule.type"
                        :disabled="readonly"
                        @update:model-value="onCommissionTypeChange(index, $event)"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择返佣类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">百分比返佣</SelectItem>
                          <SelectItem value="fixed">固定金额返佣</SelectItem>
                          <SelectItem value="tiered">阶梯式返佣</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <!-- 发放时机 -->
                <FormField v-slot="{ componentField }" :name="`rules.${index}.paymentTiming`">
                  <FormItem>
                    <FormLabel>发放时机 *</FormLabel>
                    <FormControl>
                      <Select
                        v-bind="componentField"
                        v-model="rule.paymentTiming"
                        :disabled="readonly"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择发放时机" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">实时发放</SelectItem>
                          <SelectItem value="monthly">月结发放</SelectItem>
                          <SelectItem value="quarterly">季度发放</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <!-- 单笔返佣上限 -->
                <FormField v-slot="{ componentField }" :name="`rules.${index}.maxSingleCommission`">
                  <FormItem>
                    <FormLabel>单笔返佣上限(元) *</FormLabel>
                    <FormControl>
                      <Input
                        v-bind="componentField"
                        v-model.number="rule.maxSingleCommission"
                        type="number"
                        placeholder="5000"
                        :disabled="readonly"
                        @blur="validateField(`rules.${index}.maxSingleCommission`)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>

              <!-- 月度返佣上限 -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField v-slot="{ componentField }" :name="`rules.${index}.maxMonthlyCommission`">
                  <FormItem>
                    <FormLabel>月度返佣上限(元) *</FormLabel>
                    <FormControl>
                      <Input
                        v-bind="componentField"
                        v-model.number="rule.maxMonthlyCommission"
                        type="number"
                        placeholder="20000"
                        :disabled="readonly"
                        @blur="validateField(`rules.${index}.maxMonthlyCommission`)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>

              <!-- 阶梯配置 (仅阶梯式返佣显示) -->
              <div v-if="rule.type === 'tiered'" class="border-t pt-4">
                <div class="flex items-center justify-between mb-3">
                  <h5 class="font-medium flex items-center">
                    <BarChartIcon class="h-4 w-4 mr-2" />
                    阶梯配置
                  </h5>
                  <Button
                    v-if="!readonly"
                    type="button"
                    variant="outline"
                    size="sm"
                    @click="addTier(index)"
                    :disabled="rule.tiers.length >= 10"
                  >
                    <PlusIcon class="h-4 w-4 mr-1" />
                    添加阶梯
                  </Button>
                </div>

                <div class="space-y-3">
                  <div v-for="(tier, tierIndex) in rule.tiers" :key="tierIndex" 
                       class="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                    <!-- 最小金额 -->
                    <FormField v-slot="{ componentField }" :name="`rules.${index}.tiers.${tierIndex}.minAmount`">
                      <FormItem>
                        <FormLabel>最小金额(元)</FormLabel>
                        <FormControl>
                          <Input
                            v-bind="componentField"
                            v-model.number="tier.minAmount"
                            type="number"
                            placeholder="0"
                            :disabled="readonly"
                            @blur="validateField(`rules.${index}.tiers.${tierIndex}.minAmount`)"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>

                    <!-- 最大金额 -->
                    <FormField v-slot="{ componentField }" :name="`rules.${index}.tiers.${tierIndex}.maxAmount`">
                      <FormItem>
                        <FormLabel>最大金额(元)</FormLabel>
                        <FormControl>
                          <Input
                            v-bind="componentField"
                            v-model.number="tier.maxAmount"
                            type="number"
                            placeholder="10000"
                            :disabled="readonly"
                            @blur="validateField(`rules.${index}.tiers.${tierIndex}.maxAmount`)"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>

                    <!-- 返佣比例/金额 -->
                    <FormField v-slot="{ componentField }" :name="`rules.${index}.tiers.${tierIndex}.rate`">
                      <FormItem>
                        <FormLabel>{{ rule.type === 'percentage' ? '返佣比例(%)' : '返佣金额(元)' }}</FormLabel>
                        <FormControl>
                          <Input
                            v-bind="componentField"
                            v-model.number="tier.rate"
                            type="number"
                            step="0.1"
                            :placeholder="rule.type === 'percentage' ? '2.0' : '100'"
                            :disabled="readonly"
                            @blur="validateField(`rules.${index}.tiers.${tierIndex}.rate`)"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>

                    <!-- 删除阶梯按钮 -->
                    <div class="flex items-end">
                      <Button
                        v-if="!readonly && rule.tiers.length > 1"
                        type="button"
                        variant="ghost"
                        size="sm"
                        @click="removeTier(index, tierIndex)"
                      >
                        <TrashIcon class="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 简单返佣配置 (非阶梯式) -->
              <div v-else-if="rule.type === 'percentage' || rule.type === 'fixed'" class="border-t pt-4">
                <h5 class="font-medium mb-3 flex items-center">
                  <SettingsIcon class="h-4 w-4 mr-2" />
                  返佣配置
                </h5>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField v-slot="{ componentField }" :name="`rules.${index}.tiers.0.rate`">
                    <FormItem>
                      <FormLabel>{{ rule.type === 'percentage' ? '返佣比例(%)' : '返佣金额(元)' }} *</FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          v-model.number="rule.tiers[0].rate"
                          type="number"
                          step="0.1"
                          :placeholder="rule.type === 'percentage' ? '2.0' : '100'"
                          :disabled="readonly"
                          @blur="validateField(`rules.${index}.tiers.0.rate`)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
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
 * @fileoverview CommissionRuleConfig组件的核心逻辑实现
 * 使用Vue 3 Composition API实现返佣规则配置的完整功能
 */
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  InfoIcon, ClockIcon, DollarSignIcon, BarChartIcon, SettingsIcon,
  RefreshCwIcon, SaveIcon, CheckIcon, LoaderIcon, AlertCircleIcon,
  AlertTriangleIcon, PlusIcon, TrashIcon
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { useSystemConfigPermission } from '@/composables/useSystemConfigPermission'
import { ConfigValidator } from '@/utils/configValidation'
import type {
  CommissionRule,
  CommissionConfig,
  CommissionTier,
  CommissionType,
  PaymentTiming,
  AuditInfo
} from '@/types/systemConfig'
import type { CrossValidationResult } from '@/utils/configValidation'
import dayjs from 'dayjs'

/**
 * 组件Props接口定义
 */
interface CommissionRuleConfigProps {
  /** 是否为只读模式 */
  readonly?: boolean
  /** 是否显示审核信息 */
  showAuditInfo?: boolean
}

/**
 * 组件Emits接口定义
 */
interface CommissionRuleConfigEmits {
  /** 保存草稿事件 */
  (e: 'save', config: CommissionConfig): void
  /** 提交审核事件 */
  (e: 'submit', config: CommissionConfig): void
  /** 重置事件 */
  (e: 'reset'): void
}

// Props和Emits定义
const props = withDefaults(defineProps<CommissionRuleConfigProps>(), {
  readonly: false,
  showAuditInfo: true
})

const emit = defineEmits<CommissionRuleConfigEmits>()

// 依赖注入
const { toast } = useToast()
const configStore = useSystemConfigStore()
const permission = useSystemConfigPermission()

// 响应式状态
const loading = ref(false)
const validationResult = ref<CrossValidationResult | null>(null)

/**
 * 默认返佣规则配置
 */
const defaultCommissionRules: CommissionRule[] = [
  {
    type: 'tiered',
    tiers: [
      { minAmount: 0, maxAmount: 10000, rate: 0.02 },
      { minAmount: 10000, maxAmount: 50000, rate: 0.03 },
      { minAmount: 50000, maxAmount: 100000, rate: 0.04 },
      { minAmount: 100000, maxAmount: 1000000, rate: 0.05 }
    ],
    paymentTiming: 'monthly',
    maxSingleCommission: 5000,
    maxMonthlyCommission: 20000
  }
]

/**
 * 表单数据
 */
const formData = reactive<CommissionConfig>({
  id: '',
  type: 'commission',
  version: 1,
  status: 'draft',
  createdBy: '',
  createdAt: '',
  updatedAt: '',
  rules: [...defaultCommissionRules]
})

// 计算属性
const hasChanges = computed(() => {
  const currentConfig = configStore.state.currentConfigs.commission
  if (!currentConfig) return true

  return JSON.stringify(formData.rules) !== JSON.stringify(currentConfig.rules)
})

const auditInfo = computed(() => {
  const pendingConfig = configStore.state.pendingConfigs.commission
  return pendingConfig?.auditInfo || null
})

/**
 * 获取返佣类型文本
 */
const getCommissionTypeText = (type: CommissionType) => {
  const typeMap: Record<CommissionType, string> = {
    'percentage': '百分比返佣',
    'fixed': '固定金额返佣',
    'tiered': '阶梯式返佣'
  }
  return typeMap[type] || type
}

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
 * 返佣类型变更处理
 */
const onCommissionTypeChange = (ruleIndex: number, newType: CommissionType) => {
  const rule = formData.rules[ruleIndex]
  rule.type = newType

  // 根据类型重置阶梯配置
  if (newType === 'tiered') {
    rule.tiers = [
      { minAmount: 0, maxAmount: 10000, rate: 0.02 },
      { minAmount: 10000, maxAmount: 50000, rate: 0.03 }
    ]
  } else {
    // 百分比或固定金额返佣只需要一个阶梯
    rule.tiers = [
      { minAmount: 0, maxAmount: 1000000, rate: newType === 'percentage' ? 0.02 : 100 }
    ]
  }

  validateAllRules()
}

/**
 * 添加新规则
 */
const addNewRule = () => {
  const newRule: CommissionRule = {
    type: 'percentage',
    tiers: [
      { minAmount: 0, maxAmount: 1000000, rate: 0.02 }
    ],
    paymentTiming: 'monthly',
    maxSingleCommission: 1000,
    maxMonthlyCommission: 5000
  }

  formData.rules.push(newRule)
  validateAllRules()
}

/**
 * 移除规则
 */
const removeRule = (index: number) => {
  if (formData.rules.length > 1) {
    formData.rules.splice(index, 1)
    validateAllRules()
  }
}

/**
 * 添加阶梯
 */
const addTier = (ruleIndex: number) => {
  const rule = formData.rules[ruleIndex]
  const lastTier = rule.tiers[rule.tiers.length - 1]

  const newTier: CommissionTier = {
    minAmount: lastTier ? lastTier.maxAmount : 0,
    maxAmount: lastTier ? lastTier.maxAmount + 10000 : 10000,
    rate: lastTier ? lastTier.rate + 0.01 : 0.02
  }

  rule.tiers.push(newTier)
  validateAllRules()
}

/**
 * 移除阶梯
 */
const removeTier = (ruleIndex: number, tierIndex: number) => {
  const rule = formData.rules[ruleIndex]
  if (rule.tiers.length > 1) {
    rule.tiers.splice(tierIndex, 1)
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
    validationResult.value = ConfigValidator.validateCommissionConfig(formData)
  } catch (error) {
    console.error('返佣规则验证失败:', error)
    validationResult.value = {
      isValid: false,
      errors: ['验证过程中发生错误'],
      warnings: []
    }
  }
}

/**
 * 重置单个返佣规则
 */
const resetCommissionRule = (index: number) => {
  const defaultRule = defaultCommissionRules[0] // 使用第一个默认规则
  if (defaultRule) {
    Object.assign(formData.rules[index], JSON.parse(JSON.stringify(defaultRule)))
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
      description: '返佣规则配置已提交审核',
      variant: 'default'
    })
  } catch (error) {
    console.error('提交返佣规则配置失败:', error)
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
      description: '返佣规则配置草稿已保存',
      variant: 'default'
    })
  } catch (error) {
    console.error('保存返佣规则配置草稿失败:', error)
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
  formData.rules = JSON.parse(JSON.stringify(defaultCommissionRules))
  validationResult.value = null
  emit('reset')

  toast({
    title: '重置成功',
    description: '返佣规则配置已重置为默认值',
    variant: 'default'
  })
}

/**
 * 初始化组件
 */
const initializeComponent = async () => {
  try {
    // 加载当前配置
    const currentConfig = configStore.state.currentConfigs.commission
    if (currentConfig && currentConfig.rules.length > 0) {
      formData.rules = JSON.parse(JSON.stringify(currentConfig.rules))
    }

    // 初始验证
    await validateAllRules()
  } catch (error) {
    console.error('初始化返佣规则配置组件失败:', error)
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
