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

const props = defineProps<{
  open: boolean
  userId?: string | number
}>()

const emits = defineEmits<{
  'update:open': [value: boolean]
  'reset': [userId: string | number, password: string]
}>()

const password = ref('')
const confirmPassword = ref('')

const isOpen = computed({
  get: () => props.open,
  set: (value) => emits('update:open', value)
})

const isValid = computed(() => {
  return password.value && confirmPassword.value && password.value === confirmPassword.value && password.value.length >= 6
})

function close() {
  isOpen.value = false
  resetForm()
}

function handleSubmit() {
  if (!isValid.value || !props.userId) return
  
  emits('reset', props.userId, password.value)
  close()
}

function resetForm() {
  password.value = ''
  confirmPassword.value = ''
}
</script> 