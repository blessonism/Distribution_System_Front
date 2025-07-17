<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">等级规则配置</h1>
      <p class="text-gray-600">配置代理等级规则和晋升条件</p>
    </div>

    <!-- 规则列表 -->
    <Card>
      <CardHeader>
        <CardTitle>代理等级设置</CardTitle>
        <CardDescription>配置不同等级的要求和权益</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="text-center py-8 text-gray-500">
          <p>等级规则配置功能开发中...</p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
</script>