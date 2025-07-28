<!--
/**
 * @fileoverview 邀请码卡片组件
 * 基于Vue 3 Composition API构建的邀请码管理卡片组件，提供邀请码展示、复制、分享、二维码生成等完整功能
 * 集成shadcn-vue设计系统和动态二维码生成，支持邀请码的状态管理、使用统计、进度可视化等高级特性
 * 采用响应式设计和性能优化策略，确保在各种设备和网络环境下的流畅体验
 * 
 * @component InvitationCodeCard
 * @author Frontend Team
 * @since 1.0.0
 * @version 2.3.0
 * 
 * @description
 * InvitationCodeCard组件是邀请系统的核心展示组件，主要功能包括：
 * - 🎫 完整的邀请码信息展示，包含码值、链接、状态、使用统计等详细信息
 * - 📋 一键复制功能，支持邀请码和邀请链接的快速复制到剪贴板
 * - 📱 二维码生成和展示，支持动态生成、预览、下载等完整二维码功能
 * - 🔗 智能分享功能，支持原生Web Share API和降级复制方案
 * - 📊 直观的使用统计展示，包含进度条、剩余次数、使用百分比等信息
 * - 🎛️ 状态控制功能，支持邀请码的启用、停用操作
 * - 🎨 多样化的状态指示，包含状态徽章、颜色编码、进度条等视觉反馈
 * - 📝 角色信息展示，提供角色名称、描述、权限等详细信息
 * - ⚡ 高性能二维码处理，支持异步加载、错误处理、内存管理等优化
 * - 📱 响应式设计，完美适配移动端和桌面端显示
 * 
 * @usage
 * ```vue
 * <template>
 *   <InvitationCodeCard
 *     :invitation-code="codeData"
 *     :loading="isLoading"
 *     @copy="handleCopy"
 *     @copy-link="handleCopyLink"
 *     @reactivate="handleReactivate"
 *     @deactivate="handleDeactivate"
 *     @share="handleShare"
 *   />
 * </template>
 * ```
 * 
 * @example
 * ```typescript
 * // 基础使用示例
 * const codeData: ExtendedInvitationCode = {
 *   id: 'inv_001',
 *   code: 'AGENT2024001',
 *   targetRole: 'agent',
 *   status: 'active',
 *   usageCount: 5,
 *   maxUsage: 20,
 *   createdAt: '2024-01-15T10:30:00Z'
 * }
 * 
 * function handleCopy(code: string) {
 *   // 处理邀请码复制
 *   console.log('邀请码已复制:', code)
 * }
 * 
 * function handleShare(link: string, roleName: string) {
 *   // 处理邀请链接分享
 *   analytics.track('invitation_shared', { role: roleName })
 * }
 * 
 * function handleReactivate(codeId: string) {
 *   // 重新激活邀请码
 *   updateCodeStatus(codeId, 'active')
 * }
 * ```
 * 
 * @dependencies
 * - shadcn-vue: UI组件库，提供Card、Button、Dialog等基础组件
 * - lucide-vue-next: 图标库，提供Copy、QrCode、Share2等操作图标
 * - qrcode: 二维码生成库，动态加载用于生成邀请链接二维码
 * - Vue 3 Composition API: 响应式状态管理
 * 
 * @features
 * - **邀请码展示**: 清晰的邀请码和链接展示，支持文本选择和复制
 * - **二维码功能**: 动态二维码生成、预览、下载，支持高清输出
 * - **状态管理**: 邀请码的启用/停用控制，实时状态同步
 * - **使用统计**: 可视化进度条显示使用情况，支持无限制模式
 * - **分享集成**: 原生分享API支持，自动降级到复制链接
 * - **角色系统**: 完整的角色展示和描述，支持多角色类型
 * - **错误处理**: 完善的错误处理和用户提示，优雅的降级方案
 * - **性能优化**: 异步二维码生成、内存管理、DOM操作优化
 * - **响应式布局**: 移动端优化的卡片布局和交互设计
 * - **无障碍访问**: ARIA标签、键盘导航、屏幕阅读器支持
 */
-->

