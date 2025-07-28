<!--
/**
 * @fileoverview 客资表单组件
 * 基于Vue 3 Composition API构建的客资创建和编辑表单组件，提供完整的客资信息录入功能
 * 支持实时表单验证、来源自动识别、重复性检查和推荐码验证等高级功能
 * 集成移动端响应式设计，确保在不同设备上的最佳用户体验
 * 
 * @component LeadForm
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.4.0
 * 
 * @description
 * LeadForm组件是客资管理系统的核心表单组件，提供以下主要功能：
 * - 📝 完整的客资信息录入，包含基础信息、来源信息和备注
 * - ✅ 实时表单验证，确保数据的完整性和有效性
 * - 🔍 来源自动识别，支持UTM参数解析和来源智能检测
 * - 🔄 重复性检查，防止重复客资的创建
 * - 🎯 推荐码验证，支持邀请码和推荐链接的验证
 * - 📱 响应式布局，大屏幕2列显示，小屏幕1列布局
 * - 🔄 加载状态管理，提供友好的用户反馈
 * - 🚨 错误处理和Toast提示，及时反馈操作结果
 * 
 * @usage
 * ```vue
 * <template>
 *   <LeadForm
 *     :mode="formMode"
 *     :lead="currentLead"
 *     @submit="handleFormSubmit"
 *     @cancel="handleFormCancel"
 *   />
 * </template>
 * ```
 * 
 * @example
 * ```typescript
 * // 创建模式
 * const formMode = 'create'
 * 
 * function handleFormSubmit(leadData: Lead) {
 *   // 处理表单提交
 *   console.log('客资数据:', leadData)
 * }
 * 
 * // 编辑模式
 * const editLead: Lead = {
 *   id: 'lead_001',
 *   name: '张三',
 *   phone: '13800138000',
 *   source: 'website'
 * }
 * ```
 */
-->

<!--
  客资表单组件
  
  功能特性：
  - 响应式布局（大屏幕2列，小屏幕1列）
  - 实时表单验证
  - 来源自动识别
  - 重复性检查
  - 推荐码验证
  - 加载状态管理
  - 错误处理和Toast提示
