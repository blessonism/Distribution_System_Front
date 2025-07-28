<!--
/**
 * @fileoverview 客资审核操作面板组件
 * 基于Vue 3 Composition API构建的客资审核界面组件，提供完整的审核操作流程
 * 支持审核决定制定、意见输入、驳回原因选择和审核记录展示等功能
 * 集成权限控制系统和表单验证机制，确保审核操作的安全性和准确性
 * 
 * @component AuditPanel
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.3.0
 * 
 * @description
 * AuditPanel组件是客资审核系统的核心操作界面，提供以下主要功能：
 * - 📋 详细的客资信息展示，包含基本信息、来源详情和备注说明
 * - ✅ 审核决定选择，支持通过和驳回两种操作
 * - 📝 审核意见输入，支持自定义审核理由和建议
 * - ❌ 驳回原因分类，提供预定义原因和自定义选项
 * - 📊 历史审核记录展示，时间线式查看审核历史
 * - 🔒 权限验证集成，确保只有授权用户可以执行审核
 * - ✔️ 表单验证机制，确保审核数据的完整性和合规性
 * 
 * @usage
 * ```vue
 * <template>
 *   <AuditPanel
 *     :lead="currentLead"
 *     :open="showAuditPanel"
 *     @update:open="showAuditPanel = $event"
 *     @audit="handleAuditSubmit"
 *   />
 * </template>
 * ```
 * 
 * @example
 * ```typescript
 * // 基础使用示例
 * const currentLead: Lead = {
 *   id: 'lead_001',
 *   name: '张三',
 *   phone: '13800138000',
 *   company: '测试公司',
 *   auditStatus: 'PENDING_AUDIT'
 * }
 * 
 * function handleAuditSubmit(decision: AuditDecision) {
 *   // 处理审核提交
 *   console.log('审核决定:', decision)
 * }
 * ```
 */
-->

<!--
  审核操作面板组件
  
  功能特性：
  - 审核决定选择界面
  - 审核意见输入框
  - 驳回原因选择
  - 提交确认对话框
  - 审核记录展示
  - 权限检查集成