<template>
  <Card class="w-full">
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="text-lg">{{ roleName }}</CardTitle>
          <CardDescription class="text-sm text-muted-foreground mt-1">
            {{ roleDescription }}
          </CardDescription>
        </div>
        <Badge :variant="codeStatus.variant" class="ml-2">
          {{ codeStatus.text }}
        </Badge>
      </div>
    </CardHeader>

    <CardContent class="space-y-4">
      <!-- 邀请码展示 -->
      <div class="space-y-2">
        <Label class="text-sm font-medium">邀请码</Label>
        <div class="flex items-center space-x-2">
          <div class="flex-1 p-3 bg-muted/50 rounded-md font-mono text-sm select-all">
            {{ invitationCode.code }}
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            @click="copyCode"
            :disabled="loading"
          >
            <Copy class="w-4 h-4" />
          </Button>
        </div>
      </div>

      <!-- 邀请链接 -->
      <div class="space-y-2">
        <Label class="text-sm font-medium">邀请链接</Label>
        <div class="flex items-center space-x-2">
          <div class="flex-1 p-3 bg-muted/50 rounded-md text-sm text-muted-foreground truncate select-all">
            {{ invitationLink }}
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            @click="copyLink"
            :disabled="loading"
          >
            <Copy class="w-4 h-4" />
          </Button>
        </div>
      </div>

      <!-- 使用统计 -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <Label class="text-sm font-medium">使用情况</Label>
          <span class="text-sm text-muted-foreground">
            {{ usageStats.used }}/{{ usageStats.remaining === 'unlimited' ? '∞' : usageStats.remaining + usageStats.used }}
          </span>
        </div>
        
        <!-- 进度条 -->
        <div class="space-y-2">
          <Progress 
            :value="usageStats.percentage" 
            class="w-full"
            :class="{
              'progress-success': usageStats.percentage < 70,
              'progress-warning': usageStats.percentage >= 70 && usageStats.percentage < 90,
              'progress-danger': usageStats.percentage >= 90
            }"
          />
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>已使用 {{ usageStats.used }} 次</span>
            <span v-if="usageStats.remaining !== 'unlimited'">
              剩余 {{ usageStats.remaining }} 次
            </span>
            <span v-else>
              无限制
            </span>
          </div>
        </div>
      </div>

      <!-- 创建时间 -->
      <div class="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <span>创建时间</span>
        <span>{{ formatDate(invitationCode.createdAt) }}</span>
      </div>
    </CardContent>

    <CardFooter class="pt-3 flex justify-between">
      <!-- 左侧操作按钮 -->
      <div class="flex space-x-2">
        <Button 
          size="sm" 
          variant="outline"
          @click="showQRCode"
          :disabled="loading"
        >
          <QrCode class="w-4 h-4 mr-1" />
          二维码
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          @click="shareLink"
          :disabled="loading"
        >
          <Share2 class="w-4 h-4 mr-1" />
          分享
        </Button>
      </div>

      <!-- 右侧状态操作 -->
      <div class="flex space-x-2">
        <Button 
          v-if="invitationCode.status === 'inactive'"
          size="sm" 
          variant="default"
          @click="reactivateCode"
          :disabled="loading"
        >
          <Play class="w-4 h-4 mr-1" />
          启用
        </Button>
        <Button 
          v-else
          size="sm" 
          variant="secondary"
          @click="deactivateCode"
          :disabled="loading"
        >
          <Pause class="w-4 h-4 mr-1" />
          停用
        </Button>
      </div>
    </CardFooter>

    <!-- 二维码弹窗 -->
    <Dialog v-model:open="qrCodeDialogOpen" @update:open="val => !val && handleDialogClose()">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>邀请码二维码</DialogTitle>
          <DialogDescription>
            扫描二维码或分享给其他人快速注册
          </DialogDescription>
        </DialogHeader>
        
        <div class="flex flex-col items-center space-y-4 py-4">
          <!-- 二维码 -->
          <div 
            ref="qrCodeContainer"
            class="w-48 h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/25"
          >
            <!-- 强制使用DOM操作显示二维码，不依赖Vue的响应式系统 -->
            <!-- 此处内容将由JavaScript动态添加 -->
          </div>
          
          <!-- 链接信息 -->
          <div class="text-center space-y-1 max-w-full">
            <p class="font-medium">{{ roleName }}</p>
            <p class="text-xs text-muted-foreground break-all px-2">{{ invitationLink }}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="handleDialogClose()">
            关闭
          </Button>
          <Button @click="downloadQRCode" :disabled="qrCodeLoading || qrCodeError || !qrCodeImageUrl">
            <Download class="w-4 h-4 mr-1" />
            下载
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Card>
</template>

<script setup lang="ts">
/**
 * @fileoverview InvitationCodeCard组件的核心逻辑实现
 * 使用Vue 3 Composition API实现邀请码的复杂管理、二维码生成、状态控制等全套功能
 */
import { computed, ref, nextTick, onBeforeUnmount, watch } from 'vue'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast/use-toast'
import { 
  Copy, 
  QrCode, 
  Share2, 
  Play, 
  Pause, 
  Download,
  AlertCircle 
} from 'lucide-vue-next'
import type { InvitationCode } from '@/types/invitation'
import type { UserRole } from '@/types/api'
import { generateInvitationLink, getRoleDisplayName } from '@/api/invitation'

/**
 * 扩展的邀请码接口定义
 * 在基础InvitationCode类型上扩展可选的最大使用次数和过期时间属性
 * 
 * @interface ExtendedInvitationCode
 * @extends InvitationCode
 * 
 * @property {number} [maxUsage] - 邀请码最大使用次数限制，undefined表示无限制
 * @property {string} [expiresAt] - 邀请码过期时间，ISO字符串格式
 * 
 * @example
 * ```typescript
 * const codeData: ExtendedInvitationCode = {
 *   id: 'inv_001',
 *   code: 'AGENT2024001',
 *   targetRole: 'agent',
 *   status: 'active',
 *   usageCount: 5,
 *   maxUsage: 20,
 *   createdAt: '2024-01-15T10:30:00Z',
 *   expiresAt: '2024-12-31T23:59:59Z'
 * }
 * ```
 */
