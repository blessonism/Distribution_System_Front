<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <div class="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-lg">DS</span>
        </div>
        <h2 class="mt-6 text-3xl font-bold text-gray-900">
          分销系统管理后台
        </h2>
      </div>

      <Card class="mt-8">
        <CardHeader>
          <div class="flex items-center justify-center space-x-4 mb-4">
            <Button 
              :variant="isLoginMode ? 'default' : 'outline'"
              size="sm"
              @click="switchToLogin"
              :disabled="loading"
            >
              <LogIn class="w-4 h-4 mr-1" />
              登录
            </Button>
            <Button 
              :variant="!isLoginMode ? 'default' : 'outline'"
              size="sm"
              @click="switchToRegister"
              :disabled="loading"
            >
              <UserPlus class="w-4 h-4 mr-1" />
              注册
            </Button>
          </div>
          
          <CardTitle class="text-center">
            {{ isLoginMode ? '用户登录' : '用户注册' }}
          </CardTitle>
          <CardDescription class="text-center">
            {{ isLoginMode ? '使用您的账号密码登录系统' : '创建新账号加入系统' }}
          </CardDescription>
          
          <!-- 邀请信息展示 -->
          <div v-if="!isLoginMode && invitationInfo" class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div class="flex items-center space-x-2 text-blue-700">
              <UserCheck class="w-4 h-4" />
              <span class="text-sm font-medium">邀请注册</span>
            </div>
            <p class="text-xs text-blue-600 mt-1">
              您正在通过 {{ invitationInfo.inviterName }} 的邀请注册为 {{ invitationInfo.targetRoleName }}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <!-- 登录表单 -->
          <form v-if="isLoginMode" @submit.prevent="handleLogin" class="space-y-4">
            <div class="space-y-2">
              <Label for="username">用户名</Label>
              <Input
                id="username"
                v-model="loginForm.username"
                type="text"
                placeholder="请输入用户名"
                required
                :disabled="loading"
              />
            </div>

            <div class="space-y-2">
              <Label for="password">密码</Label>
              <div class="relative">
                <Input
                  id="password"
                  v-model="loginForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入密码"
                  required
                  :disabled="loading"
                  @keyup.enter="handleLogin"
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  @click="showPassword = !showPassword"
                >
                  <Eye v-if="showPassword" class="h-4 w-4 text-gray-400" />
                  <EyeOff v-else class="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>

            <Button
              type="submit"
              class="w-full"
              :disabled="loading"
            >
              <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
              {{ loading ? '登录中...' : '登录' }}
            </Button>

            <!-- 测试账号提示 -->
            <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div class="flex items-center space-x-2 text-blue-700 mb-2">
                <UserCheck class="w-4 h-4" />
                <span class="text-sm font-medium">测试账号</span>
              </div>
              <div class="text-xs text-blue-600 space-y-1">
                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    class="text-left p-2 bg-white rounded border hover:bg-blue-50 transition-colors"
                    @click="fillTestAccount('director_test', 'Director123!')"
                    :disabled="loading"
                  >
                    <div class="font-medium">总监测试</div>
                    <div class="text-gray-500">director_test</div>
                  </button>
                  <button
                    type="button"
                    class="text-left p-2 bg-white rounded border hover:bg-blue-50 transition-colors"
                    @click="fillTestAccount('leader_test', 'Leader123!')"
                    :disabled="loading"
                  >
                    <div class="font-medium">组长测试</div>
                    <div class="text-gray-500">leader_test</div>
                  </button>
                  <button
                    type="button"
                    class="text-left p-2 bg-white rounded border hover:bg-blue-50 transition-colors"
                    @click="fillTestAccount('sales_test', 'Sales123!')"
                    :disabled="loading"
                  >
                    <div class="font-medium">销售测试</div>
                    <div class="text-gray-500">sales_test</div>
                  </button>
                  <button
                    type="button"
                    class="text-left p-2 bg-white rounded border hover:bg-blue-50 transition-colors"
                    @click="fillTestAccount('agent_test', 'Agent123!')"
                    :disabled="loading"
                  >
                    <div class="font-medium">代理测试</div>
                    <div class="text-gray-500">agent_test</div>
                  </button>
                </div>
              </div>
            </div>
          </form>

          <!-- 注册表单 -->
          <form v-else @submit.prevent="handleRegister" class="space-y-4">
            <!-- 邀请码输入 -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <Label for="invite-code">邀请码</Label>
                <span class="text-xs text-gray-500">可选</span>
              </div>
              
              <div class="relative">
                <div class="relative flex-1">
                  <Input
                    id="invite-code"
                    v-model="registerForm.inviteCode"
                    type="text"
                    placeholder="输入6-12位邀请码"
                    maxlength="12"
                    :disabled="loading || inviteCodeValidating"
                    :class="[
                      'font-mono tracking-wider uppercase transition-all duration-200',
                      inviteCodeInputClass
                    ]"
                    @input="handleInviteCodeInput"
                    @paste="handleInviteCodePaste"
                    @blur="handleInviteCodeBlur"
                    @focus="handleInviteCodeFocus"
                  />
                  
                  <!-- 输入状态指示器 -->
                  <div class="absolute inset-y-0 right-3 flex items-center">
                    <div v-if="inviteCodeValidating" class="flex items-center space-x-1">
                      <Loader2 class="w-4 h-4 animate-spin text-blue-500" />
                    </div>
                    <div v-else-if="invitationInfo?.isValid" class="flex items-center space-x-1">
                      <UserCheck class="w-4 h-4 text-green-500" />
                    </div>
                    <div v-else-if="registerForm.inviteCode && inviteCodeStatus && !invitationInfo?.isValid" class="flex items-center space-x-1">
                      <AlertCircle class="w-4 h-4 text-red-500" />
                    </div>
                  </div>
                </div>
                
                <!-- 字符计数器 -->
                <div v-if="registerForm.inviteCode" class="absolute -bottom-5 right-0 text-xs text-gray-400">
                  {{ registerForm.inviteCode.length }}/12
                </div>
              </div>
              
              <!-- 邀请码状态和信息显示 -->
              <div class="space-y-2">
                <!-- 验证状态提示 -->
                <div v-if="inviteCodeStatus" 
                     class="text-xs transition-all duration-200 flex items-center space-x-1" 
                     :class="inviteCodeStatusClass">
                  <UserCheck v-if="invitationInfo?.isValid" class="w-3 h-3" />
                  <AlertCircle v-else-if="registerForm.inviteCode && !invitationInfo?.isValid" class="w-3 h-3" />
                  <span>{{ inviteCodeStatus }}</span>
                </div>
                
                <!-- 邀请人信息显示 -->
                <div v-if="invitationInfo?.isValid" 
                     class="bg-green-50 border border-green-200 rounded-lg p-3 transition-all duration-300">
                  <div class="flex items-start space-x-2">
                    <UserCheck class="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div class="flex-1 space-y-1">
                      <p class="text-sm font-medium text-green-900">
                        邀请码验证成功
                      </p>
                      <p class="text-xs text-green-700">
                        邀请人：<span class="font-medium">{{ invitationInfo.inviterName }}</span>
                      </p>
                      <p class="text-xs text-green-600">
                        注册后将成为：{{ invitationInfo.targetRoleName }}
                      </p>
                    </div>
                  </div>
                </div>
                
                <!-- 输入提示 -->
                <div v-if="!registerForm.inviteCode && inviteCodeFocused" 
                     class="text-xs text-gray-500 bg-gray-50 rounded p-2 border border-gray-200">
                  <div class="space-y-1">
                    <p class="font-medium">邀请码格式要求：</p>
                    <ul class="ml-2 space-y-0.5">
                      <li>• 6-12位字符</li>
                      <li>• 只能包含数字和大写字母</li>
                      <li>• 不包含易混淆字符（0、O、I、1）</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- 用户信息输入 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="register-username">用户名</Label>
                <Input
                  id="register-username"
                  v-model="registerForm.username"
                  type="text"
                  placeholder="请输入用户名"
                  required
                  :disabled="loading"
                />
              </div>
              
              <div class="space-y-2">
                <Label for="register-email">邮箱</Label>
                <Input
                  id="register-email"
                  v-model="registerForm.email"
                  type="email"
                  placeholder="请输入邮箱"
                  required
                  :disabled="loading"
                />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="register-password">密码</Label>
              <div class="relative">
                <Input
                  id="register-password"
                  v-model="registerForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入密码"
                  required
                  :disabled="loading"
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  @click="showPassword = !showPassword"
                >
                  <Eye v-if="showPassword" class="h-4 w-4 text-gray-400" />
                  <EyeOff v-else class="h-4 w-4 text-gray-400" />
                </button>
              </div>
              
              <!-- 密码强度提示 -->
              <div v-if="passwordStrength" class="text-xs" :class="passwordStrengthClass">
                密码强度：{{ passwordStrength }}
              </div>
            </div>

            <div class="space-y-2">
              <Label for="confirm-password">确认密码</Label>
              <Input
                id="confirm-password"
                v-model="registerForm.confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请再次输入密码"
                required
                :disabled="loading"
              />
              
              <!-- 密码匹配提示 -->
              <div v-if="registerForm.password && registerForm.confirmPassword && !passwordsMatch" class="text-xs text-red-600">
                两次输入的密码不一致
              </div>
            </div>

            <Button 
              type="submit" 
              class="w-full"
              :disabled="loading || !canRegister"
            >
              <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
              {{ loading ? '注册中...' : '注册' }}
            </Button>
          </form>

          <!-- 通用错误提示 -->
          <Alert v-if="error" variant="destructive" class="mt-4">
            <AlertCircle class="h-4 w-4" />
            <AlertTitle>{{ isLoginMode ? '登录失败' : '注册失败' }}</AlertTitle>
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter class="flex justify-center">
          <p class="text-sm text-gray-600">
            {{ isLoginMode ? '忘记密码？请联系管理员' : '已有账号？点击上方切换到登录' }}
          </p>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useInvitationStore } from '@/store/invitation'