-->

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center">
          <UserCheckIcon class="w-5 h-5 mr-2" />
          客资审核
        </DialogTitle>
        <DialogDescription>
          请仔细审核客资信息，确保数据的准确性和完整性
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <!-- 客资信息展示 -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-gray-900 border-b pb-2">客资信息</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div class="space-y-3">
              <div class="flex items-center">
                <UserIcon class="w-4 h-4 mr-2 text-gray-500" />
                <span class="text-sm text-gray-600">客户姓名:</span>
                <span class="ml-2 font-medium">{{ lead?.name }}</span>
              </div>
              
              <div class="flex items-center">
                <PhoneIcon class="w-4 h-4 mr-2 text-gray-500" />
                <span class="text-sm text-gray-600">联系电话:</span>
                <span class="ml-2 font-medium">{{ lead?.phone }}</span>
              </div>
              
              <div v-if="lead?.wechatId" class="flex items-center">
                <MessageCircleIcon class="w-4 h-4 mr-2 text-gray-500" />
                <span class="text-sm text-gray-600">微信号:</span>
                <span class="ml-2 font-medium">{{ lead?.wechatId }}</span>
              </div>
            </div>
            
            <div class="space-y-3">
              <div class="flex items-center">
                <UserCheckIcon class="w-4 h-4 mr-2 text-gray-500" />
                <span class="text-sm text-gray-600">归属销售:</span>
                <span class="ml-2 font-medium">{{ lead?.salespersonName }}</span>
              </div>

              <div v-if="lead?.agentName" class="flex items-center">
                <UserIcon class="w-4 h-4 mr-2 text-gray-500" />
                <span class="text-sm text-gray-600">归属代理:</span>
                <span class="ml-2 font-medium">{{ lead?.agentName }}</span>
              </div>

              <div class="flex items-center">
                <ClockIcon class="w-4 h-4 mr-2 text-gray-500" />
                <span class="text-sm text-gray-600">创建时间:</span>
                <span class="ml-2 font-medium">{{ formatDate(lead?.createdAt) }}</span>
              </div>
            </div>
          </div>
          
          <!-- 备注信息 -->
          <div v-if="lead?.notes" class="space-y-2">
            <Label class="text-sm font-medium text-gray-700">备注信息</Label>
            <div class="bg-gray-50 p-3 rounded border text-sm">
              {{ lead.notes }}
            </div>
          </div>
          
          <!-- 来源详情 -->
          <div v-if="lead?.sourceDetail || lead?.referralCode" class="space-y-2">
            <Label class="text-sm font-medium text-gray-700">来源详情</Label>
            <div class="bg-gray-50 p-3 rounded border text-sm space-y-1">
              <div v-if="lead?.sourceDetail">
                <span class="font-medium">来源详情:</span> {{ lead.sourceDetail }}
              </div>
              <div v-if="lead?.referralCode">
                <span class="font-medium">推荐码:</span> {{ lead.referralCode }}
              </div>
              <div v-if="lead?.utmSource">
                <span class="font-medium">UTM来源:</span> {{ lead.utmSource }}
              </div>
            </div>
          </div>
        </div>

        <!-- 审核操作区域 -->
        <div v-if="canAudit && lead?.auditStatus === 'PENDING_AUDIT'" class="space-y-4">
          <h3 class="text-lg font-medium text-gray-900 border-b pb-2">审核操作</h3>
          
          <div class="space-y-4">
            <!-- 审核决定 -->
            <div class="space-y-2">
              <Label class="flex items-center">
                <CheckCircleIcon class="w-4 h-4 mr-1" />
                审核决定 <span class="text-red-500 ml-1">*</span>
              </Label>
              <div class="flex space-x-4">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    v-model="auditDecision.action"
                    value="APPROVE"
                    class="text-green-600 focus:ring-green-500"
                  />
                  <span class="text-green-600 font-medium">通过</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    v-model="auditDecision.action"
                    value="REJECT"
                    class="text-red-600 focus:ring-red-500"
                  />
                  <span class="text-red-600 font-medium">驳回</span>
                </label>
              </div>
            </div>

            <!-- 驳回原因（驳回时显示） -->
            <div v-if="auditDecision.action === 'REJECT'" class="space-y-2">
              <Label class="flex items-center">
                <XCircleIcon class="w-4 h-4 mr-1" />
                驳回原因 <span class="text-red-500 ml-1">*</span>
              </Label>
              <Select v-model="auditDecision.rejectReason">
                <SelectTrigger>
                  <SelectValue placeholder="请选择驳回原因" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invalid_phone">手机号无效或格式错误</SelectItem>
                  <SelectItem value="duplicate_lead">重复客资，已存在相同记录</SelectItem>
                  <SelectItem value="incomplete_info">客户信息不完整</SelectItem>
                  <SelectItem value="suspicious_source">来源渠道可疑或不明确</SelectItem>
                  <SelectItem value="invalid_wechat">微信号无效或无法添加</SelectItem>
                  <SelectItem value="fake_customer">疑似虚假客户信息</SelectItem>
                  <SelectItem value="out_of_scope">超出当前业务范围</SelectItem>
                  <SelectItem value="other">其他原因</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- 审核意见 -->
            <div class="space-y-2">
              <Label class="flex items-center">
                <FileTextIcon class="w-4 h-4 mr-1" />
                审核意见
                <span v-if="auditDecision.action === 'REJECT'" class="text-red-500 ml-1">*</span>
              </Label>
              <Textarea
                v-model="auditDecision.comment"
                placeholder="请输入审核意见..."
                rows="3"
                :class="{ 'border-red-500': errors.comment }"
              />
              <p v-if="errors.comment" class="text-sm text-red-500">{{ errors.comment }}</p>
              <p class="text-sm text-gray-500">{{ (auditDecision.comment || '').length }}/500</p>
            </div>

            <!-- 自定义驳回原因（选择其他原因时显示） -->
            <div v-if="auditDecision.action === 'REJECT' && auditDecision.rejectReason === 'other'" class="space-y-2">
              <Label>自定义驳回原因</Label>
              <Input
                v-model="auditDecision.customRejectReason"
                placeholder="请详细说明驳回原因"
                :class="{ 'border-red-500': errors.customRejectReason }"
              />
              <p v-if="errors.customRejectReason" class="text-sm text-red-500">{{ errors.customRejectReason }}</p>
            </div>
          </div>
        </div>

        <!-- 审核记录 -->
        <div v-if="auditRecords.length > 0" class="space-y-4">
          <h3 class="text-lg font-medium text-gray-900 border-b pb-2">审核记录</h3>
          
          <div class="space-y-3 max-h-60 overflow-y-auto">
            <div
              v-for="record in auditRecords"
              :key="record.id"
              class="bg-gray-50 p-3 rounded border"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                  <Badge :variant="record.action === 'APPROVE' ? 'default' : 'destructive'">
                    {{ record.action === 'APPROVE' ? '通过' : '驳回' }}
                  </Badge>
                  <span class="text-sm font-medium">{{ record.auditorName }}</span>
                  <span class="text-sm text-gray-500">({{ record.auditorRole }})</span>
                </div>
                <span class="text-sm text-gray-500">{{ formatDate(record.auditedAt) }}</span>
              </div>
              
              <div v-if="record.comment" class="text-sm text-gray-700 mb-1">
                <span class="font-medium">审核意见:</span> {{ record.comment }}
              </div>
              
              <div v-if="record.rejectReason" class="text-sm text-red-600">
                <span class="font-medium">驳回原因:</span> {{ getRejectReasonLabel(record.rejectReason) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 权限提示 -->
        <div v-if="!canAudit" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-center">
            <AlertTriangleIcon class="w-5 h-5 text-yellow-600 mr-2" />
            <span class="text-yellow-800">您没有审核此客资的权限</span>
          </div>
        </div>
      </div>

      <DialogFooter class="flex justify-between">
        <Button variant="outline" @click="$emit('update:open', false)">
          关闭
        </Button>
        
        <div v-if="canAudit && lead?.auditStatus === 'PENDING_AUDIT'" class="space-x-2">
          <Button variant="outline" @click="resetForm">
            重置
          </Button>
          <Button @click="handleSubmit" :disabled="loading || !isFormValid">
            <LoaderIcon v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
            提交审核
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
/**
 * @fileoverview AuditPanel组件的核心逻辑实现
 * 使用Vue 3 Composition API实现客资审核的完整操作流程
 */
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  UserIcon, PhoneIcon, MessageCircleIcon, GlobeIcon,
  UserCheckIcon, ClockIcon, CheckCircleIcon, XCircleIcon,
  FileTextIcon, AlertTriangleIcon, LoaderIcon
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast/use-toast'

import type { Lead } from '@/types/lead'
import type { AuditDecision, LeadAuditRecord, RejectReason } from '@/types/leadAudit'
import { REJECT_REASON_LABELS } from '@/types/leadAudit'
import { leadAuditApi } from '@/api/leadAudit'
import { useLeadAuditPermission } from '@/composables/useLeadAuditPermission'

/**
 * 组件属性接口定义
 * 定义AuditPanel组件的输入属性
 * 
 * @interface Props
 * 
 * @property {Lead | null} lead - 当前要审核的客资对象
 * @property {boolean} open - 控制审核面板的显示状态
 * 
 * @example
 * ```typescript
 * const props: Props = {
 *   lead: {
 *     id: 'lead_001',
 *     name: '张三',
 *     phone: '13800138000',
 *     auditStatus: 'PENDING_AUDIT'
 *   },
 *   open: true
 * }
 * ```
 */
interface Props {
  lead: Lead | null
  open: boolean
}

const props = defineProps<Props>()

/**
 * 组件事件定义
 * 定义AuditPanel组件对外发出的事件
 * 
 * @events
 * 
 * @event update:open - 更新面板显示状态，参数为新的显示状态
 * @event audit - 审核提交事件，参数为审核决定对象
 * 
 * @example
 * ```typescript
 * // 事件处理示例
 * function handleOpenChange(open: boolean) {
 *   showAuditPanel.value = open
 * }
 * 
 * function handleAuditSubmit(decision: AuditDecision) {
 *   // 执行审核提交逻辑
 *   submitAudit(decision)
 * }
 * ```
 */
const emit = defineEmits<{
  'update:open': [value: boolean]
  'audit': [decision: AuditDecision]
}>()

// Composables
const { toast } = useToast()
const { canAuditSpecificLead } = useLeadAuditPermission()

/**
 * 组件响应式状态管理
 * 管理组件的加载状态和审核记录数据
 */
const loading = ref(false)
const auditRecords = ref<LeadAuditRecord[]>([])

/**
 * 审核决定数据模型
 * 管理用户的审核决定输入，包括动作、意见和驳回原因
 * 
 * @reactive auditDecision
 * @type {AuditDecision}
 * 
 * @property {string} action - 审核动作：'APPROVE' | 'REJECT'
 * @property {string} comment - 审核意见或评论
 * @property {RejectReason} [rejectReason] - 驳回原因代码
 * @property {string} customRejectReason - 自定义驳回原因
 * 
 * @example
 * ```typescript
 * // 通过审核示例
 * auditDecision.action = 'APPROVE'
 * auditDecision.comment = '客资信息完整，通过审核'
 * 
 * // 驳回审核示例
 * auditDecision.action = 'REJECT'
 * auditDecision.rejectReason = 'invalid_phone'
 * auditDecision.comment = '手机号格式不正确'
 * ```
 */
const auditDecision = reactive<AuditDecision>({
  action: 'APPROVE',
  comment: '',
  rejectReason: undefined,
  customRejectReason: ''
})

/**
 * 表单验证错误信息
 * 存储表单验证失败时的错误提示信息
 * 
 * @reactive errors
 * @type {Record<string, string>}
 * 
 * @example
 * ```typescript
 * // 设置错误信息
 * errors.comment = '驳回时必须填写审核意见'
 * errors.rejectReason = '请选择驳回原因'
 * 
 * // 清空错误信息
 * Object.keys(errors).forEach(key => delete errors[key])
 * ```
 */
const errors = reactive<Record<string, string>>({})

/**
 * 审核权限检查
 * 检查当前用户是否有权审核指定的客资
 * 
 * @computed canAudit
 * @returns {boolean} 是否具有审核权限
 * 
 * @complexity O(1) - 权限检查算法，常数时间复杂度
 * @flow 客资信息 → 权限验证 → 结果返回
 * 
 * @example
 * ```typescript
 * // 权限检查示例
 * if (canAudit.value) {
 *   // 用户可以审核该客资
 *   showAuditControls()
 * } else {
 *   // 用户无权审核
 *   showPermissionDeniedMessage()
 * }
 * ```
 */
const canAudit = computed(() => {
  if (!props.lead) return false
  
  const result = canAuditSpecificLead({
    id: props.lead.id,
    salespersonId: props.lead.salespersonId,
    auditStatus: props.lead.auditStatus,
    teamId: props.lead.teamId
  })
  
  return result.hasPermission
})

/**
 * 表单有效性验证
 * 检查当前审核表单是否填写完整且有效
 * 
 * @computed isFormValid
 * @returns {boolean} 表单是否有效
 * 
 * @complexity O(1) - 简单条件检查，常数时间复杂度
 * @flow 输入数据 → 规则验证 → 有效性判断
 * 
 * @example
 * ```typescript
 * // 表单验证示例
 * if (isFormValid.value) {
 *   // 可以提交审核
 *   submitButton.disabled = false
 * } else {
 *   // 表单无效，禁用提交
 *   submitButton.disabled = true
 * }
 * ```
 */
const isFormValid = computed(() => {
  if (auditDecision.action === 'REJECT') {
    // 驳回时必须选择原因
    if (!auditDecision.rejectReason) return false
    
    // 选择其他原因时必须填写自定义原因
    if (auditDecision.rejectReason === 'other' && !auditDecision.customRejectReason?.trim()) {
      return false
    }
    
    // 驳回时必须填写审核意见
    if (!auditDecision.comment?.trim()) return false
  }
  
  return Object.keys(errors).length === 0
})

/**
 * 格式化日期显示
 * 将ISO日期字符串转换为本地化的日期时间格式
 * 
 * @function formatDate
 * @param {string} [dateString] - ISO日期字符串
 * @returns {string} 格式化后的日期字符串
 * 
 * @complexity O(1) - 直接日期格式化，常数时间复杂度
 * 
 * @example
 * ```typescript
 * formatDate('2024-04-10T14:30:00Z') // "2024/4/10 22:30:00"
 * formatDate(undefined) // ""
 * ```
 */
function formatDate(dateString?: string): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

/**
 * 获取驳回原因标签
 * 将驳回原因代码转换为用户可读的中文标签
 * 
 * @function getRejectReasonLabel
 * @param {RejectReason} reason - 驳回原因代码
 * @returns {string} 中文标签
 * 
 * @complexity O(1) - 哈希表查找，常数时间复杂度
 * 
 * @example
 * ```typescript
 * getRejectReasonLabel('invalid_phone') // "手机号无效或格式错误"
 * getRejectReasonLabel('duplicate_lead') // "重复客资，已存在相同记录"
 * ```
 */
function getRejectReasonLabel(reason: RejectReason): string {
  return REJECT_REASON_LABELS[reason] || reason
}

/**
 * 表单验证逻辑
 * 验证审核表单的完整性和合规性，设置相应的错误信息
 * 
 * @function validateForm
 * @returns {boolean} 表单是否通过验证
 * 
 * @complexity O(1) - 固定数量的验证规则，常数时间复杂度
 * @flow 清空错误 → 条件验证 → 错误设置 → 结果返回
 * 
 * @example
 * ```typescript
 * if (validateForm()) {
 *   // 表单验证通过，可以提交
 *   await submitAudit()
 * } else {
 *   // 表单验证失败，显示错误
 *   showValidationErrors()
 * }
 * ```
 */
function validateForm(): boolean {
  // 清空之前的错误
  Object.keys(errors).forEach(key => delete errors[key])
  
  if (auditDecision.action === 'REJECT') {
    // 验证驳回原因
    if (!auditDecision.rejectReason) {
      errors.rejectReason = '请选择驳回原因'
    }
    
    // 验证自定义驳回原因
    if (auditDecision.rejectReason === 'other' && !auditDecision.customRejectReason?.trim()) {
      errors.customRejectReason = '请填写具体的驳回原因'
    }
    
    // 验证审核意见
    if (!auditDecision.comment?.trim()) {
      errors.comment = '驳回时必须填写审核意见'
    }
  }
  
  // 验证审核意见长度
  if (auditDecision.comment && auditDecision.comment.length > 500) {
    errors.comment = '审核意见不能超过500个字符'
  }
  
  return Object.keys(errors).length === 0
}

/**
 * 重置审核表单
 * 将审核表单恢复到初始状态，清空所有输入和错误信息
 * 
 * @function resetForm
 * @returns {void}
 * 
 * @complexity O(1) - 简单状态重置，常数时间复杂度
 * 
 * @example
 * ```typescript
 * // 用户点击重置按钮时调用
 * resetForm()
 * // 表单将回到初始状态
 * ```
 */
function resetForm() {
  auditDecision.action = 'APPROVE'
  auditDecision.comment = ''
  auditDecision.rejectReason = undefined
  auditDecision.customRejectReason = ''
  Object.keys(errors).forEach(key => delete errors[key])
}

/**
 * 提交审核决定
 * 处理审核表单提交，包括验证、数据处理和事件发出
 * 
 * @async
 * @function handleSubmit
 * @returns {Promise<void>}
 * 
 * @complexity O(1) - 表单处理和事件发出，常数时间复杂度
 * @flow 表单验证 → 数据组装 → 事件发出 → 状态更新
 * 
 * @example
 * ```typescript
 * // 用户点击提交按钮时调用
 * await handleSubmit()
 * // 审核决定会通过事件传递给父组件
 * ```
 */
async function handleSubmit() {
  if (!validateForm()) {
    toast({
      title: '表单验证失败',
      description: '请检查并修正表单中的错误',
      variant: 'destructive'
    })
    return
  }
  
  loading.value = true
  try {
    const decision: AuditDecision = {
      action: auditDecision.action,
      comment: auditDecision.comment || undefined,
      rejectReason: auditDecision.rejectReason,
      customRejectReason: auditDecision.rejectReason === 'other' 
        ? auditDecision.customRejectReason 
        : undefined
    }
    
    emit('audit', decision)
  } catch (error) {
    console.error('提交审核失败:', error)
    toast({
      title: '提交失败',
      description: '请稍后重试',
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
}

/**
 * 获取审核记录数据
 * 从API获取指定客资的历史审核记录
 * 
 * @async
 * @function fetchAuditRecords
 * @returns {Promise<void>}
 * 
 * @complexity O(1) - API调用，常数时间复杂度（不考虑网络延迟）
 * @flow API请求 → 数据处理 → 状态更新 → 错误处理
 * 
 * @example
 * ```typescript
 * // 在面板打开时获取审核记录
 * await fetchAuditRecords()
 * // 记录将显示在面板的历史记录区域
 * ```
 */
async function fetchAuditRecords() {
  if (!props.lead?.id) return
  
  try {
    const records = await leadAuditApi.getAuditRecords(props.lead.id)
    auditRecords.value = records
  } catch (error) {
    console.error('获取审核记录失败:', error)
  }
}

// 监听客资变化
watch(() => props.lead, (newLead) => {
  if (newLead) {
    resetForm()
    fetchAuditRecords()
  }
}, { immediate: true })

// 监听对话框打开状态
watch(() => props.open, (isOpen) => {
  if (isOpen && props.lead) {
    fetchAuditRecords()
  }
})
</script>
