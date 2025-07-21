<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-medium">业绩趋势</h3>
      <div class="flex space-x-2">
        <Button 
          v-for="period in periods" 
          :key="period.value"
          size="sm"
          :variant="selectedPeriod === period.value ? 'default' : 'outline'"
          @click="changePeriod(period.value)"
        >
          {{ period.label }}
        </Button>
      </div>
    </div>
    
    <div v-if="loading" class="h-64 flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
    
    <div v-else-if="error" class="h-64 flex items-center justify-center">
      <div class="text-center text-muted-foreground">
        <p>{{ error }}</p>
        <Button variant="outline" size="sm" class="mt-2" @click="refreshData">
          重试
        </Button>
      </div>
    </div>
    
    <div v-else ref="chartRef" class="h-64 w-full"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, computed, nextTick } from 'vue'
import { Button } from '@/components/ui/button'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent
} from 'echarts/components'
import { LabelLayout, UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import type { AgentPerformance, TrendData } from '@/types/agent'

// 注册必要的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  LineChart,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer
])

const props = defineProps<{
  performanceData?: AgentPerformance | null;
  loading?: boolean;
  period?: string; // 添加period属性从父组件接收
}>()

const periods = [
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
  { value: 'quarter', label: '季' },
  { value: 'year', label: '年' },
]

const chartRef = ref<HTMLElement | null>(null)
const chart = ref<echarts.ECharts | null>(null)
const selectedPeriod = ref(props.period || 'month')
const error = ref('')
const loading = ref(props.loading || false)

// 监听props中的period变化
watch(() => props.period, (newPeriod) => {
  if (newPeriod && newPeriod !== selectedPeriod.value) {
    selectedPeriod.value = newPeriod
  }
}, { immediate: true })

const emit = defineEmits<{
  (e: 'period-change', period: string): void;
  (e: 'refresh'): void;
}>()

// 变更周期
const changePeriod = (period: string) => {
  selectedPeriod.value = period
  emit('period-change', period)
}

// 刷新数据
const refreshData = () => {
  emit('refresh')
}

// 处理窗口大小改变
const handleResize = () => {
  if (chart.value) {
    chart.value.resize()
  }
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) {
    console.log("图表DOM元素不存在，无法初始化");
    // 延迟100ms后重试，允许DOM更新
    setTimeout(() => {
      if (chartRef.value) {
        console.log("延迟后尝试初始化图表");
        initChart();
      }
    }, 100);
    return;
  }
  
  // 确保清理之前的实例
  if (chart.value) {
    chart.value.dispose();
    chart.value = null;
  }
  
  console.log("创建新的图表实例");
  chart.value = echarts.init(chartRef.value);
  
  // 设置加载动画
  chart.value.showLoading();
  
  // 使用props中的数据更新图表
  updateChart();
}

// 计算用于图表的数据
const chartData = computed(() => {
  console.log("重新计算chartData...");
  console.log("AgentPerformanceChart接收到的数据:", props.performanceData);
  
  if (!props.performanceData || !props.performanceData.trendData) {
    console.log("未找到trendData或performanceData为空");
    return null;
  }
  
  const trendData = props.performanceData.trendData;
  console.log("发现trendData:", trendData);
  
  // 创建数据的深拷贝，避免响应式引用问题
  return {
    labels: trendData.labels ? [...trendData.labels] : [],
    revenue: trendData.revenue ? [...trendData.revenue] : [],
    clients: trendData.clients ? [...trendData.clients] : [],
    commission: trendData.commission ? [...trendData.commission] : []
  };
})

// 更新图表数据
const updateChart = () => {
  if (!chart.value) {
    console.log("图表实例不存在，尝试重新初始化");
    initChart();
    return;
  }
  
  // 隐藏加载状态
  chart.value.hideLoading();
  
  // 检查数据是否存在
  if (!chartData.value) {
    error.value = '暂无业绩趋势数据';
    console.log("图表数据为空，无法渲染");
    return;
  }
  
  // 如果数据为空，显示提示
  if (chartData.value.labels.length === 0) {
    error.value = '暂无业绩趋势数据';
    console.log("图表标签为空，无法渲染");
    return;
  }
  
  error.value = '';
  console.log("开始更新图表，数据点数量:", chartData.value.labels.length);
  
  try {
    // 强制清除之前的所有系列和选项
    chart.value.clear();
    
    // 图表配置
    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: function(params: any) {
          let result = params[0].axisValueLabel + '<br/>'
          params.forEach((param: any) => {
            const marker = `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span>`
            let value = param.value
            
            // 如果是金额，添加货币符号
            if (param.seriesName === '成交金额' || param.seriesName === '提成金额') {
              value = '¥' + value.toLocaleString()
            }
            
            result += marker + param.seriesName + ': ' + value + '<br/>'
          })
          return result
        }
      },
      legend: {
        data: ['有效客资', '成交金额', '提成金额'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: chartData.value.labels,
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        },
        axisLabel: {
          color: '#666',
          rotate: chartData.value.labels.length > 12 ? 45 : 0
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '客资数',
          position: 'left',
          axisLine: {
            lineStyle: {
              color: '#5470c6'
            }
          },
          axisLabel: {
            color: '#666',
            formatter: '{value}'
          },
          splitLine: {
            lineStyle: {
              color: '#eee'
            }
          }
        },
        {
          type: 'value',
          name: '金额',
          position: 'right',
          axisLine: {
            lineStyle: {
              color: '#91cc75'
            }
          },
          axisLabel: {
            color: '#666',
            formatter: '¥{value}'
          },
          splitLine: {
            show: false
          }
        }
      ],
      series: [
        {
          name: '有效客资',
          type: 'line',
          smooth: true,
          emphasis: {
            focus: 'series'
          },
          data: chartData.value.clients
        },
        {
          name: '成交金额',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          emphasis: {
            focus: 'series'
          },
          data: chartData.value.revenue
        },
        {
          name: '提成金额',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          emphasis: {
            focus: 'series'
          },
          data: chartData.value.commission
        }
      ]
    }
    
    // 设置图表配置并强制重新渲染
    chart.value.setOption(option, true);
    
    console.log("图表更新完成");
  } catch (err) {
    console.error("图表更新失败:", err);
    error.value = '图表渲染失败，请刷新重试';
  }
}

// 监听性能数据变化
watch(() => props.performanceData, (newVal) => {
  console.log("性能数据变化，触发图表更新:", newVal?.trendData ? true : false);
  nextTick(() => {
    if (chart.value) {
      updateChart();
    } else if (chartRef.value) {
      initChart();
    }
  });
}, { deep: true, immediate: true })

// 监听周期变化
watch(() => selectedPeriod.value, (newPeriod) => {
  console.log("周期变化为:", newPeriod);
  // 周期变化时无需重新初始化图表，只需更新
  nextTick(() => {
    if (chart.value) {
      updateChart();
    }
  });
})

// 监听加载状态变化
watch(() => props.loading, (val) => {
  loading.value = val
})

// 监听DOM更新后，确保图表初始化和大小调整
onMounted(() => {
  // 使用nextTick确保DOM已更新
  nextTick(() => {
    // 延迟一点时间以确保DOM完全渲染
    setTimeout(() => {
      initChart();
      window.addEventListener('resize', handleResize);
    }, 100);
  });
})

// 当组件被卸载时，移除事件监听
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chart.value) {
    chart.value.dispose()
    chart.value = null
  }
})
</script> 