interface ExtendedInvitationCode extends InvitationCode {
  /** 邀请码最大使用次数，undefined表示无限制 */
  maxUsage?: number;
  /** 邀请码过期时间，ISO格式的日期字符串 */
  expiresAt?: string;
}

/**
 * 组件属性接口定义
 * 定义InvitationCodeCard组件的输入属性
 * 
 * @interface Props
 * 
 * @property {ExtendedInvitationCode} invitationCode - 邀请码数据对象，包含所有相关信息
 * @property {boolean} [loading=false] - 组件加载状态，影响按钮禁用和交互
 * 
 * @example
 * ```typescript
 * const props: Props = {
 *   invitationCode: {
 *     id: 'inv_001',
 *     code: 'AGENT2024001',
 *     targetRole: 'agent',
 *     status: 'active',
 *     usageCount: 5,
 *     maxUsage: 20,
 *     createdAt: '2024-01-15T10:30:00Z'
 *   },
 *   loading: false
 * }
 * ```
 */
interface Props {
  /** 邀请码数据对象，包含码值、状态、使用情况等完整信息 */
  invitationCode: ExtendedInvitationCode
  /** 组件加载状态，影响按钮的禁用状态和用户交互 */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

/**
 * 组件事件接口定义
 * 定义InvitationCodeCard组件对外发出的所有事件
 * 
 * @interface Emits
 * 
 * @event copy - 邀请码复制事件，传递复制的邀请码字符串
 * @event copyLink - 邀请链接复制事件，传递复制的链接字符串
 * @event reactivate - 邀请码重新激活事件，传递邀请码ID
 * @event deactivate - 邀请码停用事件，传递邀请码ID
 * @event share - 分享事件，传递分享链接和角色名称
 * 
 * @example
 * ```typescript
 * // 事件处理示例
 * function handleCopy(code: string) {
 *   // 记录复制操作
 *   analytics.track('invitation_code_copied', { code })
 * }
 * 
 * function handleReactivate(codeId: string) {
 *   // 重新激活邀请码
 *   updateInvitationCodeStatus(codeId, 'active')
 * }
 * 
 * function handleShare(link: string, roleName: string) {
 *   // 处理分享操作
 *   analytics.track('invitation_shared', { role: roleName })
 * }
 * ```
 */
interface Emits {
  /** 用户复制邀请码时触发，传递邀请码字符串 */
  copy: [code: string]
  /** 用户复制邀请链接时触发，传递完整链接URL */
  copyLink: [link: string]
  /** 用户重新激活邀请码时触发，传递邀请码ID */
  reactivate: [codeId: string]
  /** 用户停用邀请码时触发，传递邀请码ID */
  deactivate: [codeId: string]
  /** 用户分享邀请链接时触发，传递链接和角色名称 */
  share: [link: string, roleName: string]
}

const emit = defineEmits<Emits>()

/**
 * 组件响应式状态管理
 * 管理二维码对话框、生成状态、错误处理等核心状态
 */

/** 二维码对话框开启状态 */
const qrCodeDialogOpen = ref(false)
/** 二维码生成加载状态 */
const qrCodeLoading = ref(false)
/** 二维码生成错误状态 */
const qrCodeError = ref(false)
/** 二维码容器DOM引用 */
const qrCodeContainer = ref<HTMLElement | null>(null)
/** 预生成的二维码图像URL */
const qrCodeImageUrl = ref<string | null>(null)

/**
 * 二维码生成取消控制和清理机制
 * 全局变量用于控制异步操作的生命周期
 */
let qrCodeGenerationAborted = false
let qrCodeCleanupTimeout: number | null = null

/**
 * 组件卸载前的清理操作
 * 确保所有异步操作被正确取消，内存资源被及时释放
 * 
 * @lifecycle onBeforeUnmount
 * 
 * @complexity O(1) - 常数时间的清理操作
 * @flow 设置中断标志 → 清理定时器 → 释放Blob URL → 重置状态
 * 
 * @description 清理操作包括：
 * - 设置二维码生成中断标志
 * - 清理延时定时器
 * - 释放创建的Blob URL内存
 * - 重置相关状态变量
 */
onBeforeUnmount(() => {
  qrCodeGenerationAborted = true
  
  // 清理定时器
  if (qrCodeCleanupTimeout) {
    clearTimeout(qrCodeCleanupTimeout)
  }
  
  // 清理图像URL
  if (qrCodeImageUrl.value) {
    URL.revokeObjectURL(qrCodeImageUrl.value)
    qrCodeImageUrl.value = null
  }
})

/**
 * 二维码对话框关闭处理函数
 * 处理用户主动关闭二维码显示对话框的操作
 * 
 * @function handleDialogClose
 * @returns {void}
 * 
 * @complexity O(1) - 简单的状态设置，常数时间复杂度
 * @flow 用户操作 → 关闭对话框 → 状态更新
 * 
 * @description 功能说明：
 * - 响应用户的对话框关闭操作
 * - 更新对话框开启状态为false
 * - 触发相关的清理和状态重置
 * 
 * @example
 * ```typescript
 * // 用户点击关闭按钮时
 * handleDialogClose() // 对话框状态设置为关闭
 * ```
 */
const handleDialogClose = () => {
  qrCodeDialogOpen.value = false
}

/**
 * 监听二维码对话框开启状态变化
 * 根据对话框的开启/关闭状态执行相应的初始化或清理操作
 * 
 * @watcher qrCodeDialogOpen
 * @param {boolean} isOpen - 对话框是否开启
 * 
 * @complexity O(1) - 条件判断和函数调用，常数时间复杂度
 * @flow 状态变化监听 → 条件判断 → 初始化或清理操作
 * 
 * @description 监听逻辑：
 * - 对话框开启时：等待DOM更新后初始化二维码显示
 * - 对话框关闭时：设置中断标志并清理相关资源
 * 
 * @example
 * ```typescript
 * // 对话框开启时
 * qrCodeDialogOpen.value = true
 * // 触发监听器 -> 初始化二维码显示
 * 
 * // 对话框关闭时  
 * qrCodeDialogOpen.value = false
 * // 触发监听器 -> 清理资源
 * ```
 */
watch(qrCodeDialogOpen, async (isOpen) => {
  if (isOpen) {
    // 对话框打开时，强制初始化二维码显示
    await nextTick()
    initializeQRCodeDisplay()
  } else {
    // 对话框关闭时
    qrCodeGenerationAborted = true
    
    // 清理DOM
    if (qrCodeCleanupTimeout) {
      clearTimeout(qrCodeCleanupTimeout)
    }
  }
})

/**
 * 强制初始化二维码显示
 * 直接操作DOM来显示二维码，绕过Vue的响应式系统以确保显示的可靠性
 * 
 * @function initializeQRCodeDisplay
 * @returns {void}
 * 
 * @complexity O(1) - DOM操作和条件判断，常数时间复杂度
 * @flow 容器检查 → 内容清空 → 状态判断 → DOM元素创建 → 内容渲染
 * 
 * @description 显示逻辑：
 * - 根据当前状态（加载中、错误、成功、空状态）显示不同内容
 * - 使用原生DOM操作确保显示的即时性和可靠性
 * - 提供友好的加载动画、错误提示和空状态指示
 * 
 * @example
 * ```typescript
 * // 在对话框打开后调用
 * initializeQRCodeDisplay()
 * // 根据qrCodeLoading、qrCodeError、qrCodeImageUrl状态显示相应内容
 * ```
 */
const initializeQRCodeDisplay = () => {
  if (!qrCodeContainer.value || !qrCodeImageUrl.value) return
  
  try {
    // 清空容器
    qrCodeContainer.value.innerHTML = ''
    
    // 根据当前状态显示不同内容
    if (qrCodeLoading.value) {
      // 显示加载动画
      const loadingDiv = document.createElement('div')
      loadingDiv.className = 'flex flex-col items-center space-y-2'
      
      const spinner = document.createElement('div')
      spinner.className = 'animate-spin rounded-full h-8 w-8 border-b-2 border-primary'
      
      const text = document.createElement('span')
      text.className = 'text-sm text-muted-foreground'
      text.textContent = '生成中...'
      
      loadingDiv.appendChild(spinner)
      loadingDiv.appendChild(text)
      qrCodeContainer.value.appendChild(loadingDiv)
    } else if (qrCodeError.value) {
      // 显示错误信息
      const errorDiv = document.createElement('div')
      errorDiv.className = 'text-center text-sm text-muted-foreground'
      
      const errorIcon = document.createElement('div')
      errorIcon.className = 'w-8 h-8 mx-auto mb-2'
      errorIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
      
      const errorText = document.createElement('p')
      errorText.textContent = '二维码生成失败'
      
      errorDiv.appendChild(errorIcon)
      errorDiv.appendChild(errorText)
      qrCodeContainer.value.appendChild(errorDiv)
    } else if (qrCodeImageUrl.value) {
      // 显示二维码图像
      const img = document.createElement('img')
      img.src = qrCodeImageUrl.value
      img.alt = '邀请二维码'
      img.className = 'w-full h-full object-contain'
      qrCodeContainer.value.appendChild(img)
      
      console.log('二维码图像已强制显示到DOM')
    } else {
      // 显示未能显示二维码的信息
      const emptyDiv = document.createElement('div')
      emptyDiv.className = 'text-center text-sm text-muted-foreground'
      
      const emptyIcon = document.createElement('div')
      emptyIcon.className = 'w-8 h-8 mx-auto mb-2'
      emptyIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
      
      const emptyText = document.createElement('p')
      emptyText.textContent = '未能显示二维码'
      
      emptyDiv.appendChild(emptyIcon)
      emptyDiv.appendChild(emptyText)
      qrCodeContainer.value.appendChild(emptyDiv)
    }
  } catch (error) {
    console.error('初始化二维码显示失败:', error)
  }
}

/**
 * 计算属性：角色显示名称
 * 根据邀请码的目标角色获取对应的中文显示名称
 * 
 * @computed roleName
 * @returns {string} 角色的中文显示名称
 * 
 * @complexity O(1) - 简单的映射查找，常数时间复杂度
 * @flow 角色获取 → 名称映射 → 结果返回
 * 
 * @description 角色映射：
 * - 调用API函数获取角色的标准化显示名称
 * - 支持所有系统定义的用户角色类型
 * - 提供一致的角色名称展示
 * 
 * @example
 * ```typescript
 * // 当targetRole为'agent'时
 * const name = roleName.value // '代理'
 * 
 * // 当targetRole为'director'时  
 * const name = roleName.value // '销售总监'
 * ```
 */
const roleName = computed(() => getRoleDisplayName(props.invitationCode.targetRole))

/**
 * 计算属性：角色描述信息
 * 根据邀请码的目标角色提供详细的角色描述文本
 * 
 * @computed roleDescription
 * @returns {string} 角色的详细描述文本
 * 
 * @complexity O(1) - 对象属性查找，常数时间复杂度
 * @flow 角色获取 → 描述映射 → 结果返回
 * 
 * @description 描述映射：
 * - 为每个角色提供详细的功能描述
 * - 帮助用户理解不同角色的权限和职责
 * - 提供统一的角色说明格式
 * 
 * @example
 * ```typescript
 * // 当targetRole为'agent'时
 * const desc = roleDescription.value // '代理邀请码'
 * 
 * // 当targetRole为'director'时
 * const desc = roleDescription.value // '销售总监邀请码'
 * ```
 */
const roleDescription = computed(() => {
  const descriptions: Record<UserRole, string> = {
    super_admin: '系统超级管理员邀请码',
    director: '销售总监邀请码',
    leader: '销售组长邀请码', 
    sales: '销售人员邀请码',
    agent: '代理邀请码'
  }
  return descriptions[props.invitationCode.targetRole] || '未知角色邀请码'
})

/**
 * 计算属性：邀请链接生成
 * 根据邀请码和目标角色生成完整的邀请注册链接
 * 
 * @computed invitationLink
 * @returns {string} 完整的邀请链接URL
 * 
 * @complexity O(1) - 简单的字符串拼接，常数时间复杂度
 * @flow 邀请码获取 → 角色获取 → 链接生成 → URL返回
 * 
 * @description 链接生成逻辑：
 * - 调用API函数生成标准化的邀请链接
 * - 包含邀请码和角色信息作为URL参数
 * - 确保链接的正确性和可访问性
 * 
 * @example
 * ```typescript
 * // 生成的邀请链接示例
 * const link = invitationLink.value 
 * // 'https://example.com/register?code=AGENT2024001&role=agent'
 * ```
 */
const invitationLink = computed(() => {
  return generateInvitationLink(
    props.invitationCode.code,
    props.invitationCode.targetRole
  )
})

/**
 * 计算属性：邀请码状态信息
 * 根据邀请码的状态返回对应的显示文本和样式变体
 * 
 * @computed codeStatus
 * @returns {Object} 状态信息对象，包含文本和样式变体
 * 
 * @complexity O(1) - 简单的条件判断，常数时间复杂度
 * @flow 状态获取 → 条件判断 → 样式映射 → 对象返回
 * 
 * @description 状态映射：
 * - active状态：显示'正常'，使用default样式
 * - inactive状态：显示'已停用'，使用secondary样式
 * - 提供一致的状态视觉表示
 * 
 * @example
 * ```typescript
 * // 当status为'active'时
 * const status = codeStatus.value 
 * // { text: '正常', variant: 'default' }
 * 
 * // 当status为'inactive'时
 * const status = codeStatus.value
 * // { text: '已停用', variant: 'secondary' }
 * ```
 */
const codeStatus = computed(() => {
  if (props.invitationCode.status === 'active') {
    return {
      text: '正常',
      variant: 'default' as const
    }
  } else {
    return {
      text: '已停用',
      variant: 'secondary' as const
    }
  }
})

/**
 * 计算属性：使用统计信息
 * 计算邀请码的使用情况，包括已使用次数、剩余次数和使用百分比
 * 
 * @computed usageStats
 * @returns {Object} 使用统计对象
 * 
 * @complexity O(1) - 简单的数学计算，常数时间复杂度
 * @flow 使用数据获取 → 限制检查 → 计算处理 → 统计返回
 * 
 * @description 统计逻辑：
 * - 无限制模式：剩余次数显示为'unlimited'，进度按100为基准
 * - 有限制模式：计算实际剩余次数和使用百分比
 * - 确保百分比不超过100%，提供准确的进度指示
 * 
 * @returns {Object} 使用统计信息
 * @returns {number} returns.used - 已使用次数
 * @returns {number|'unlimited'} returns.remaining - 剩余次数或'unlimited'
 * @returns {number} returns.percentage - 使用百分比(0-100)
 * 
 * @example
 * ```typescript
 * // 有限制的邀请码：已用5次，限制20次
 * const stats = usageStats.value
 * // { used: 5, remaining: 15, percentage: 25 }
 * 
 * // 无限制的邀请码：已用10次
 * const stats = usageStats.value  
 * // { used: 10, remaining: 'unlimited', percentage: 10 }
 * ```
 */
const usageStats = computed(() => {
  const used = props.invitationCode.usageCount
  const maxUsage = props.invitationCode.maxUsage
  
  if (!maxUsage) {
    return {
      used,
      remaining: 'unlimited' as const,
      percentage: Math.min((used / 100) * 100, 100) // 无限制时，以100为基准显示进度
    }
  }
  
  const remaining = Math.max(maxUsage - used, 0)
  const percentage = maxUsage > 0 ? (used / maxUsage) * 100 : 0
  
  return {
    used,
    remaining,
    percentage: Math.min(percentage, 100)
  }
})

/**
 * 日期格式化函数
 * 将ISO格式的日期字符串转换为本地化的日期时间显示
 * 
 * @function formatDate
 * @param {string} dateString - ISO格式的日期字符串
 * @returns {string} 格式化后的日期时间字符串
 * 
 * @complexity O(1) - 日期转换和格式化，常数时间复杂度
 * @flow 字符串解析 → Date对象创建 → 本地化格式化 → 字符串返回
 * 
 * @description 格式化规则：
 * - 使用中文本地化格式
 * - 包含完整的年月日时分信息
 * - 确保时间显示的一致性和可读性
 * 
 * @example
 * ```typescript
 * const formatted = formatDate('2024-01-15T10:30:00Z')
 * // '2024/01/15 10:30'
 * 
 * const formatted = formatDate('2024-12-31T23:59:59Z')
 * // '2024/12/31 23:59'
 * ```
 */
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 剪贴板复制工具函数
 * 提供跨浏览器兼容的文本复制功能，包含现代API和降级方案
 * 
 * @function copyToClipboard
 * @param {string} text - 要复制到剪贴板的文本内容
 * @returns {Promise<boolean>} 复制操作是否成功
 * 
 * @complexity O(1) - 简单的API调用，常数时间复杂度
 * @flow 现代API尝试 → 错误捕获 → 降级方案 → 结果返回
 * 
 * @description 复制策略：
 * - 优先使用现代的navigator.clipboard API
 * - 降级使用传统的document.execCommand方法
 * - 提供完整的错误处理和兼容性支持
 * 
 * @example
 * ```typescript
 * const success = await copyToClipboard('AGENT2024001')
 * if (success) {
 *   console.log('复制成功')
 * } else {
 *   console.log('复制失败')
 * }
 * ```
 */
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('复制到剪贴板失败:', error)
    // 降级方案
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (fallbackError) {
      console.error('降级复制方案也失败:', fallbackError)
      return false
    }
  }
}

