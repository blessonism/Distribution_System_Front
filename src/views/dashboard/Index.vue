<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">仪表盘</h1>
      <p class="text-gray-600">欢迎使用分销系统管理后台</p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card v-for="stat in stats" :key="stat.title">
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-gray-600">
            {{ stat.title }}
          </CardTitle>
          <component :is="stat.icon" class="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stat.value }}</div>
          <p class="text-xs text-gray-500">{{ stat.description }}</p>
        </CardContent>
      </Card>
    </div>

    <!-- 快捷操作 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 最近客资 -->
      <Card>
        <CardHeader>
          <CardTitle>最近客资</CardTitle>
          <CardDescription>最近7天新增的客户资源</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-gray-500 text-center py-4">暂无数据</p>
        </CardContent>
        <CardFooter>
          <Button as-child variant="outline" class="w-full">
            <router-link to="/lead/list">查看更多客资</router-link>
          </Button>
        </CardFooter>
      </Card>

      <!-- 待处理任务 -->
      <Card>
        <CardHeader>
          <CardTitle>待处理任务</CardTitle>
          <CardDescription>需要您处理的任务</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-gray-500 text-center py-4">暂无待处理任务</p>
        </CardContent>
        <CardFooter>
          <Button as-child variant="outline" class="w-full">
            <router-link to="/promotion/audit">查看推广审核</router-link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, DollarSign, Target, TrendingUp } from 'lucide-vue-next'

interface Stat {
  title: string
  value: string
  description: string
  icon: any
}

const stats = ref<Stat[]>([
  {
    title: '总用户数',
    value: '0',
    description: '系统注册用户总数',
    icon: Users
  },
  {
    title: '总成交',
    value: '¥0',
    description: '累计成交金额',
    icon: DollarSign
  },
  {
    title: '今日客资',
    value: '0',
    description: '今日新增客资数',
    icon: Target
  },
  {
    title: '转化率',
    value: '0%',
    description: '客资转化率',
    icon: TrendingUp
  }
])

onMounted(() => {
  console.log('仪表盘组件已加载')
  // TODO: 获取仪表盘数据
  // loadDashboardData()
})

const loadDashboardData = async () => {
  try {
    // TODO: 调用API获取数据
    // const data = await http.get('/dashboard/stats')
    // 更新统计数据
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
  }
}
</script>