import type { LoginRequest, RegisterRequest } from '@/types/api'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Loader2, LogIn, UserPlus, UserCheck, Eye, EyeOff } from 'lucide-vue-next'
import { toast } from '@/components/ui/toast/use-toast'
import { validateCode, getRoleDisplayName } from '@/api/invitation'
import { validateInviteCodeComplete, formatInviteCodeInput } from '@/utils/invitation'
import { useInvitation } from '@/composables/useInvitation'
import {
  invitationErrorHandler,
  handleInviteCodeValidation,
  handleInviteRegistration
} from '@/utils/invitationErrorHandler'
import { getUserDefaultPath } from '@/config/roleMenus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const invitationStore = useInvitationStore()

// 使用邀请相关的 composable
const { handlePostRegistrationInvitation } = useInvitation()

// 界面状态
const isLoginMode = ref(true)
const loading = ref(false)
const showPassword = ref(false)
const error = ref('')

// 邀请码验证状态
const inviteCodeValidating = ref(false)
const inviteCodeStatus = ref('')
const inviteCodeFocused = ref(false)
const inviteCodeTouched = ref(false)
const invitationInfo = ref<{
  inviterName: string
  targetRoleName: string
  isValid: boolean
} | null>(null)

// 表单数据
const loginForm = reactive<LoginRequest>({
  username: '',
  password: ''
})