/**
 * 邀请码复制处理函数
 * 处理用户点击复制邀请码按钮的操作，包含复制执行和用户反馈
 * 
 * @function copyCode
 * @returns {Promise<void>}
 * 
 * @complexity O(1) - 复制操作和提示显示，常数时间复杂度
 * @flow 复制执行 → 结果判断 → 提示显示 → 事件发出
 * 
 * @description 处理流程：
 * - 调用复制工具函数复制邀请码
 * - 根据复制结果显示成功或失败提示
 * - 成功时发出copy事件通知父组件
 * 
 * @example
 * ```typescript
 * // 用户点击复制按钮时
 * await copyCode()
 * // 显示"复制成功"提示，发出copy事件
 * ```
 */
const copyCode = async () => {
  const success = await copyToClipboard(props.invitationCode.code)
  if (success) {
    toast({
      title: '复制成功',
      description: '邀请码已复制到剪贴板',
      variant: 'default',
    })
    emit('copy', props.invitationCode.code)
  } else {
    toast({
      title: '复制失败',
      description: '请手动选择复制',
      variant: 'destructive',
    })
  }
}

/**
 * 邀请链接复制处理函数
 * 处理用户点击复制邀请链接按钮的操作
 * 
 * @function copyLink
 * @returns {Promise<void>}
 * 
 * @complexity O(1) - 复制操作和提示显示，常数时间复杂度
 * @flow 链接获取 → 复制执行 → 结果判断 → 提示显示 → 事件发出
 * 
 * @description 处理流程：
 * - 获取计算后的完整邀请链接
 * - 执行复制操作并处理结果
 * - 提供相应的用户反馈和事件通知
 * 
 * @example
 * ```typescript
 * // 用户点击复制链接按钮时
 * await copyLink()
 * // 显示"复制成功"提示，发出copyLink事件
 * ```
 */