-->

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6 mobile-form-container">
    <!-- 基础信息 -->
    <div class="space-y-4 mobile-form-section">
      <h3 class="text-lg font-medium text-gray-900 mobile-form-title">基础信息</h3>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mobile-form-grid">
        <!-- 客户姓名 -->
        <div class="space-y-2 mobile-form-field">
          <Label for="name" class="flex items-center mobile-form-label">
            <UserIcon class="w-4 h-4 mr-1 text-gray-500" />
            客户姓名 <span class="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="name"
            v-model="formData.name"
            placeholder="请输入客户姓名"
            class="mobile-form-input"
            :class="{ 'border-red-500': errors.name }"
            @blur="validateField('name')"
          />
          <p v-if="errors.name" class="text-sm text-red-500">{{ errors.name }}</p>
        </div>

        <!-- 联系电话 -->
        <div class="space-y-2">
          <Label for="phone" class="flex items-center">
            <PhoneIcon class="w-4 h-4 mr-1 text-gray-500" />
            联系电话 <span class="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="phone"
            v-model="formData.phone"
            placeholder="请输入手机号"
            :class="{ 'border-red-500': errors.phone }"
            @blur="validateField('phone')"
            @input="handlePhoneInput"
          />
          <p v-if="errors.phone" class="text-sm text-red-500">{{ errors.phone }}</p>
          <p v-if="duplicateWarning" class="text-sm text-yellow-600">{{ duplicateWarning }}</p>
        </div>

        <!-- 微信号 -->
        <div class="space-y-2">
          <Label for="wechatId" class="flex items-center">
            <MessageCircleIcon class="w-4 h-4 mr-1 text-gray-500" />
            微信号
          </Label>
          <Input
            id="wechatId"
            v-model="formData.wechatId"
            placeholder="请输入微信号（可选）"
            :class="{ 'border-red-500': errors.wechatId }"
            @blur="validateField('wechatId')"
          />
          <p v-if="errors.wechatId" class="text-sm text-red-500">{{ errors.wechatId }}</p>
        </div>

        <!-- 归属销售 -->
        <div class="space-y-2">
          <Label for="salespersonId" class="flex items-center">
            <UserCheckIcon class="w-4 h-4 mr-1 text-gray-500" />
            归属销售 <span class="text-red-500 ml-1">*</span>
          </Label>
          <Select v-model="formData.salespersonId">
            <SelectTrigger :class="{ 'border-red-500': errors.salespersonId }">
              <SelectValue placeholder="请选择归属销售" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="sales in salesList" :key="sales.id" :value="sales.id">
                {{ sales.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="errors.salespersonId" class="text-sm text-red-500">{{ errors.salespersonId }}</p>
        </div>
      </div>
    </div>

    <!-- 来源信息 -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">来源信息</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          @click="detectSource"
          :disabled="sourceDetecting"
        >
          <RefreshCwIcon class="w-4 h-4 mr-1" :class="{ 'animate-spin': sourceDetecting }" />
          自动识别
        </Button>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- 来源渠道 -->
        <div class="space-y-2">
          <Label for="source" class="flex items-center">
            <GlobeIcon class="w-4 h-4 mr-1 text-gray-500" />
            来源渠道 <span class="text-red-500 ml-1">*</span>
          </Label>
          <Select v-model="formData.source">
            <SelectTrigger :class="{ 'border-red-500': errors.source }">
              <SelectValue placeholder="请选择来源渠道" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="source in sourceOptions" :key="source.value" :value="source.value">
                {{ source.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="errors.source" class="text-sm text-red-500">{{ errors.source }}</p>
          <p v-if="sourceDetectionResult" class="text-sm text-green-600">
            {{ sourceDetectionResult }}
          </p>
        </div>

        <!-- 推荐码 -->
        <div class="space-y-2">
          <Label for="referralCode" class="flex items-center">
            <TagIcon class="w-4 h-4 mr-1 text-gray-500" />
            推荐码
          </Label>
          <Input
            id="referralCode"
            v-model="formData.referralCode"
            placeholder="请输入推荐码（可选）"
            :class="{ 'border-red-500': errors.referralCode }"
            @blur="validateReferralCode"
          />
          <p v-if="errors.referralCode" class="text-sm text-red-500">{{ errors.referralCode }}</p>
          <p v-if="referralCodeInfo" class="text-sm text-green-600">{{ referralCodeInfo }}</p>
        </div>
      </div>

      <!-- UTM参数（自动检测时显示） -->
      <div v-if="utmParams && Object.keys(utmParams).length > 0" class="space-y-2">
        <Label class="text-sm font-medium text-gray-700">UTM参数</Label>
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          <div v-if="utmParams.utmSource" class="bg-gray-50 p-2 rounded">
            <span class="font-medium">来源:</span> {{ utmParams.utmSource }}
          </div>
          <div v-if="utmParams.utmMedium" class="bg-gray-50 p-2 rounded">
            <span class="font-medium">媒介:</span> {{ utmParams.utmMedium }}
          </div>
          <div v-if="utmParams.utmCampaign" class="bg-gray-50 p-2 rounded">
            <span class="font-medium">活动:</span> {{ utmParams.utmCampaign }}
          </div>
        </div>
      </div>
    </div>

    <!-- 备注信息 -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">备注信息</h3>
      
      <div class="space-y-2">
        <Label for="notes" class="flex items-center">
          <FileTextIcon class="w-4 h-4 mr-1 text-gray-500" />
          备注
        </Label>
        <Textarea
          id="notes"
          v-model="formData.notes"
          placeholder="请输入备注信息（可选）"
          rows="3"
          :class="{ 'border-red-500': errors.notes }"
          @blur="validateField('notes')"
        />
        <p v-if="errors.notes" class="text-sm text-red-500">{{ errors.notes }}</p>
        <p class="text-sm text-gray-500">{{ (formData.notes || '').length }}/500</p>
      </div>
    </div>

    <!-- 表单操作按钮 -->
    <div class="flex justify-end space-x-3 pt-4 border-t">
      <Button type="button" variant="outline" @click="handleCancel" :disabled="loading">
        取消
      </Button>
      <Button type="submit" :disabled="loading || !isFormValid">
        <LoaderIcon v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
        {{ mode === 'create' ? '创建客资' : '更新客资' }}
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
/**
 * @fileoverview LeadForm组件的核心逻辑实现
 * 使用Vue 3 Composition API实现客资表单的完整功能
 */
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { 
  UserIcon, PhoneIcon, MessageCircleIcon, UserCheckIcon, 
  GlobeIcon, TagIcon, FileTextIcon, RefreshCwIcon, LoaderIcon
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast/use-toast'

import type { CreateLeadRequest, UpdateLeadRequest, PredefinedSource, UTMParams } from '@/types/lead'
import { LeadFormValidator } from '@/utils/leadValidation'
import { SourceDetectionEngine, UTMParser } from '@/utils/sourceDetection'
import { leadApi } from '@/api/lead'

/**
 * 组件属性接口定义
 * 定义LeadForm组件的输入属性
 * 
 * @interface Props
 * 
 * @property {'create' | 'edit'} mode - 表单模式：创建或编辑
 * @property {Partial<CreateLeadRequest>} [initialData] - 初始数据，编辑模式时使用
 * @property {boolean} [loading] - 表单提交加载状态
 * 
 * @example
 * ```typescript
 * const props: Props = {
 *   mode: 'create',
 *   initialData: {
 *     name: '张三',
 *     phone: '13800138000'
 *   },
 *   loading: false
 * }
 * ```
 */
interface Props {
  mode: 'create' | 'edit'
  initialData?: Partial<CreateLeadRequest>
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  loading: false
})

/**
 * 组件事件定义
 * 定义LeadForm组件对外发出的事件
 * 
 * @events
 * 
 * @event submit - 表单提交事件，参数为表单数据
 * @event cancel - 取消操作事件，无参数
 * 
 * @example
 * ```typescript
 * // 事件处理示例
 * function handleFormSubmit(data: CreateLeadRequest) {
 *   // 处理表单提交逻辑
 *   console.log('表单数据:', data)
 * }
 * 
 * function handleFormCancel() {
 *   // 处理取消操作
 *   router.back()
 * }
 * ```
 */
const emit = defineEmits<{
  submit: [data: CreateLeadRequest | UpdateLeadRequest]
  cancel: []
}>()

// Composables
const { toast } = useToast()

/**
 * 表单数据模型
 * 管理客资表单的所有输入数据
 * 
 * @reactive formData
 * @type {CreateLeadRequest}
 * 
 * @property {string} name - 客户姓名
 * @property {string} phone - 联系电话
 * @property {string} source - 来源渠道
 * @property {string} salespersonId - 归属销售ID
 * @property {string} wechatId - 微信号
 * @property {string} notes - 备注信息
 * @property {string} referralCode - 推荐码
 * @property {UTMParams} utmParams - UTM参数
 * @property {string} referrer - 推荐来源URL
 * 
 * @example
 * ```typescript
 * // 表单数据示例
 * formData.name = '张三'
 * formData.phone = '13800138000'
 * formData.source = 'WEBSITE'
 * formData.salespersonId = 'S001'
 * ```
 */
const formData = reactive<CreateLeadRequest>({
  name: '',
  phone: '',
  source: '',
  salespersonId: '',
  wechatId: '',
  notes: '',
  referralCode: '',
  utmParams: {},
  referrer: ''
})

/**
 * 表单验证错误信息
 * 存储各字段的验证错误消息
 * 
 * @reactive errors
 * @type {Record<string, string>}
 * 
 * @example
 * ```typescript
 * // 设置错误信息
 * errors.name = '客户姓名不能为空'
 * errors.phone = '手机号格式不正确'
 * 
 * // 清空错误信息
 * delete errors.name
 * ```
 */
const errors = reactive<Record<string, string>>({})

/**
 * 组件状态变量
 * 管理组件的各种状态信息
 */
const sourceDetecting = ref(false)
const duplicateWarning = ref('')
const sourceDetectionResult = ref('')
const referralCodeInfo = ref('')
const utmParams = ref<UTMParams>({})

/**
 * 销售人员列表
 * 提供销售人员选择选项（实际应从API获取）
 * 
 * @ref salesList
 * @type {Array<{id: string, name: string}>}
 * 
 * @example
 * ```typescript
 * // 获取销售人员列表
 * const allSales = salesList.value
 * 
 * // 查找特定销售人员
 * const sales = salesList.value.find(s => s.id === 'S001')
 * ```
 */
const salesList = ref([
  { id: 'S001', name: '张三' },
  { id: 'S002', name: '李四' },
  { id: 'S003', name: '王五' },
  { id: 'S004', name: '赵六' }
])

/**
 * 来源渠道选项列表
 * 提供可选的客资来源渠道配置
 * 
 * @computed sourceOptions
 * @returns {Array<{value: string, label: string}>} 来源选项数组
 * 
 * @complexity O(1) - 静态配置数组，常数时间复杂度
 * 
 * @example
 * ```typescript
 * // 获取所有来源选项
 * const options = sourceOptions.value
 * 
 * // 查找特定来源
 * const option = options.find(opt => opt.value === 'WEBSITE')
 * ```
 */
const sourceOptions = computed(() => [
  { value: 'SEARCH_ENGINE', label: '搜索引擎' },
  { value: 'GOOGLE', label: 'Google搜索' },
  { value: 'BAIDU', label: '百度搜索' },
  { value: 'WECHAT', label: '微信' },
  { value: 'XIAOHONGSHU', label: '小红书' },
  { value: 'WEIBO', label: '微博' },
  { value: 'DOUYIN', label: '抖音' },
  { value: 'REFERRAL', label: '客户推荐' },
  { value: 'AGENT_REFERRAL', label: '代理推荐' },
  { value: 'OFFLINE', label: '线下活动' },
  { value: 'WEBSITE', label: '官网咨询' },
  { value: 'HOTLINE', label: '热线电话' },
  { value: 'OTHER', label: '其他' }
])

/**
 * 表单有效性验证
 * 检查表单是否满足提交条件
 * 
 * @computed isFormValid
 * @returns {boolean} 表单是否有效
 * 
 * @complexity O(1) - 简单条件检查，常数时间复杂度
 * @flow 必填字段检查 → 错误信息检查 → 有效性判断
 * 
 * @example
 * ```typescript
 * // 检查表单有效性
 * if (isFormValid.value) {
 *   // 可以提交表单
 *   submitButton.disabled = false
 * } else {
 *   // 表单无效，禁用提交
 *   submitButton.disabled = true
 * }
 * ```
 */
const isFormValid = computed(() => {
  return formData.name && 
         formData.phone && 
         formData.source && 
         formData.salespersonId &&
         Object.keys(errors).length === 0
})

/**
 * 初始化表单数据
 * 根据属性设置表单初始值，并执行初始化操作
 * 
 * @function initializeForm
 * @returns {void}
 * 
 * @complexity O(1) - 对象赋值和函数调用，常数时间复杂度
 * @flow 数据赋值 → 模式检查 → 来源检测
 * 
 * @example
 * ```typescript
 * // 初始化表单（通常在组件挂载时调用）
 * initializeForm()
 * 
 * // 编辑模式下的初始化
 * props.initialData = {
 *   name: '张三',
 *   phone: '13800138000'
 * }
 * initializeForm() // 会自动设置表单数据
 * ```
 */
function initializeForm() {
  if (props.initialData) {
    Object.assign(formData, props.initialData)
  }
  
  // 自动检测来源
  if (props.mode === 'create') {
    detectSource()
  }
}

/**
 * 单字段验证
 * 验证表单中的单个字段，设置相应的错误信息
 * 
 * @async
 * @function validateField
 * @param {string} fieldName - 要验证的字段名
 * @returns {Promise<void>}
 * 
 * @complexity O(1) - 单个字段验证，常数时间复杂度
 * @flow 字段值获取 → 验证规则应用 → 错误处理 → 状态更新
 * 
 * @example
 * ```typescript
 * // 验证客户姓名
 * await validateField('name')
 * 
 * // 验证手机号
 * await validateField('phone')
 * 
 * // 验证后检查错误
 * if (errors.name) {
 *   console.log('姓名验证失败:', errors.name)
 * }
 * ```
 */
async function validateField(fieldName: string) {
  const value = formData[fieldName as keyof CreateLeadRequest]
  const result = LeadFormValidator.validateField(fieldName, value)
  
  if (result.isValid) {
    delete errors[fieldName]
  } else {
    errors[fieldName] = result.message || '验证失败'
  }
}

/**
 * 手机号输入处理
 * 处理手机号输入事件，包括验证和重复性检查
 * 
 * @async
 * @function handlePhoneInput
 * @returns {Promise<void>}
 * 
 * @complexity O(1) - API调用，常数时间复杂度（不考虑网络延迟）
 * @flow 字段验证 → 重复性检查 → 警告设置 → 错误处理
 * 
 * @example
 * ```typescript
 * // 在手机号输入框失焦时调用
 * await handlePhoneInput()
 * 
 * // 如果发现重复
 * if (duplicateWarning.value) {
 *   console.log('重复警告:', duplicateWarning.value)
 * }
 * ```
 */
async function handlePhoneInput() {
  await validateField('phone')
  
  // 重复性检查
  if (formData.phone && !errors.phone) {
    try {
      const result = await leadApi.checkDuplicateLead({ phone: formData.phone })
      if (result.isDuplicate && result.duplicateLeads.length > 0) {
        duplicateWarning.value = `发现${result.duplicateLeads.length}条相似记录`
      } else {
        duplicateWarning.value = ''
      }
    } catch (error) {
      console.warn('重复性检查失败:', error)
    }
  }
}

/**
 * 推荐码验证
 * 验证推荐码的有效性并获取推荐人信息
 * 
 * @async
 * @function validateReferralCode
 * @returns {Promise<void>}
 * 
 * @complexity O(1) - API调用，常数时间复杂度（不考虑网络延迟）
 * @flow 空值检查 → 字段验证 → 推荐码验证 → 信息显示
 * 
 * @example
 * ```typescript
 * // 在推荐码输入框失焦时调用
 * await validateReferralCode()
 * 
 * // 如果验证成功
 * if (referralCodeInfo.value) {
 *   console.log('推荐人信息:', referralCodeInfo.value)
 * }
 * ```
 */
async function validateReferralCode() {
  if (!formData.referralCode) {
    referralCodeInfo.value = ''
    return
  }
  
  await validateField('referralCode')
  
  if (!errors.referralCode) {
    try {
      const result = await leadApi.validateReferralCode(formData.referralCode)
      if (result.isValid && result.referrerInfo) {
        referralCodeInfo.value = `推荐人: ${result.referrerInfo.name} (${result.referrerInfo.role})`
      } else {
        referralCodeInfo.value = ''
      }
    } catch (error) {
      console.warn('推荐码验证失败:', error)
    }
  }
}

/**
 * 来源自动检测
 * 基于当前页面环境自动检测和识别客资来源
 * 
 * @async
 * @function detectSource
 * @returns {Promise<void>}
 * 
 * @complexity O(1) - API调用和URL解析，常数时间复杂度
 * @flow 环境数据收集 → API检测 → 结果处理 → 表单更新
 * 
 * @example
 * ```typescript
 * // 手动触发来源检测
 * await detectSource()
 * 
 * // 检测完成后检查结果
 * if (sourceDetectionResult.value) {
 *   console.log('检测结果:', sourceDetectionResult.value)
 * }
 * 
 * // UTM参数会自动解析并设置
 * if (utmParams.value.utmSource) {
 *   console.log('UTM来源:', utmParams.value.utmSource)
 * }
 * ```
 */
async function detectSource() {
  sourceDetecting.value = true
  
  try {
    const detectionData = {
      referrer: document.referrer,
      utmParams: UTMParser.parseFromCurrentURL(),
      userAgent: navigator.userAgent,
      currentURL: window.location.href
    }
    
    const result = await leadApi.detectLeadSource(detectionData)
    
    if (result.suggestedSource) {
      formData.source = result.suggestedSource
      sourceDetectionResult.value = `自动识别: ${result.sourceDetail} (置信度: ${Math.round(result.confidence * 100)}%)`
    }
    
    if (result.utmParams) {
      utmParams.value = result.utmParams
      formData.utmParams = result.utmParams
    }
    
    if (result.referrer) {
      formData.referrer = result.referrer
    }
  } catch (error) {
    console.warn('来源检测失败:', error)
    toast({
      title: '来源检测失败',
      description: '请手动选择来源渠道',
      variant: 'destructive'
    })
  } finally {
    sourceDetecting.value = false
  }
}

/**
 * 表单提交处理
 * 执行完整的表单验证并提交数据
 * 
 * @async
 * @function handleSubmit
 * @returns {Promise<void>}
 * 
 * @complexity O(1) - 表单验证和事件发出，常数时间复杂度
 * @flow 表单验证 → 错误检查 → 数据提交 → 异常处理
 * 
 * @example
 * ```typescript
 * // 在表单提交时调用
 * await handleSubmit()
 * 
 * // 如果验证失败，会显示错误信息
 * // 如果验证通过，会触发submit事件
 * ```
 */
async function handleSubmit() {
  // 验证所有字段
  const validation = props.mode === 'create' 
    ? await LeadFormValidator.validateCreateForm(formData)
    : await LeadFormValidator.validateUpdateForm(formData, '')
  
  if (!validation.isValid) {
    Object.assign(errors, validation.errors)
    toast({
      title: '表单验证失败',
      description: '请检查并修正表单中的错误',
      variant: 'destructive'
    })
    return
  }
  
  try {
    emit('submit', formData)
  } catch (error) {
    toast({
      title: '提交失败',
      description: error instanceof Error ? error.message : '未知错误',
      variant: 'destructive'
    })
  }
}

/**
 * 取消操作处理
 * 处理用户取消表单操作
 * 
 * @function handleCancel
 * @returns {void}
 * 
 * @complexity O(1) - 简单事件发出，常数时间复杂度
 * 
 * @example
 * ```typescript
 * // 用户点击取消按钮时调用
 * handleCancel()
 * // 会触发cancel事件
 * ```
 */
function handleCancel() {
  emit('cancel')
}

// 监听初始数据变化
watch(() => props.initialData, initializeForm, { immediate: true })

// 组件挂载时初始化
onMounted(() => {
  initializeForm()
})
</script>
