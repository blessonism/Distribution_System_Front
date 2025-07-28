<!--
/**
 * @fileoverview 重置密码对话框组件
 * 基于Vue 3 Composition API构建的密码重置对话框，提供安全的用户密码重置功能
 * 支持密码强度验证、确认密码匹配检查和实时表单验证机制
 * 集成shadcn-vue对话框组件，确保用户界面的一致性和可访问性
 * 
 * @component ResetPasswordDialog
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.1.0
 * 
 * @description
 * ResetPasswordDialog是用户管理系统中的密码重置工具组件，主要功能包括：
 * - 🔒 安全的密码重置界面，支持管理员为用户重置密码
 * - ✅ 实时密码验证，包括长度检查和确认密码匹配验证
 * - 🛡️ 密码强度要求，确保新密码符合安全标准
 * - 🔄 自动表单重置，关闭对话框时清除敏感数据
 * - 📱 响应式设计，适配不同尺寸的设备屏幕
 * - ⚡ 实时表单验证，提升用户体验和操作效率
 * 
 * @security
 * - 密码输入字段使用type="password"确保安全输入
 * - 表单关闭时自动清除内存中的密码数据
 * - 实施最小密码长度要求（6位以上）
 * - 要求密码确认匹配以防止输入错误
 * 
 * @usage
 * ```vue
 * <template>
 *   <ResetPasswordDialog
 *     :open="showResetDialog"
 *     :user-id="selectedUserId"
 *     @update:open="showResetDialog = $event"
 *     @reset="handlePasswordReset"
 *   />
 * </template>
 * ```
 * 
 * @example
 * ```typescript
 * // 显示密码重置对话框
 * const showPasswordReset = (userId: string) => {
 *   selectedUserId.value = userId
 *   showResetDialog.value = true
 * }
 * 
 * // 处理密码重置
 * const handlePasswordReset = async (userId: string, newPassword: string) => {
 *   try {
 *     await userApi.resetPassword(userId, newPassword)
 *     toast({ title: '密码重置成功' })
 *   } catch (error) {
 *     toast({ title: '重置失败', variant: 'destructive' })
 *   }
 * }
 * ```
 */
-->

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>重置密码</DialogTitle>
        <DialogDescription>
          请输入新密码来重置此用户账号密码。
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <div class="space-y-2">
          <Label for="newPassword">新密码</Label>
          <Input
            id="newPassword"
            v-model="password"
            type="password"
            placeholder="请输入新密码"
          />
        </div>
        <div class="space-y-2">
          <Label for="confirmPassword">确认密码</Label>
          <Input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">取消</Button>
        <Button type="submit" :disabled="!isValid" @click="handleSubmit">确认重置</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
/**
 * @fileoverview ResetPasswordDialog组件的核心逻辑实现
 * 使用Vue 3 Composition API实现密码重置功能，包含表单验证和安全处理
 */
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * 组件属性接口定义
 * 定义ResetPasswordDialog组件的输入属性
 * 
 * @interface Props
 * 
 * @property {boolean} open - 对话框显示状态控制
 * @property {string | number} [userId] - 要重置密码的用户ID，可选
 * 
 * @example
 * ```typescript
 * const props = {
 *   open: true,
 *   userId: 'user_001'
 * }
 * ```
 */
const props = defineProps<{
  /** 对话框显示状态 */
  open: boolean
  /** 用户ID */
  userId?: string | number
}>()

/**
 * 组件事件定义
 * 定义ResetPasswordDialog组件对外发出的事件
 * 
 * @events
 * 
 * @event update:open - 更新对话框显示状态，支持v-model双向绑定
 * @event reset - 密码重置事件，传递用户ID和新密码
 * 
 * @example
 * ```typescript
 * // 事件处理示例
 * function handleOpenChange(open: boolean) {
 *   showDialog.value = open
 * }
 * 
 * function handlePasswordReset(userId: string | number, password: string) {
 *   // 执行密码重置API调用
 *   await userApi.resetPassword(userId, password)
 * }
 * ```
 */
const emits = defineEmits<{
  /** 更新对话框显示状态 */
  'update:open': [value: boolean]
  /** 密码重置事件 */
  'reset': [userId: string | number, password: string]
}>()

/**
 * 响应式表单数据
 * 管理密码输入字段的状态
 */