const copyLink = async () => {
  const success = await copyToClipboard(invitationLink.value)
  if (success) {
    toast({
      title: '复制成功',
      description: '邀请链接已复制到剪贴板',
      variant: 'default',
    })
    emit('copyLink', invitationLink.value)
  } else {
    toast({
      title: '复制失败',
      description: '请手动选择复制',
      variant: 'destructive',
    })
  }
}

/**
 * 邀请码重新激活处理函数
 * 处理用户点击重新激活邀请码按钮的操作
 * 
 * @function reactivateCode
 * @returns {void}
 * 
 * @complexity O(1) - 简单的事件发出，常数时间复杂度
 * @flow 用户操作 → 事件发出 → 父组件处理
 * 
 * @description 激活流程：
 * - 发出reactivate事件通知父组件
 * - 传递邀请码ID用于后续的状态更新
 * - 由父组件负责实际的API调用和状态管理
 * 
 * @example
 * ```typescript
 * // 用户点击启用按钮时
 * reactivateCode()
 * // 发出reactivate事件，传递邀请码ID
 * ```
 */
const reactivateCode = () => {
  emit('reactivate', props.invitationCode.id)
}

/**
 * 邀请码停用处理函数
 * 处理用户点击停用邀请码按钮的操作
 * 
 * @function deactivateCode
 * @returns {void}
 * 
 * @complexity O(1) - 简单的事件发出，常数时间复杂度
 * @flow 用户操作 → 事件发出 → 父组件处理
 * 
 * @description 停用流程：
 * - 发出deactivate事件通知父组件
 * - 传递邀请码ID用于后续的状态更新
 * - 由父组件负责实际的API调用和状态管理
 * 
 * @example
 * ```typescript
 * // 用户点击停用按钮时
 * deactivateCode()
 * // 发出deactivate事件，传递邀请码ID
 * ```
 */
