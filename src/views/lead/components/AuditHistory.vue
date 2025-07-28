<!--
/**
 * @fileoverview 客资审核历史记录组件
 * 基于Vue 3 Composition API构建的审核记录展示组件，提供时间线样式的审核历史展示
 * 支持记录筛选、数据导出、审核撤销等完整的审核记录管理功能
 * 集成权限控制系统，确保操作安全性和数据完整性
 * 
 * @component AuditHistory
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.2.0
 * 
 * @description
 * AuditHistory组件是客资审核系统的核心历史记录展示组件，主要功能包括：
 * - 📋 完整的审核历史展示，采用时间线样式设计
 * - 🔍 多维度筛选功能，支持按结果、审核人、时间范围筛选
 * - 📊 审核记录导出，支持Excel格式导出
 * - ↩️ 审核撤销功能，支持权限控制的撤销操作
 * - 🎨 响应式设计，适配移动端和桌面端显示
 * - 📱 实时数据刷新，确保记录的及时性和准确性
 * 
 * @usage
 * ```vue
 * <template>
 *   <AuditHistory
 *     :lead="currentLead"
 *   />
 * </template>
 * ```
 * 
 * @example
 * ```typescript
 * // 基础使用示例
 * const leadData: Lead = {
 *   id: 'lead_001',
 *   name: '张三',
 *   phone: '13800138000',
 *   company: '测试公司',
 *   status: 'APPROVED'
 * }
 * 
 * // 组件会自动加载该客资的所有审核记录
 * // 并提供筛选、导出、撤销等功能
 * ```
 */
-->

<!--
  审核记录组件
  
  功能特性：
  - 显示客资的完整审核历史
  - 时间线样式展示
  - 显示审核人和审核结果
  - 支持筛选和搜索
  - 导出审核记录
  - 撤销审核操作（权限控制）
-->