const password = ref('')
const confirmPassword = ref('')

/**
 * 对话框显示状态计算属性
 * 实现v-model双向绑定，同步对话框的打开/关闭状态
 * 
 * @computed isOpen
 * @returns {ComputedRef<boolean>} 对话框显示状态
 * 
 * @complexity O(1) - 简单属性访问，常数时间复杂度
 * @flow 属性获取 ↔ 状态更新 ↔ 事件发出 ↔ 父组件同步
 * 
 * @example
 * ```typescript
 * // 获取当前状态
 * const currentOpen = isOpen.value // true/false
 * 
 * // 设置新状态
 * isOpen.value = true // 打开对话框
 * isOpen.value = false // 关闭对话框
 * ```
 */
const isOpen = computed({
  get: () => props.open,
  set: (value) => emits('update:open', value)
})

/**
 * 表单有效性验证
 * 检查密码输入是否满足所有安全要求和验证规则
 * 
 * @computed isValid
 * @returns {boolean} 表单是否有效可提交
 * 
 * @complexity O(1) - 简单条件检查，常数时间复杂度
 * @flow 密码输入 → 长度验证 → 匹配检查 → 有效性判断
 * 
 * @validation
 * - 密码不能为空
 * - 确认密码不能为空
 * - 两次输入的密码必须一致
 * - 密码长度必须≥6位
 * 
 * @example
 * ```typescript
 * // 检查表单有效性
 * if (isValid.value) {
 *   // 可以提交表单
 *   submitButton.disabled = false
 * } else {
 *   // 表单无效，禁用提交
 *   submitButton.disabled = true
 * }
 * 
 * // 验证规则示例
 * password.value = '123456'        // 满足长度要求
 * confirmPassword.value = '123456' // 密码匹配
 * isValid.value // true
 * 
 * password.value = '123'           // 长度不足
 * isValid.value // false
 * ```
 */
const isValid = computed(() => {
  return password.value && confirmPassword.value && password.value === confirmPassword.value && password.value.length >= 6
})

/**
 * 关闭对话框
 * 关闭对话框并重置表单数据，确保敏感信息不会残留
 * 
 * @function close
 * @returns {void}
 * 
 * @complexity O(1) - 简单状态重置，常数时间复杂度
 * @flow 关闭触发 → 状态更新 → 表单重置 → 数据清除
 * 
 * @security
 * - 自动清除内存中的密码数据
 * - 防止敏感信息泄露
 * 
 * @example
 * ```typescript
 * // 用户点击取消按钮
 * close()
 * // 对话框关闭，密码字段被清空
 * 
 * // ESC键关闭
 * close()
 * ```
 */
function close() {
  isOpen.value = false
  resetForm()
}

/**
 * 处理表单提交
 * 验证表单有效性并发出密码重置事件，包含安全检查
 * 
 * @function handleSubmit
 * @returns {void}
 * 
 * @complexity O(1) - 表单验证和事件发出，常数时间复杂度
 * @flow 表单验证 → 安全检查 → 事件发出 → 对话框关闭
 * 
 * @security
 * - 验证用户ID存在性
 * - 确保表单数据有效性
 * - 防止无效数据提交
 * 
 * @example
 * ```typescript
 * // 用户点击确认重置按钮时调用
 * handleSubmit()
 * 
 * // 如果验证通过，会发出reset事件：
 * // emits('reset', userId, password)
 * 
 * // 然后自动关闭对话框并清除表单
 * ```
 */
function handleSubmit() {
  if (!isValid.value || !props.userId) return
  
  emits('reset', props.userId, password.value)
  close()
}

/**
 * 重置表单数据
 * 清除所有密码输入字段，确保敏感数据不会残留在内存中
 * 
 * @function resetForm
 * @returns {void}
 * 
 * @complexity O(1) - 简单变量赋值，常数时间复杂度
 * 
 * @security
 * - 清除内存中的密码数据
 * - 防止敏感信息泄露
 * - 确保表单状态重置
 * 
 * @example
 * ```typescript
 * // 手动重置表单
 * resetForm()
 * // password.value === ''
 * // confirmPassword.value === ''
 * 
 * // 对话框关闭时自动调用
 * close() // 内部会调用resetForm()
 * ```
 */
function resetForm() {
  password.value = ''
  confirmPassword.value = ''
}
</script> 