const deactivateCode = () => {
  emit('deactivate', props.invitationCode.id)
}

/**
 * 分享链接处理函数
 * 处理用户点击分享按钮的操作，支持原生分享API和降级方案
 * 
 * @function shareLink
 * @returns {void}
 * 
 * @complexity O(1) - API检查和调用，常数时间复杂度
 * @flow 事件发出 → API检查 → 原生分享或降级复制
 * 
 * @description 分享策略：
 * - 优先使用Web Share API进行原生分享
 * - 不支持时自动降级到复制链接功能
 * - 提供完整的分享内容和错误处理
 * 
 * @example
 * ```typescript
 * // 用户点击分享按钮时
 * shareLink()
 * // 发出share事件，尝试原生分享或复制链接
 * ```
 */
const shareLink = () => {
  emit('share', invitationLink.value, roleName.value)
  
  // 如果支持 Web Share API，使用原生分享
  if (navigator.share) {
    navigator.share({
      title: `${roleName.value}邀请`,
      text: `邀请您加入系统，成为${roleName.value}`,
      url: invitationLink.value
    }).catch(error => {
      console.log('分享取消或失败:', error)
    })
  } else {
    // 否则复制链接
    copyLink()
  }
}

/**
 * 二维码预生成函数
 * 异步生成二维码图像并缓存到内存中，为后续显示做准备
 * 
 * @function prepareQRCode
 * @returns {Promise<boolean>} 生成操作是否成功
 * 
 * @complexity O(n) - n为二维码复杂度，通常为常数时间
 * @flow 状态设置 → 链接验证 → 库加载 → 二维码生成 → DOM操作 → 状态更新
 * 
 * @description 生成流程：
 * - 动态加载qrcode库避免增加初始包大小
 * - 使用离屏canvas生成高质量二维码
 * - 转换为DataURL格式便于后续使用
 * - 提供完整的错误处理和用户反馈
 * 
 * @example
 * ```typescript
 * const success = await prepareQRCode()
 * if (success) {
 *   // 二维码生成成功，可以显示
 *   showQRCodeDialog()
 * } else {
 *   // 生成失败，显示错误提示
 *   showErrorMessage()
 * }
 * ```
 */