const registerForm = reactive<RegisterRequest & {
  confirmPassword: string
}>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  inviteCode: ''
})

// 计算属性
const inviteCodeStatusClass = computed(() => {
  if (invitationInfo.value?.isValid) {
    return 'text-green-600'
  } else if (inviteCodeStatus.value && !invitationInfo.value?.isValid) {
    return 'text-red-600'
  }
  return 'text-gray-500'
})

const inviteCodeInputClass = computed(() => {
  if (inviteCodeValidating.value) {
    return 'border-blue-300 bg-blue-50'
  } else if (invitationInfo.value?.isValid) {
    return 'border-green-300 bg-green-50'
  } else if (registerForm.inviteCode && inviteCodeTouched.value && !invitationInfo.value?.isValid) {
    return 'border-red-300 bg-red-50'
  } else if (inviteCodeFocused.value) {
    return 'border-blue-300'
  }
  return ''
})

const passwordStrength = computed(() => {
  const password = registerForm.password
  if (!password) return ''
  
  let score = 0
  if (password.length >= 8) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^\w\s]/.test(password)) score++
  
  if (score < 2) return '弱'
  if (score < 4) return '中等'
  return '强'
})

const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value
  if (strength === '强') return 'text-green-600'
  if (strength === '中等') return 'text-yellow-600'
  return 'text-red-600'
})

