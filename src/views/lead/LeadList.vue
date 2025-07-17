<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">客资管理</h1>
        <p class="text-gray-600">管理客户资源信息</p>
      </div>
      <Button>新增客资</Button>
    </div>

    <!-- 搜索和筛选 -->
    <Card>
      <CardContent class="pt-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>客户姓名</Label>
            <Input placeholder="搜索客户姓名" />
          </div>
          <div>
            <Label>状态</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="new">新客资</SelectItem>
                <SelectItem value="contacted">已联系</SelectItem>
                <SelectItem value="converted">已转化</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>归属销售</Label>
            <Input placeholder="选择销售人员" />
          </div>
          <div class="flex items-end">
            <Button variant="outline" class="w-full">搜索</Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 客资列表 -->
    <Card>
      <CardContent class="pt-6">
        <div class="text-center py-8 text-gray-500">
          <p>客资列表功能开发中...</p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
</script>