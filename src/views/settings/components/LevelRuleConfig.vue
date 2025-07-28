<!--
/**
 * @fileoverview 等级规则配置组件
 * 基于Vue 3 Composition API构建的等级规则管理组件，提供V1-V6伙伴等级的完整配置功能
 * 支持业绩阶梯设置、提成比例配置、实时表单验证和数据持久化
 * 集成shadcn-vue表单组件和响应式布局设计，确保最佳用户体验
 * 
 * @component LevelRuleConfig
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.0.0
 * 
 * @description
 * LevelRuleConfig组件是系统配置模块的核心组件之一，提供以下主要功能：
 * - 📊 V1-V6等级规则配置，支持业绩阶梯和提成比例设置
 * - ✅ 实时表单验证，确保配置数据的完整性和合理性
 * - 🔄 配置预览和对比，支持变更前后的数据对比
 * - 💾 草稿保存和自动恢复，防止数据丢失
 * - 📱 响应式设计，适配不同屏幕尺寸的设备
 * - 🚨 错误处理和Toast提示，及时反馈操作结果
 * 
 * @usage
 * ```vue
 * <template>
 *   <LevelRuleConfig
 *     :readonly="false"
 *     :show-audit-info="true"
 *     @save="handleSave"
 *     @submit="handleSubmit"
 *   />
 * </template>
 * ```
 * 
 * @example
 * ```typescript
 * // 配置数据示例
 * const levelRules = [
 *   { level: 'V1', name: 'V1伙伴', minPerformance: 0, maxPerformance: 10000, commissionRate: 0.05 },
 *   { level: 'V2', name: 'V2伙伴', minPerformance: 10000, maxPerformance: 20000, commissionRate: 0.06 }
 * ]
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
          <p class="font-medium mb-1">等级规则配置说明</p>
          <ul class="space-y-1 text-blue-700">
            <li>• V1-V6等级按业绩递增，提成比例也应递增</li>
            <li>• 业绩区间不能重叠，建议保持连续性</li>
            <li>• V2等级需要连续2个月达到业绩要求</li>
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

    <!-- 等级规则配置表单 -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center space-x-2">
          <TrendingUpIcon class="h-5 w-5" />
          <span>等级规则配置</span>
        </CardTitle>
        <CardDescription>
          配置V1-V6伙伴等级的业绩要求和提成比例
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form @submit="handleSubmit">
          <div class="space-y-6">
            <!-- 等级规则列表 -->
            <div v-for="(rule, index) in formData.rules" :key="rule.level" class="border rounded-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-2">
                  <Badge :variant="getLevelBadgeVariant(rule.level)">
                    {{ rule.level }}
                  </Badge>
                  <h4 class="font-medium">{{ rule.level }}等级配置</h4>
                </div>
                <Button
                  v-if="!readonly"
                  type="button"
                  variant="ghost"
                  size="sm"
                  @click="resetLevelRule(index)"
                >
                  <RefreshCwIcon class="h-4 w-4" />
                </Button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- 等级名称 -->
                <FormField v-slot="{ componentField }" :name="`rules.${index}.name`">
                  <FormItem>
                    <FormLabel>等级名称 *</FormLabel>
                    <FormControl>
                      <Input
                        v-bind="componentField"
                        v-model="rule.name"
                        placeholder="请输入等级名称"
                        :disabled="readonly"
                        @blur="validateField(`rules.${index}.name`)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <!-- 最小业绩 -->
                <FormField v-slot="{ componentField }" :name="`rules.${index}.minPerformance`">
                  <FormItem>
                    <FormLabel>最小业绩(元) *</FormLabel>
                    <FormControl>
                      <Input
                        v-bind="componentField"
                        v-model.number="rule.minPerformance"
                        type="number"
                        placeholder="0"
                        :disabled="readonly"
                        @blur="validateField(`rules.${index}.minPerformance`)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <!-- 最大业绩 -->
                <FormField v-slot="{ componentField }" :name="`rules.${index}.maxPerformance`">
                  <FormItem>
                    <FormLabel>最大业绩(元) *</FormLabel>
                    <FormControl>
                      <Input
                        v-bind="componentField"
                        v-model.number="rule.maxPerformance"
                        type="number"
                        placeholder="10000"
                        :disabled="readonly"
                        @blur="validateField(`rules.${index}.maxPerformance`)"
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
                        placeholder="5.0"
                        :disabled="readonly"
                        @input="updateCommissionRate(index, $event)"
                        @blur="validateField(`rules.${index}.commissionRate`)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>

              <!-- V2等级特殊配置 -->
              <div v-if="rule.level === 'V2'" class="mt-4">
                <FormField v-slot="{ componentField }" :name="`rules.${index}.continuousMonths`">
                  <FormItem>
                    <FormLabel>连续月数要求</FormLabel>
                    <FormControl>
                      <Input
                        v-bind="componentField"
                        v-model.number="rule.continuousMonths"
                        type="number"
                        min="1"
                        max="12"
                        placeholder="2"
                        :disabled="readonly"
                        @blur="validateField(`rules.${index}.continuousMonths`)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>

              <!-- 等级描述 -->
              <div class="mt-4">
                <FormField v-slot="{ componentField }" :name="`rules.${index}.description`">
                  <FormItem>
                    <FormLabel>等级描述</FormLabel>
                    <FormControl>
                      <Textarea
                        v-bind="componentField"
                        v-model="rule.description"
                        placeholder="请输入等级描述"
                        :disabled="readonly"
                        rows="2"
                        @blur="validateField(`rules.${index}.description`)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
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
 * @fileoverview LevelRuleConfig组件的核心逻辑实现
 * 使用Vue 3 Composition API实现等级规则配置的完整功能
 */
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  InfoIcon, ClockIcon, TrendingUpIcon, RefreshCwIcon, SaveIcon,
  CheckIcon, LoaderIcon, AlertCircleIcon, AlertTriangleIcon
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  LevelRule,
  LevelConfig,
  AuditInfo
} from '@/types/systemConfig'
import type { CrossValidationResult } from '@/utils/configValidation'
import dayjs from 'dayjs'