<template>
  <div class="space-y-6">
    <!-- 标题和操作栏 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">审核记录</h2>
        <p class="text-sm text-gray-600 mt-1">
          {{ lead ? `${lead.name} (${lead.phone})` : '' }} 的审核历史记录
        </p>
      </div>
      
      <div class="flex items-center space-x-2">
        <!-- 刷新按钮 -->
        <Button variant="outline" size="sm" @click="refreshRecords" :disabled="loading">
          <RefreshCwIcon class="w-4 h-4 mr-1" :class="{ 'animate-spin': loading }" />
          刷新
        </Button>
        
        <!-- 导出按钮 -->
        <Button
          v-if="canExportAuditData && records.length > 0"
          variant="outline"
          size="sm"
          @click="exportRecords"
          :disabled="exportLoading"
        >
          <DownloadIcon class="w-4 h-4 mr-1" />
          导出
        </Button>
      </div>
    </div>

    <!-- 筛选面板 -->
    <Card v-if="records.length > 0">
      <CardContent class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- 审核结果筛选 -->
          <div class="space-y-2">
            <Label>审核结果</Label>
            <Select v-model="filters.action">
              <SelectTrigger>
                <SelectValue placeholder="选择审核结果" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部结果</SelectItem>
                <SelectItem value="APPROVE">通过</SelectItem>
                <SelectItem value="REJECT">驳回</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 审核人筛选 -->
          <div class="space-y-2">
            <Label>审核人</Label>
            <Select v-model="filters.auditorId">
              <SelectTrigger>
                <SelectValue placeholder="选择审核人" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部审核人</SelectItem>
                <SelectItem v-for="auditor in auditors" :key="auditor.id" :value="auditor.id">
                  {{ auditor.name }} ({{ auditor.role }})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 时间范围筛选 -->
          <div class="space-y-2">
            <Label>时间范围</Label>
            <Select v-model="filters.dateRange">
              <SelectTrigger>
                <SelectValue placeholder="选择时间范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部时间</SelectItem>
                <SelectItem value="today">今天</SelectItem>
                <SelectItem value="week">本周</SelectItem>
                <SelectItem value="month">本月</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 审核记录时间线 -->
    <Card>
      <CardContent class="p-6">
        <div v-if="loading" class="flex items-center justify-center py-8">
          <LoaderIcon class="w-6 h-6 animate-spin text-gray-400" />
          <span class="ml-2 text-gray-600">加载中...</span>
        </div>
        
        <div v-else-if="filteredRecords.length === 0" class="text-center py-8">
          <FileTextIcon class="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p class="text-gray-500">{{ records.length === 0 ? '暂无审核记录' : '没有符合条件的记录' }}</p>
        </div>
        
        <div v-else class="relative">
          <!-- 时间线 -->
          <div class="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          <div class="space-y-6">
            <div
              v-for="(record, index) in filteredRecords"
              :key="record.id"
              class="relative flex items-start space-x-4"
            >
              <!-- 时间线节点 -->
              <div class="relative flex-shrink-0">
                <div
                  class="w-4 h-4 rounded-full border-2 bg-white"
                  :class="{
                    'border-green-500': record.action === 'APPROVE',
                    'border-red-500': record.action === 'REJECT'
                  }"
                ></div>
                
                <!-- 连接线（最后一个记录不显示） -->
                <div
                  v-if="index < filteredRecords.length - 1"
                  class="absolute top-4 left-1.5 w-0.5 h-6 bg-gray-200"
                ></div>
              </div>
              
              <!-- 记录内容 -->
              <div class="flex-1 min-w-0">
                <div class="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <!-- 记录头部 -->
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-3">
                      <Badge :variant="record.action === 'APPROVE' ? 'default' : 'destructive'">
                        {{ record.action === 'APPROVE' ? '通过' : '驳回' }}
                      </Badge>
                      
                      <div class="flex items-center text-sm text-gray-600">
                        <UserIcon class="w-4 h-4 mr-1" />
                        <span class="font-medium">{{ record.auditorName }}</span>
                        <span class="mx-1">·</span>
                        <span>{{ record.auditorRole }}</span>
                      </div>
                    </div>
                    
                    <div class="flex items-center space-x-2">
                      <span class="text-sm text-gray-500">
                        {{ formatDate(record.auditedAt) }}
                      </span>
                      
                      <!-- 撤销按钮 -->
                      <Button
                        v-if="canRevokeAudit && record.canRevoke"
                        variant="ghost"
                        size="sm"
                        @click="handleRevoke(record)"
                        :disabled="revokeLoading"
                      >
                        <UndoIcon class="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <!-- 审核意见 -->
                  <div v-if="record.comment" class="mb-3">
                    <Label class="text-sm font-medium text-gray-700">审核意见</Label>
                    <p class="text-sm text-gray-900 mt-1 bg-gray-50 p-2 rounded">
                      {{ record.comment }}
                    </p>
                  </div>
                  
                  <!-- 驳回原因 -->
                  <div v-if="record.action === 'REJECT' && record.rejectReason" class="mb-3">
                    <Label class="text-sm font-medium text-gray-700">驳回原因</Label>
                    <div class="flex items-center mt-1">
                      <XCircleIcon class="w-4 h-4 text-red-500 mr-2" />
                      <span class="text-sm text-red-700">
                        {{ getRejectReasonLabel(record.rejectReason) }}
                      </span>
                    </div>
                    
                    <!-- 自定义驳回原因 -->
                    <div v-if="record.customRejectReason" class="mt-2">
                      <p class="text-sm text-gray-900 bg-red-50 p-2 rounded border border-red-200">
                        {{ record.customRejectReason }}
                      </p>
                    </div>
                  </div>
                  
                  <!-- 审核详情 -->
                  <div class="grid grid-cols-2 gap-4 text-xs text-gray-500 pt-2 border-t">
                    <div>
                      <span class="font-medium">审核时间:</span>
                      {{ formatDateTime(record.auditedAt) }}
                    </div>
                    <div>
                      <span class="font-medium">IP地址:</span>
                      {{ record.ipAddress || '未记录' }}
                    </div>
                    <div>
                      <span class="font-medium">用户代理:</span>
                      {{ record.userAgent ? truncateText(record.userAgent, 30) : '未记录' }}
                    </div>
                    <div>
                      <span class="font-medium">审核ID:</span>
                      {{ record.id }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 撤销确认对话框 -->
    <Dialog :open="showRevokeDialog" @update:open="showRevokeDialog = $event">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>撤销审核</DialogTitle>
          <DialogDescription>
            您确定要撤销此次审核操作吗？撤销后客资将重新进入待审核状态。
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>撤销原因</Label>
            <Textarea
              v-model="revokeReason"
              placeholder="请说明撤销原因..."
              rows="3"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" @click="showRevokeDialog = false">取消</Button>
          <Button variant="destructive" @click="confirmRevoke" :disabled="revokeLoading">
            <LoaderIcon v-if="revokeLoading" class="w-4 h-4 mr-2 animate-spin" />
            确认撤销
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview AuditHistory组件的核心逻辑实现
 * 使用Vue 3 Composition API实现审核记录的展示、筛选、导出和撤销功能
 */
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  RefreshCwIcon, DownloadIcon, LoaderIcon, FileTextIcon,
  UserIcon, XCircleIcon, UndoIcon
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
import type { LeadAuditRecord, RejectReason } from '@/types/leadAudit'
import { REJECT_REASON_LABELS } from '@/types/leadAudit'
import { leadAuditApi } from '@/api/leadAudit'
import { useLeadAuditPermission } from '@/composables/useLeadAuditPermission'

/**
 * 组件属性接口定义
 * 定义AuditHistory组件的输入属性
 * 
 * @interface Props
 * 
 * @property {Lead | null} lead - 当前查看的客资对象，为null时不显示记录
 * 
 * @example
 * ```typescript
 * const props: Props = {
 *   lead: {
 *     id: 'lead_001',
 *     name: '张三',
 *     phone: '13800138000',
 *     company: '测试公司',
 *     status: 'APPROVED'
 *   }
 * }
 * ```
 */
interface Props {
  lead: Lead | null
}

const props = defineProps<Props>()

// Composables
const { toast } = useToast()
const { canExportAuditData, canRevokeAudit } = useLeadAuditPermission()

/**
 * 组件响应式状态管理
 * 管理组件的加载状态、数据状态和UI状态
 */
const loading = ref(false)
const exportLoading = ref(false)
const revokeLoading = ref(false)
const records = ref<LeadAuditRecord[]>([])
const auditors = ref<Array<{ id: string; name: string; role: string }>>([])
const showRevokeDialog = ref(false)
const currentRecord = ref<LeadAuditRecord | null>(null)
const revokeReason = ref('')

/**
 * 审核记录筛选条件
 * 支持按审核结果、审核人和时间范围进行筛选
 * 
 * @interface FilterOptions
 * 
 * @property {string} action - 审核结果筛选：'APPROVE' | 'REJECT' | ''
 * @property {string} auditorId - 审核人ID筛选
 * @property {string} dateRange - 时间范围筛选：'today' | 'week' | 'month' | ''
 * 
 * @example
 * ```typescript
 * // 筛选本周的通过记录
 * filters.action = 'APPROVE'
 * filters.dateRange = 'week'
 * 
 * // 筛选特定审核人的记录
 * filters.auditorId = 'auditor_001'
 * ```
 */
const filters = reactive({
  action: '' as 'APPROVE' | 'REJECT' | '',
  auditorId: '',
  dateRange: ''
})

/**
 * 筛选后的审核记录
 * 根据筛选条件过滤审核记录，并按时间倒序排列
 * 
 * @computed filteredRecords
 * @returns {LeadAuditRecord[]} 筛选后的审核记录数组
 * 
 * @complexity O(n * log n) - 筛选操作O(n)，排序操作O(n log n)
 * @flow 原始记录 → 结果筛选 → 审核人筛选 → 时间范围筛选 → 时间排序
 * 
 * @example
 * ```typescript
 * // 获取筛选后的记录
 * const filtered = filteredRecords.value
 * 
 * // 筛选逻辑示例
 * if (filters.action === 'APPROVE') {
 *   // 只显示通过的记录
 * }
 * if (filters.dateRange === 'today') {
 *   // 只显示今天的记录
 * }
 * ```
 */
const filteredRecords = computed(() => {
  let filtered = [...records.value]
  
  if (filters.action) {
    filtered = filtered.filter(record => record.action === filters.action)
  }
  
  if (filters.auditorId) {
    filtered = filtered.filter(record => record.auditorId === filters.auditorId)
  }
  
  if (filters.dateRange) {
    const now = new Date()
    let startDate: Date
    
    switch (filters.dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      default:
        startDate = new Date(0)
    }
    
    filtered = filtered.filter(record => new Date(record.auditedAt) >= startDate)
  }
  
  return filtered.sort((a, b) => new Date(b.auditedAt).getTime() - new Date(a.auditedAt).getTime())
})

/**
 * 格式化相对时间显示
 * 将时间戳转换为用户友好的相对时间格式
 * 
 * @function formatDate
 * @param {string} dateString - ISO时间字符串
 * @returns {string} 格式化后的时间显示
 * 
 * @complexity O(1) - 简单时间计算，常数时间复杂度
 * @flow 时间输入 → 时差计算 → 格式判断 → 文本输出
 * 
 * @example
 * ```typescript
 * formatDate('2024-04-10T14:30:00Z') // "今天 14:30"
 * formatDate('2024-04-09T10:00:00Z') // "昨天 10:00"
 * formatDate('2024-04-05T08:00:00Z') // "5天前"
 * formatDate('2024-03-10T12:00:00Z') // "2024/3/10"
 * ```
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

/**
 * 格式化完整日期时间
 * 将时间戳转换为完整的本地化日期时间格式
 * 
 * @function formatDateTime
 * @param {string} dateString - ISO时间字符串
 * @returns {string} 完整的日期时间字符串
 * 
 * @complexity O(1) - 直接时间格式化，常数时间复杂度
 * 
 * @example
 * ```typescript
 * formatDateTime('2024-04-10T14:30:00Z') // "2024/4/10 22:30:00"
 * ```
 */
function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('zh-CN')
}