const passwordsMatch = computed(() => {
  return registerForm.password === registerForm.confirmPassword
})

const canRegister = computed(() => {
  const basicRequirements = registerForm.username.trim() &&
                           registerForm.email.trim() &&
                           registerForm.password &&
                           passwordsMatch.value &&
                           passwordStrength.value !== '弱'
  
  // 不再在这里检查邀请码验证状态
  // 点击注册按钮时会验证邀请码
  return basicRequirements
})

// 页面加载时检查URL参数
onMounted(() => {
  const inviteCode = route.query.invite as string
  const targetRole = route.query.role as string
  
  if (inviteCode) {
    // 自动切换到注册模式
    isLoginMode.value = false
    registerForm.inviteCode = inviteCode
    
    // 不再自动验证邀请码，用户点击注册按钮时才会验证
  }
})

// 监听邀请码输入
watch(() => registerForm.inviteCode, (newCode) => {
  if (!newCode) {
    invitationInfo.value = null
    inviteCodeStatus.value = ''
  }
})

// 方法
const switchToLogin = () => {
  isLoginMode.value = true
  error.value = ''
}

// 填充测试账号
const fillTestAccount = (username: string, password: string) => {
  loginForm.username = username
  loginForm.password = password
  error.value = ''
}

const switchToRegister = () => {
  isLoginMode.value = false
  error.value = ''
}

const handleInviteCodeInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const originalValue = target.value
  
  // 格式化输入：自动转换为大写并过滤无效字符
  const formattedValue = formatInviteCodeInput(originalValue)
  
  // 如果值发生了变化，更新输入框值
  if (formattedValue !== originalValue) {
    registerForm.inviteCode = formattedValue
    // 使用 nextTick 确保值更新后再设置光标位置
    nextTick(() => {
      target.value = formattedValue
      // 将光标移到末尾
      target.setSelectionRange(formattedValue.length, formattedValue.length)
    })
  } else {
    registerForm.inviteCode = formattedValue
  }
  
  // 标记已经被用户编辑过
  inviteCodeTouched.value = true
  
  // 清空之前的验证结果
  invitationInfo.value = null
  inviteCodeStatus.value = ''
  
  // 如果输入为空，重置状态
  if (!formattedValue) {
    inviteCodeTouched.value = false
    inviteCodeStatus.value = ''
  }
}

const handleInviteCodePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const pasteData = event.clipboardData?.getData('text') || ''
  const formattedData = formatInviteCodeInput(pasteData)
  
  registerForm.inviteCode = formattedData
  inviteCodeTouched.value = true
  
  // 清空验证结果
  invitationInfo.value = null
  inviteCodeStatus.value = ''
}

const handleInviteCodeFocus = () => {
  inviteCodeFocused.value = true
}

const handleInviteCodeBlur = () => {
  inviteCodeFocused.value = false
}

const validateInviteCode = async () => {
  if (!registerForm.inviteCode || !registerForm.inviteCode.trim()) {
    inviteCodeStatus.value = '请输入邀请码'
    return
  }

  inviteCodeValidating.value = true
  inviteCodeStatus.value = ''
  invitationInfo.value = null

  try {
    const response = await validateCode(registerForm.inviteCode.trim())

    if (response.valid && response.inviterInfo) {
      invitationInfo.value = {
        inviterName: response.inviterInfo.name,
        targetRoleName: getRoleDisplayName(response.targetRole || ''),
        isValid: true
      }
      inviteCodeStatus.value = '邀请码验证成功'
      
      // 显示成功提示
      invitationErrorHandler.showSuccess(
        '邀请码验证成功',
        `欢迎通过 ${response.inviterInfo.name} 的邀请注册`
      )
    } else {
      invitationInfo.value = {
        inviterName: '',
        targetRoleName: '',
        isValid: false
      }
      inviteCodeStatus.value = '邀请码无效或已过期'
    }
  } catch (error) {
    console.error('验证邀请码失败:', error)
    const handledError = handleInviteCodeValidation(error, registerForm.inviteCode.trim())
    inviteCodeStatus.value = handledError.message
  } finally {
    inviteCodeValidating.value = false
  }
}