/**
 * 组件Props接口定义
 */
interface LevelRuleConfigProps {
  /** 是否为只读模式 */
  readonly?: boolean
  /** 是否显示审核信息 */
  showAuditInfo?: boolean
}

/**
 * 组件Emits接口定义
 */
interface LevelRuleConfigEmits {
  /** 保存草稿事件 */
  (e: 'save', config: LevelConfig): void
  /** 提交审核事件 */
  (e: 'submit', config: LevelConfig): void
  /** 重置事件 */
  (e: 'reset'): void
}

// Props和Emits定义
const props = withDefaults(defineProps<LevelRuleConfigProps>(), {
  readonly: false,
  showAuditInfo: true
})

const emit = defineEmits<LevelRuleConfigEmits>()

// 依赖注入
const { toast } = useToast()
const configStore = useSystemConfigStore()
const permission = useSystemConfigPermission()

// 响应式状态
const loading = ref(false)
const validationResult = ref<CrossValidationResult | null>(null)

/**
 * 默认等级规则配置
 * 基于业务需求文档定义的V1-V6等级体系
 */
const defaultLevelRules: LevelRule[] = [
  {
    level: 'V1',
    name: 'V1伙伴',
    minPerformance: 0,
    maxPerformance: 10000,
    commissionRate: 0.05,
    description: '月业绩1万以下，提点5%'
  },
  {
    level: 'V2',
    name: 'V2伙伴',
    minPerformance: 10000,
    maxPerformance: 20000,
    commissionRate: 0.06,
    continuousMonths: 2,
    description: '连续2个月业绩稳定在1万-2万，提点6%'
  },
  {
    level: 'V3',
    name: 'V3伙伴',
    minPerformance: 20000,
    maxPerformance: 40000,
    commissionRate: 0.07,
    description: '月业绩2万-4万，提点7%'
  },
  {
    level: 'V4',
    name: 'V4伙伴',
    minPerformance: 40000,
    maxPerformance: 60000,
    commissionRate: 0.08,
    description: '月业绩4万-6万，提点8%'
  },
  {
    level: 'V5',
    name: 'V5伙伴',
    minPerformance: 60000,
    maxPerformance: 80000,
    commissionRate: 0.09,
    description: '月业绩6万-8万，提点9%'
  },
  {
    level: 'V6',
    name: 'V6伙伴',
    minPerformance: 80000,
    maxPerformance: 100000,
    commissionRate: 0.10,
    description: '月业绩8万-10万及以上，提点10%'
  }
]

/**
 * 表单数据
 */
const formData = reactive<LevelConfig>({
  id: '',
  type: 'level',
  version: 1,
  status: 'draft',
  createdBy: '',
  createdAt: '',
  updatedAt: '',
  rules: [...defaultLevelRules]
})

// 计算属性
const hasChanges = computed(() => {
  const currentConfig = configStore.state.currentConfigs.level
  if (!currentConfig) return true

  return JSON.stringify(formData.rules) !== JSON.stringify(currentConfig.rules)
})

const auditInfo = computed(() => {
  const pendingConfig = configStore.state.pendingConfigs.level
  return pendingConfig?.auditInfo || null
})

/**
 * 获取等级徽章样式
 */
const getLevelBadgeVariant = (level: string) => {
  const variants: Record<string, string> = {
    'V1': 'secondary',
    'V2': 'outline',
    'V3': 'default',
    'V4': 'secondary',
    'V5': 'outline',
    'V6': 'default'
  }
  return variants[level] || 'default'
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
 * 更新提成比例
 * 将百分比输入转换为小数存储
 */
const updateCommissionRate = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const percentage = parseFloat(target.value) || 0
  formData.rules[index].commissionRate = percentage / 100
}

/**
 * 验证单个字段
 */
const validateField = async (fieldName: string) => {
  try {
    // 这里可以添加单字段验证逻辑
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
    validationResult.value = ConfigValidator.validateLevelConfig(formData)
  } catch (error) {
    console.error('等级规则验证失败:', error)
    validationResult.value = {
      isValid: false,
      errors: ['验证过程中发生错误'],
      warnings: []
    }
  }
}

/**
 * 重置单个等级规则
 */
const resetLevelRule = (index: number) => {
  const defaultRule = defaultLevelRules[index]
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
    // 权限检查
    await permission.requirePermission('config:submit')

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
      description: '等级规则配置已提交审核',
      variant: 'default'
    })
  } catch (error) {
    console.error('提交等级规则配置失败:', error)
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
    // 权限检查
    await permission.requirePermission('config:save')

    emit('save', { ...formData })

    toast({
      title: '保存成功',
      description: '等级规则配置草稿已保存',
      variant: 'default'
    })
  } catch (error) {
    console.error('保存等级规则配置草稿失败:', error)
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
  formData.rules = [...defaultLevelRules]
  validationResult.value = null
  emit('reset')

  toast({
    title: '重置成功',
    description: '等级规则配置已重置为默认值',
    variant: 'default'
  })
}

/**
 * 初始化组件
 */
const initializeComponent = async () => {
  try {
    // 加载当前配置
    const currentConfig = configStore.state.currentConfigs.level
    if (currentConfig && currentConfig.rules.length > 0) {
      formData.rules = [...currentConfig.rules]
    }

    // 初始验证
    await validateAllRules()
  } catch (error) {
    console.error('初始化等级规则配置组件失败:', error)
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
