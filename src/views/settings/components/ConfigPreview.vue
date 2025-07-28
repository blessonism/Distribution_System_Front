<!--
/**
 * @fileoverview 配置预览组件
 * 基于Vue 3 Composition API构建的配置预览组件，提供配置数据的只读展示和变更高亮功能
 * 支持等级规则、代理规则、返佣规则的统一预览，配置影响范围分析和数据格式化展示
 * 集成shadcn-vue卡片组件和响应式布局设计，确保最佳用户体验
 * 
 * @component ConfigPreview
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.0.0
 * 
 * @description
 * ConfigPreview组件是系统配置模块的预览展示组件，提供以下主要功能：
 * - 📊 配置数据只读预览，支持结构化的配置信息展示
 * - 🎨 变更高亮显示，突出显示配置的变更部分
 * - 📈 影响范围分析，展示配置变更对系统的影响范围
 * - 🔍 详细信息展示，支持配置项的详细说明和示例
 * - 📱 响应式设计，适配不同屏幕尺寸的设备
 * - 🎯 类型化展示，根据配置类型提供专门的展示格式
 * - 💡 智能提示，提供配置项的说明和建议
 * 
 * @usage
 * ```vue
 * <template>
 *   <ConfigPreview
 *     :config="previewConfig"
 *     :highlight-changes="true"
 *     :show-impact-analysis="true"
 *     @view-details="handleViewDetails"
 *   />
 * </template>
 * ```
 */
-->