const validateInviteCodeFromUrl = async (inviteCode: string, targetRole: string) => {
  inviteCodeValidating.value = true

  try {
    const response = await validateCode(inviteCode)

    if (response.valid && response.inviterInfo) {
      invitationInfo.value = {
        inviterName: response.inviterInfo.name,
        targetRoleName: getRoleDisplayName(response.targetRole || ''),
        isValid: true
      }
      inviteCodeStatus.value = '通过邀请链接自动填充，邀请码有效'
    } else {
      invitationInfo.value = {
        inviterName: '',
        targetRoleName: '',
        isValid: false
      }
      inviteCodeStatus.value = '邀请链接中的邀请码无效或已过期'
    }
  } catch (error) {
    console.error('验证URL邀请码失败:', error)
    inviteCodeStatus.value = '验证邀请码时发生错误'
  } finally {
    inviteCodeValidating.value = false
  }
}

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    error.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await userStore.login(loginForm)

    console.log('登录成功，用户信息:', userStore.userInfo)
    console.log('用户角色:', userStore.roles)
    console.log('当前路由:', router.currentRoute.value.path)
    console.log('路由是否已加载:', userStore.routesLoaded)

    toast({
      title: '登录成功',
      description: `欢迎回来，${userStore.userInfo?.nickname || userStore.userInfo?.username}`,
      variant: 'default',
    })
    
    if (!userStore.routesLoaded && userStore.token) {
      console.log('登录后手动添加动态路由')
      const { asyncRoutes, filterRoutesByRole } = await import('@/router/routes')

      const accessibleRoutes = filterRoutesByRole(asyncRoutes, userStore.roles || [])
      accessibleRoutes.forEach(route => {
        if (route.name && !router.hasRoute(route.name)) {
          console.log('添加路由:', route.path, route.name)
          router.addRoute(route)
        }
      })
      userStore.$patch({ routesLoaded: true })
      localStorage.setItem('routesLoaded', 'true')
    }
    
    console.log('确定登录后跳转路径')
    try {
      if (!router.hasRoute('Layout')) {
        console.warn('Layout路由尚未加载，可能导致导航失败')
      }

      const routes = router.getRoutes()
      console.log('当前所有路由:', routes.map(r => ({ path: r.path, name: r.name })))

      // 根据用户角色确定跳转路径
      const userRole = userStore.userInfo?.role
      let targetPath = '/dashboard' // 默认路径

      if (userRole) {
        // 使用统一的角色路径配置
        targetPath = getUserDefaultPath(userRole)
        console.log(`角色 ${userRole}，跳转到默认路径: ${targetPath}`)
      }

      console.log(`尝试跳转到: ${targetPath}`)
      await router.push(targetPath)
      console.log('跳转成功，当前路由:', router.currentRoute.value.path)
    } catch (navError) {
      console.error('页面跳转失败:', navError)
      error.value = '页面跳转失败，请刷新页面重试'
    }
    
  } catch (err: any) {
    error.value = err.message || '登录失败，请检查用户名和密码'
    console.error('登录失败:', err)

    // 登录失败时不清空表单，保留用户输入
    // 只清空密码字段（安全考虑）
    loginForm.password = ''

    // 显示错误提示
    toast({
      title: '登录失败',
      description: error.value,
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  if (!canRegister.value) {
    error.value = '请完善注册信息'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const registerData: RegisterRequest = {
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password
    }

    let registerResponse
    
    // 根据是否有邀请码选择不同的注册方法
    if (registerForm.inviteCode && registerForm.inviteCode.trim()) {
      // 点击注册按钮时才验证邀请码
      inviteCodeValidating.value = true
      try {
        // 验证邀请码
        const validationResponse = await validateCode(registerForm.inviteCode.trim())
        
        if (validationResponse && validationResponse.valid && validationResponse.inviterInfo) {
          invitationInfo.value = {
            inviterName: validationResponse.inviterInfo.name,
            targetRoleName: getRoleDisplayName(validationResponse.targetRole || ''),
            isValid: true
          }
          inviteCodeStatus.value = '邀请码有效'
          
          // 使用已验证的邀请码
          registerData.inviteCode = registerForm.inviteCode.trim()
          console.log('使用邀请码注册:', registerData.inviteCode)
          
          // 使用邀请码注册，会自动建立邀请关系
          registerResponse = await userStore.registerWithInvite(registerData)
          
          // 显示邀请成功信息
          if (registerResponse.invitationInfo?.relationshipEstablished) {
            toast({
              title: '注册成功',
              description: `欢迎加入！通过 ${registerResponse.invitationInfo.inviterName} 的邀请成功注册`,
              variant: 'default',
            })
          } else {
            toast({
              title: '注册成功',
              description: '账号创建成功，欢迎使用',
              variant: 'default',
            })
          }
        } else {
          // 邀请码无效
          inviteCodeStatus.value = '邀请码无效或已过期'
          error.value = '邀请码无效或已过期，请检查后重试'
          invitationInfo.value = {
            inviterName: '',
            targetRoleName: '',
            isValid: false
          }
          loading.value = false
          inviteCodeValidating.value = false
          return
        }
      } catch (validationError) {
        console.error('验证邀请码失败:', validationError)
        const handledError = handleInviteCodeValidation(validationError, registerForm.inviteCode.trim())
        inviteCodeStatus.value = handledError.message
        error.value = handledError.message
        loading.value = false
        inviteCodeValidating.value = false
        return
      } finally {
        inviteCodeValidating.value = false
      }
    } else {
      // 普通注册
      registerResponse = await userStore.register(registerData)
      
      toast({
        title: '注册成功',
        description: '账号创建成功，欢迎使用',
        variant: 'default',
      })
    }

    console.log('注册成功，用户信息:', registerResponse.user)
    console.log('邀请关系信息:', registerResponse.invitationInfo)

    // 注册成功后的处理
    await handleSuccessfulRegistration(registerResponse)
    
  } catch (err: any) {
    // 使用专门的注册错误处理
    const handledError = handleInviteRegistration(err, {
      hasInviteCode: !!(registerForm.inviteCode?.trim() || ''),
      inviteCode: registerForm.inviteCode?.trim() || ''
    })
    
    error.value = handledError.message || '注册失败，请检查填写信息'
    console.error('注册失败:', err)
  } finally {
    loading.value = false
  }
}

// 处理注册成功后的逻辑
const handleSuccessfulRegistration = async (registerResponse: any) => {
  try {
    // 处理邀请关系建立
    if (registerResponse.invitationInfo) {
      const relationshipResult = await handlePostRegistrationInvitation(registerResponse)
      
      if (relationshipResult) {
        if (relationshipResult.success) {
          console.log('邀请关系处理成功:', relationshipResult.message)
        } else {
          console.warn('邀请关系处理失败:', relationshipResult.message)
          
          // 显示关系建立失败的提示
          toast({
            title: '提示',
            description: relationshipResult.message,
            variant: 'default'
          })
        }
      }
    }
    
    // 如果注册后已经自动登录，直接跳转到主页
    if (registerResponse.token && userStore.token) {
      console.log('注册后自动登录成功，准备跳转到主页')
      
      // 加载动态路由
      if (!userStore.routesLoaded) {
        console.log('注册后手动添加动态路由')
        const { asyncRoutes, filterRoutesByRole } = await import('@/router/routes')
        
        const accessibleRoutes = filterRoutesByRole(asyncRoutes, userStore.roles || [])
        accessibleRoutes.forEach(route => {
          if (route.name && !router.hasRoute(route.name)) {
            console.log('添加路由:', route.path, route.name)
            router.addRoute(route)
          }
        })
        userStore.$patch({ routesLoaded: true })
      }
      
      // 跳转到主页
      await router.push('/dashboard')
      console.log('注册后成功跳转到主页')
      
    } else {
      // 注册成功但未自动登录，切换到登录模式
      isLoginMode.value = true
      loginForm.username = registerForm.username
      
      // 清空注册表单
      Object.assign(registerForm, {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        inviteCode: ''
      })
      
      invitationInfo.value = null
      inviteCodeStatus.value = ''
    }
  } catch (navError) {
    console.error('注册后导航失败:', navError)
    error.value = '注册成功但页面跳转失败，请手动登录'
  }
}
</script>