/**
 * 截断长文本
 * 限制文本长度，超出部分用省略号替代
 * 
 * @function truncateText
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度
 * @returns {string} 截断后的文本
 * 
 * @complexity O(1) - 字符串截取操作，常数时间复杂度
 * 
 * @example
 * ```typescript
 * truncateText('这是一段很长的文本内容', 10) // "这是一段很长的文..."
 * truncateText('短文本', 10) // "短文本"
 * ```
 */
function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
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
 * getRejectReasonLabel('INVALID_PHONE') // "电话号码无效"
 * getRejectReasonLabel('DUPLICATE_LEAD') // "重复客资"
 * ```
 */
function getRejectReasonLabel(reason: RejectReason): string {
  return REJECT_REASON_LABELS[reason] || reason
}

/**
 * 获取审核记录数据
 * 从API获取指定客资的所有审核记录和审核人信息
 * 
 * @async
 * @function fetchRecords
 * @returns {Promise<void>}
 * 
 * @complexity O(1) - API调用，常数时间复杂度（不考虑网络延迟）
 * @flow API请求 → 数据处理 → 状态更新 → 错误处理
 * 
 * @example
 * ```typescript
 * // 自动在客资变化时调用
 * await fetchRecords()
 * // 记录和审核人数据将更新到响应式变量中
 * ```
 */
async function fetchRecords() {
  if (!props.lead?.id) return
  
  loading.value = true
  try {
    const data = await leadAuditApi.getAuditRecords(props.lead.id)
    records.value = data.records
    auditors.value = data.auditors
  } catch (error) {
    console.error('获取审核记录失败:', error)
    toast({
      title: '获取记录失败',
      description: '请稍后重试',
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
}

/**
 * 刷新审核记录
 * 重新获取最新的审核记录数据
 * 
 * @function refreshRecords
 * @returns {void}
 * 
 * @complexity O(1) - 简单函数调用，常数时间复杂度
 * 
 * @example
 * ```typescript
 * // 用户点击刷新按钮时调用
 * refreshRecords()
 * ```
 */
function refreshRecords() {
  fetchRecords()
}

/**
 * 导出审核记录
 * 将审核记录导出为Excel文件并自动下载
 * 
 * @async
 * @function exportRecords
 * @returns {Promise<void>}
 * 
 * @complexity O(1) - API调用和文件下载，常数时间复杂度
 * @flow API请求 → Blob创建 → URL生成 → 文件下载 → 资源清理
 * 
 * @example
 * ```typescript
 * // 用户点击导出按钮时调用
 * await exportRecords()
 * // 文件会自动下载到用户设备
 * ```
 */
async function exportRecords() {
  if (!props.lead?.id) return
  
  exportLoading.value = true
  try {
    const blob = await leadAuditApi.exportLeadAuditRecords(props.lead.id)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-records-${props.lead.name}-${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast({
      title: '导出成功',
      description: '审核记录已导出',
      variant: 'default'
    })
  } catch (error) {
    console.error('导出失败:', error)
    toast({
      title: '导出失败',
      description: '请稍后重试',
      variant: 'destructive'
    })
  } finally {
    exportLoading.value = false
  }
}

/**
 * 处理审核撤销请求
 * 显示撤销确认对话框，设置当前要撤销的记录
 * 
 * @function handleRevoke
 * @param {LeadAuditRecord} record - 要撤销的审核记录
 * @returns {void}
 * 
 * @complexity O(1) - 简单状态设置，常数时间复杂度
 * 
 * @example
 * ```typescript
 * // 用户点击撤销按钮时调用
 * handleRevoke(auditRecord)
 * // 会显示撤销确认对话框
 * ```
 */
function handleRevoke(record: LeadAuditRecord) {
  currentRecord.value = record
  revokeReason.value = ''
  showRevokeDialog.value = true
}

/**
 * 确认撤销审核
 * 执行审核撤销操作，需要提供撤销原因
 * 
 * @async
 * @function confirmRevoke
 * @returns {Promise<void>}
 * 
 * @complexity O(1) - API调用，常数时间复杂度
 * @flow 输入验证 → API请求 → 状态更新 → 对话框关闭 → 数据刷新
 * 
 * @example
 * ```typescript
 * // 用户确认撤销时调用
 * await confirmRevoke()
 * // 审核会被撤销，客资重新进入待审核状态
 * ```
 */
async function confirmRevoke() {
  if (!currentRecord.value || !revokeReason.value.trim()) {
    toast({
      title: '请填写撤销原因',
      variant: 'destructive'
    })
    return
  }
  
  revokeLoading.value = true
  try {
    await leadAuditApi.revokeAudit(currentRecord.value.id, {
      reason: revokeReason.value.trim()
    })
    
    toast({
      title: '撤销成功',
      description: '审核已撤销，客资重新进入待审核状态',
      variant: 'default'
    })
    
    showRevokeDialog.value = false
    refreshRecords()
  } catch (error) {
    console.error('撤销失败:', error)
    toast({
      title: '撤销失败',
      description: '请稍后重试',
      variant: 'destructive'
    })
  } finally {
    revokeLoading.value = false
  }
}

// 监听客资变化
watch(() => props.lead, (newLead) => {
  if (newLead) {
    fetchRecords()
  }
}, { immediate: true })

// 组件挂载时获取数据
onMounted(() => {
  if (props.lead) {
    fetchRecords()
  }
})
</script>