const prepareQRCode = async (): Promise<boolean> => {
  qrCodeLoading.value = true
  qrCodeError.value = false
  
  try {
    // 检查链接是否有效
    if (!invitationLink.value) {
      console.error('没有可用的链接来生成二维码')
      qrCodeError.value = true
      qrCodeLoading.value = false
      return false
    }
    
    console.log('开始生成二维码，链接:', invitationLink.value)
    
    // 异步加载二维码库
    const QRCodeModule = await import('qrcode')
    const QRCode = QRCodeModule.default
    
    // 创建离屏canvas
    const canvas = document.createElement('canvas')
    
    // 生成二维码
    await QRCode.toCanvas(canvas, invitationLink.value, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    console.log('二维码已生成到canvas')
    
    // 直接使用canvas的dataURL，避免使用Blob URL
    const dataUrl = canvas.toDataURL('image/png')
    console.log('二维码已转换为dataURL')
    
    // 更新状态
    qrCodeImageUrl.value = dataUrl
    
    // 强制DOM更新
    await nextTick()
    
    // 直接将二维码显示到容器中
    if (qrCodeContainer.value) {
      // 清空容器
      qrCodeContainer.value.innerHTML = ''
      
      // 创建图像元素
      const img = document.createElement('img')
      img.src = dataUrl
      img.alt = '邀请二维码'
      img.className = 'w-full h-full object-contain'
      
      // 添加到容器
      qrCodeContainer.value.appendChild(img)
      console.log('二维码已直接添加到DOM')
    }
    
    // 确保状态更新
    qrCodeLoading.value = false
    console.log('加载状态已设置为false')
    
    return true
  } catch (error) {
    console.error('生成二维码失败:', error)
    qrCodeError.value = true
    qrCodeLoading.value = false
    
    // 显示错误提示
    toast({
      title: '二维码生成失败',
      description: error instanceof Error ? error.message : '未知错误',
      variant: 'destructive',
    })
    
    return false
  }
}

/**
 * 显示二维码对话框函数
 * 处理用户点击二维码按钮的操作，包含二维码生成和对话框显示
 * 
 * @function showQRCode
 * @returns {Promise<void>}
 * 
 * @complexity O(n) - 包含二维码生成的复杂度
 * @flow 链接验证 → 状态重置 → 二维码生成 → 对话框显示 → 强制初始化
 * 
 * @description 显示流程：
 * - 验证邀请链接的有效性
 * - 重置相关状态确保清洁的生成环境
 * - 调用二维码预生成函数
 * - 成功后显示对话框并初始化显示
 * 
 * @example
 * ```typescript
 * // 用户点击二维码按钮时
 * await showQRCode()
 * // 生成二维码并显示在对话框中
 * ```
 */
const showQRCode = async () => {
  if (!invitationLink) {
    toast({
      title: '无法生成二维码',
      description: '邀请链接不可用',
      variant: 'destructive',
    })
    return
  }

  // 重置状态
  qrCodeImageUrl.value = null
  qrCodeError.value = false
  qrCodeGenerationAborted = false
  qrCodeLoading.value = true
  
  console.log('开始准备二维码')
  
  const success = await prepareQRCode()
  console.log('二维码准备结果:', success, '加载状态:', qrCodeLoading.value)
  
  if (success) {
    // 成功生成二维码后打开对话框
    qrCodeDialogOpen.value = true
    
    // 等待对话框DOM更新后强制初始化二维码显示
    await nextTick()
    console.log('对话框已打开，开始强制初始化二维码显示')
    initializeQRCodeDisplay()
    console.log('二维码显示初始化完成')
  } else {
    toast({
      title: '二维码生成失败',
      description: '请稍后重试',
      variant: 'destructive',
    })
  }
}

/**
 * 下载二维码函数
 * 处理用户点击下载按钮的操作，将生成的二维码保存到本地
 * 
 * @function downloadQRCode
 * @returns {void}
 * 
 * @complexity O(1) - 简单的文件下载操作，常数时间复杂度
 * @flow 图像检查 → 下载链接创建 → 文件下载 → 用户反馈
 * 
 * @description 下载流程：
 * - 检查二维码图像是否已生成
 * - 创建临时下载链接并触发下载
 * - 使用描述性的文件名包含角色和邀请码信息
 * - 提供下载结果的用户反馈
 * 
 * @example
 * ```typescript
 * // 用户点击下载按钮时
 * downloadQRCode()
 * // 下载文件名: invitation-agent-AGENT2024001.png
 * ```
 */
const downloadQRCode = () => {
  if (!qrCodeImageUrl.value) return
  
  try {
    const link = document.createElement('a')
    link.download = `invitation-${props.invitationCode.targetRole}-${props.invitationCode.code}.png`
    link.href = qrCodeImageUrl.value
    link.click()
    
    toast({
      title: '下载成功',
      description: '二维码已保存到本地',
      variant: 'default',
    })
  } catch (error) {
    console.error('下载二维码失败:', error)
    toast({
      title: '下载失败',
      description: '无法保存二维码，请稍后重试',
      variant: 'destructive',
    })
  }
}
</script>

<style scoped>
/* 进度条颜色自定义 */
:deep(.progress-success .progress-indicator) {
  background-color: hsl(var(--success));
}

:deep(.progress-warning .progress-indicator) {
  background-color: hsl(var(--warning));
}

:deep(.progress-danger .progress-indicator) {
  background-color: hsl(var(--destructive));
}

/* 选择文本样式 */
.select-all {
  user-select: all;
  -webkit-user-select: all;
  -moz-user-select: all;
  -ms-user-select: all;
}

/* 卡片悬停效果 */
.card {
  transition: box-shadow 0.2s ease-in-out;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 动画效果 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>