<template>
  <div class="space-y-6">
    <!-- 配置基本信息 -->
    <Card v-if="config">
      <CardHeader>
        <CardTitle class="flex items-center space-x-2">
          <EyeIcon class="h-5 w-5" />
          <span>{{ getConfigTypeText(config.type) }}预览</span>
        </CardTitle>
        <CardDescription>
          配置详细信息和影响范围分析
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label class="text-sm font-medium text-gray-600">配置版本</Label>
            <p class="text-sm">v{{ config.version }}</p>
          </div>
          <div>
            <Label class="text-sm font-medium text-gray-600">配置状态</Label>
            <Badge :variant="getStatusBadgeVariant(config.status)">
              {{ getStatusText(config.status) }}
            </Badge>
          </div>
          <div>
            <Label class="text-sm font-medium text-gray-600">更新时间</Label>
            <p class="text-sm">{{ formatDate(config.updatedAt) }}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 等级规则预览 -->
    <Card v-if="config?.type === 'level'">
      <CardHeader>
        <CardTitle class="flex items-center space-x-2">
          <TrendingUpIcon class="h-5 w-5" />
          <span>等级规则详情</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div v-for="(rule, index) in levelRules" :key="rule.level" 
               class="border rounded-lg p-4"
               :class="highlightChanges && isRuleChanged(index) ? 'border-blue-300 bg-blue-50' : ''">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-2">
                <Badge :variant="getLevelBadgeVariant(rule.level)">
                  {{ rule.level }}
                </Badge>
                <h4 class="font-medium">{{ rule.name }}</h4>
                <Badge v-if="highlightChanges && isRuleChanged(index)" variant="outline" class="text-blue-600">
                  已变更
                </Badge>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <Label class="text-xs text-gray-500">业绩范围</Label>
                <p class="text-sm font-medium">
                  {{ formatCurrency(rule.minPerformance) }} - {{ formatCurrency(rule.maxPerformance) }}
                </p>
              </div>
              <div>
                <Label class="text-xs text-gray-500">提成比例</Label>
                <p class="text-sm font-medium text-green-600">
                  {{ formatPercentage(rule.commissionRate) }}
                </p>
              </div>
              <div v-if="rule.continuousMonths">
                <Label class="text-xs text-gray-500">连续月数</Label>
                <p class="text-sm font-medium">{{ rule.continuousMonths }}个月</p>
              </div>
              <div>
                <Label class="text-xs text-gray-500">等级描述</Label>
                <p class="text-sm">{{ rule.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 代理规则预览 -->
    <Card v-if="config?.type === 'agent'">
      <CardHeader>
        <CardTitle class="flex items-center space-x-2">
          <UsersIcon class="h-5 w-5" />
          <span>代理规则详情</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div v-for="(rule, index) in agentRules" :key="rule.level" 
               class="border rounded-lg p-4"
               :class="highlightChanges && isRuleChanged(index) ? 'border-blue-300 bg-blue-50' : ''">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-2">
                <Badge variant="default">层级 {{ rule.level }}</Badge>
                <h4 class="font-medium">{{ rule.name }}</h4>
                <Badge v-if="highlightChanges && isRuleChanged(index)" variant="outline" class="text-blue-600">
                  已变更
                </Badge>
              </div>
            </div>

            <!-- 升级条件 -->
            <div class="mb-4">
              <Label class="text-sm font-medium text-gray-700 mb-2 block">升级条件</Label>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div class="bg-gray-50 rounded-lg p-3">
                  <Label class="text-xs text-gray-500">业绩门槛</Label>
                  <p class="text-sm font-medium">{{ formatCurrency(rule.upgradeConditions.performanceThreshold) }}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <Label class="text-xs text-gray-500">时间要求</Label>
                  <p class="text-sm font-medium">{{ rule.upgradeConditions.timeRequirement }}个月</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <Label class="text-xs text-gray-500">推荐人数</Label>
                  <p class="text-sm font-medium">{{ rule.upgradeConditions.referralCount }}人</p>
                </div>
              </div>
            </div>

            <!-- 权限和提成 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label class="text-sm font-medium text-gray-700 mb-2 block">权限列表</Label>
                <div class="flex flex-wrap gap-1">
                  <Badge v-for="permission in rule.permissions" :key="permission" variant="secondary" class="text-xs">
                    {{ getPermissionText(permission) }}
                  </Badge>
                </div>
              </div>
              <div>
                <Label class="text-sm font-medium text-gray-700 mb-2 block">提成比例</Label>
                <p class="text-lg font-medium text-green-600">{{ formatPercentage(rule.commissionRate) }}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 返佣规则预览 -->
    <Card v-if="config?.type === 'commission'">
      <CardHeader>
        <CardTitle class="flex items-center space-x-2">
          <DollarSignIcon class="h-5 w-5" />
          <span>返佣规则详情</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div v-for="(rule, index) in commissionRules" :key="index" 
               class="border rounded-lg p-4"
               :class="highlightChanges && isRuleChanged(index) ? 'border-blue-300 bg-blue-50' : ''">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-2">
                <Badge variant="default">规则 {{ index + 1 }}</Badge>
                <h4 class="font-medium">{{ getCommissionTypeText(rule.type) }}</h4>
                <Badge v-if="highlightChanges && isRuleChanged(index)" variant="outline" class="text-blue-600">
                  已变更
                </Badge>
              </div>
            </div>

            <!-- 基础配置 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div class="bg-gray-50 rounded-lg p-3">
                <Label class="text-xs text-gray-500">发放时机</Label>
                <p class="text-sm font-medium">{{ getPaymentTimingText(rule.paymentTiming) }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <Label class="text-xs text-gray-500">单笔上限</Label>
                <p class="text-sm font-medium">{{ formatCurrency(rule.maxSingleCommission) }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <Label class="text-xs text-gray-500">月度上限</Label>
                <p class="text-sm font-medium">{{ formatCurrency(rule.maxMonthlyCommission) }}</p>
              </div>
            </div>

            <!-- 阶梯配置 -->
            <div v-if="rule.type === 'tiered' && rule.tiers.length > 1">
              <Label class="text-sm font-medium text-gray-700 mb-2 block">阶梯配置</Label>
              <div class="space-y-2">
                <div v-for="(tier, tierIndex) in rule.tiers" :key="tierIndex" 
                     class="grid grid-cols-3 gap-3 p-2 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <Label class="text-xs text-gray-500">金额范围</Label>
                    <p class="font-medium">{{ formatCurrency(tier.minAmount) }} - {{ formatCurrency(tier.maxAmount) }}</p>
                  </div>
                  <div>
                    <Label class="text-xs text-gray-500">返佣比例</Label>
                    <p class="font-medium text-green-600">{{ formatPercentage(tier.rate) }}</p>
                  </div>
                  <div>
                    <Label class="text-xs text-gray-500">阶梯级别</Label>
                    <p class="font-medium">第{{ tierIndex + 1 }}阶梯</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 简单返佣配置 -->
            <div v-else-if="rule.tiers.length === 1">
              <Label class="text-sm font-medium text-gray-700 mb-2 block">返佣配置</Label>
              <div class="bg-gray-50 rounded-lg p-3">
                <Label class="text-xs text-gray-500">
                  {{ rule.type === 'percentage' ? '返佣比例' : '返佣金额' }}
                </Label>
                <p class="text-lg font-medium text-green-600">
                  {{ rule.type === 'percentage' ? formatPercentage(rule.tiers[0].rate) : formatCurrency(rule.tiers[0].rate) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 影响范围分析 -->
    <Card v-if="showImpactAnalysis && impactAnalysis">
      <CardHeader>
        <CardTitle class="flex items-center space-x-2">
          <TargetIcon class="h-5 w-5" />
          <span>影响范围分析</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <p class="text-2xl font-bold text-blue-600">{{ impactAnalysis.affectedUsers }}</p>
            <p class="text-sm text-blue-700">受影响用户</p>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <p class="text-2xl font-bold text-green-600">{{ impactAnalysis.estimatedImpact }}</p>
            <p class="text-sm text-green-700">预估影响金额</p>
          </div>
          <div class="text-center p-4 bg-yellow-50 rounded-lg">
            <p class="text-2xl font-bold text-yellow-600">{{ impactAnalysis.riskLevel }}</p>
            <p class="text-sm text-yellow-700">风险等级</p>
          </div>
        </div>
        <div v-if="impactAnalysis.recommendations.length > 0" class="mt-4">
          <Label class="text-sm font-medium text-gray-700 mb-2 block">建议</Label>
          <ul class="space-y-1">
            <li v-for="recommendation in impactAnalysis.recommendations" :key="recommendation" 
                class="text-sm text-gray-600 flex items-start space-x-2">
              <span class="text-blue-500 mt-1">•</span>
              <span>{{ recommendation }}</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>

    <!-- 无配置数据 -->
    <Card v-if="!config">
      <CardContent class="pt-6">
        <div class="text-center py-8">
          <FileTextIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p class="text-gray-600">暂无配置数据</p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview ConfigPreview组件的核心逻辑实现
 * 使用Vue 3 Composition API实现配置预览的完整功能
 */
import { computed } from 'vue'
import {
  EyeIcon, TrendingUpIcon, UsersIcon, DollarSignIcon,
  TargetIcon, FileTextIcon
} from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type {
  SystemConfig,
  LevelConfig,
  AgentConfig,
  CommissionConfig,
  ConfigType,
  CommissionType,
  PaymentTiming
} from '@/types/systemConfig'
import dayjs from 'dayjs'

/**
 * 影响范围分析接口
 */
interface ImpactAnalysis {
  affectedUsers: number
  estimatedImpact: string
  riskLevel: string
  recommendations: string[]
}

/**
 * 组件Props接口定义
 */
interface ConfigPreviewProps {
  /** 配置数据 */
  config: SystemConfig | null
  /** 是否高亮变更 */
  highlightChanges?: boolean
  /** 是否显示影响范围分析 */
  showImpactAnalysis?: boolean
  /** 变更的规则索引列表 */
  changedRuleIndexes?: number[]
}

/**
 * 组件Emits接口定义
 */
interface ConfigPreviewEmits {
  /** 查看详情事件 */
  (e: 'view-details', ruleIndex: number): void
}

// Props和Emits定义
const props = withDefaults(defineProps<ConfigPreviewProps>(), {
  highlightChanges: false,
  showImpactAnalysis: false,
  changedRuleIndexes: () => []
})

const emit = defineEmits<ConfigPreviewEmits>()

// 计算属性
const levelRules = computed(() => {
  if (props.config?.type === 'level') {
    return (props.config as LevelConfig).rules
  }
  return []
})

const agentRules = computed(() => {
  if (props.config?.type === 'agent') {
    return (props.config as AgentConfig).rules
  }
  return []
})

const commissionRules = computed(() => {
  if (props.config?.type === 'commission') {
    return (props.config as CommissionConfig).rules
  }
  return []
})

const impactAnalysis = computed((): ImpactAnalysis | null => {
  if (!props.showImpactAnalysis || !props.config) return null

  // 模拟影响范围分析数据
  // 实际项目中应该根据配置类型和变更内容计算真实的影响范围
  const baseAnalysis = {
    level: {
      affectedUsers: 1250,
      estimatedImpact: '¥125,000',
      riskLevel: '中等',
      recommendations: [
        '建议在业务低峰期执行配置变更',
        '提前通知受影响的用户',
        '准备回滚方案以应对异常情况'
      ]
    },
    agent: {
      affectedUsers: 350,
      estimatedImpact: '¥45,000',
      riskLevel: '低',
      recommendations: [
        '新权限配置将在下次登录时生效',
        '建议为代理提供新功能使用指南'
      ]
    },
    commission: {
      affectedUsers: 800,
      estimatedImpact: '¥200,000',
      riskLevel: '高',
      recommendations: [
        '返佣规则变更影响较大，建议分阶段实施',
        '需要重新计算所有待发放的返佣',
        '建议提前1周通知所有相关用户'
      ]
    }
  }

  return baseAnalysis[props.config.type] || null
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
 * 获取状态文本
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
 * 获取状态徽章样式
 */
const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    'draft': 'secondary',
    'pending': 'outline',
    'active': 'default',
    'archived': 'secondary'
  }
  return variantMap[status] || 'secondary'
}

/**
 * 获取等级徽章样式
 */
const getLevelBadgeVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
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
 * 获取发放时机文本
 */
const getPaymentTimingText = (timing: PaymentTiming) => {
  const timingMap: Record<PaymentTiming, string> = {
    'immediate': '实时发放',
    'monthly': '月结发放',
    'quarterly': '季度发放'
  }
  return timingMap[timing] || timing
}

/**
 * 获取权限文本
 */
const getPermissionText = (permission: string) => {
  const permissionMap: Record<string, string> = {
    'view_leads': '查看客资',
    'create_leads': '创建客资',
    'edit_leads': '编辑客资',
    'delete_leads': '删除客资',
    'view_deals': '查看成交',
    'create_deals': '创建成交',
    'view_agents': '查看代理',
    'invite_agents': '邀请代理',
    'view_commissions': '查看佣金',
    'withdraw_commissions': '提取佣金',
    'view_reports': '查看报表',
    'export_data': '导出数据'
  }
  return permissionMap[permission] || permission
}

/**
 * 格式化日期
 */
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * 格式化货币
 */
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * 格式化百分比
 */
const formatPercentage = (rate: number) => {
  return `${(rate * 100).toFixed(1)}%`
}

/**
 * 检查规则是否已变更
 */
const isRuleChanged = (index: number) => {
  return props.changedRuleIndexes.includes(index)
}
</script>
