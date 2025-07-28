<!--
/**
 * @fileoverview 代理业绩图表组件
 * 基于Vue 3 Composition API和ECharts构建的业绩数据可视化组件，提供多维度的代理业绩趋势展示
 * 支持多时间周期切换、实时数据加载、响应式图表渲染和丰富的交互功能
 * 集成ECharts图表库，确保高性能的数据可视化体验
 * 
 * @component AgentPerformanceChart
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.3.0
 * 
 * @description
 * AgentPerformanceChart组件是代理管理系统的核心数据可视化组件，主要功能包括：
 * - 📈 多维度业绩趋势展示，支持客资数量、成交金额、提成金额等指标
 * - ⏰ 灵活的时间周期切换，支持周、月、季、年等不同时间维度
 * - 🎨 基于ECharts的专业图表渲染，支持平滑曲线和双Y轴显示
 * - 📱 响应式设计和自适应布局，兼容不同屏幕尺寸
 * - 🔄 实时数据刷新和加载状态管理
 * - 🎯 丰富的交互功能，包括数据提示、图例控制等
 * - ⚡ 性能优化，支持大数据量的高效渲染
 * 
 * @usage
 * ```vue
 * <template>
 *   <AgentPerformanceChart
 *     :performance-data="performanceData"
 *     :loading="isLoading"
 *     :period="selectedPeriod"
 *     @period-change="handlePeriodChange"
 *     @refresh="handleRefresh"
 *   />
 * </template>
 * ```
 * 
 * @example
 * ```typescript
 * // 基础使用示例
 * const performanceData: AgentPerformance = {
 *   trendData: {
 *     labels: ['1月', '2月', '3月', '4月', '5月'],
 *     revenue: [50000, 65000, 78000, 85000, 92000],
 *     clients: [25, 32, 38, 42, 46],
 *     commission: [2500, 3250, 3900, 4250, 4600]
 *   }
 * }
 * 
 * function handlePeriodChange(period: string) {
 *   // 处理时间周期变化
 *   fetchPerformanceData(period)
 * }
 * 
 * function handleRefresh() {
 *   // 刷新当前数据
 *   reloadPerformanceData()
 * }
 * ```
 * 
 * @dependencies
 * - ECharts: 专业的数据可视化图表库
 * - Vue 3 Composition API: 响应式状态管理
 * - shadcn-vue Button: 周期切换按钮组件
 * 
 * @features
 * - **多时间维度**: 支持周、月、季、年等不同时间周期的数据展示
 * - **双Y轴设计**: 左侧显示客资数量，右侧显示金额相关数据
 * - **平滑曲线**: 使用平滑插值算法，提供更美观的趋势展示
 * - **响应式布局**: 自动适配容器大小变化，支持窗口缩放
 * - **交互式提示**: 丰富的Tooltip信息，包含格式化的数值显示
 * - **错误处理**: 完善的错误状态处理和用户反馈机制
 * - **性能优化**: 延迟加载、深拷贝数据处理，避免内存泄漏
 */
-->

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
/**
 * @fileoverview AgentPerformanceChart组件的核心逻辑实现
 * 使用Vue 3 Composition API实现ECharts图表的完整功能，包含数据处理、图表渲染和交互管理
 */
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

/**
 * ECharts组件注册
 * 按需注册所需的ECharts组件，减少打包体积并提升性能
 * 
 * @description 注册以下组件：
 * - TitleComponent: 标题组件
 * - TooltipComponent: 提示框组件
 * - GridComponent: 网格组件
 * - DatasetComponent: 数据集组件
 * - TransformComponent: 数据转换组件
 * - LegendComponent: 图例组件
 * - LineChart: 折线图组件
 * - LabelLayout: 标签布局
 * - UniversalTransition: 通用过渡动画
 * - CanvasRenderer: Canvas渲染器
 */
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

/**
 * 组件属性接口定义
 * 定义AgentPerformanceChart组件的输入属性
 * 
 * @interface Props
 * 
 * @property {AgentPerformance | null} [performanceData] - 代理业绩数据对象，包含趋势数据
 * @property {boolean} [loading] - 数据加载状态，控制加载动画显示
 * @property {string} [period] - 当前时间周期，用于同步父组件状态
 * 
 * @example
 * ```typescript
 * const props: Props = {
 *   performanceData: {
 *     trendData: {
 *       labels: ['1月', '2月', '3月'],
 *       revenue: [50000, 65000, 78000],
 *       clients: [25, 32, 38],
 *       commission: [2500, 3250, 3900]
 *     }
 *   },
 *   loading: false,
 *   period: 'month'
 * }
 * ```
 */
const props = defineProps<{
  /** 代理业绩数据，包含趋势图表所需的所有数据 */
  performanceData?: AgentPerformance | null;
  /** 数据加载状态，true时显示加载动画 */
  loading?: boolean;
  /** 当前选择的时间周期，从父组件传入 */
  period?: string;
}>()

/**
 * 时间周期选项配置
 * 定义可选择的时间维度选项，用于切换不同时间范围的数据展示
 * 
 * @const periods
 * @type {Array<{value: string, label: string}>}
 * 
 * @description 支持的时间周期：
 * - week: 周维度数据
 * - month: 月维度数据
 * - quarter: 季度维度数据
 * - year: 年维度数据
 * 
 * @example
 * ```typescript
 * // 获取所有可用周期
 * const availablePeriods = periods.map(p => p.value)
 * 
 * // 查找特定周期的标签
 * const monthLabel = periods.find(p => p.value === 'month')?.label // '月'
 * ```
 */
const periods = [
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
  { value: 'quarter', label: '季' },
  { value: 'year', label: '年' },
]

/**
 * 组件响应式状态管理
 * 管理图表DOM引用、ECharts实例和组件状态
 */
/** 图表DOM容器引用 */
const chartRef = ref<HTMLElement | null>(null)
/** ECharts图表实例引用 */
const chart = ref<echarts.ECharts | null>(null)
/** 当前选中的时间周期 */
const selectedPeriod = ref(props.period || 'month')
/** 错误信息状态 */
const error = ref('')
/** 本地加载状态 */
const loading = ref(props.loading || false)

/**
 * 监听父组件period属性变化
 * 同步父组件传入的周期选择状态
 * 
 * @watcher periodWatcher
 * @param {string} newPeriod - 新的时间周期值
 * 
 * @complexity O(1) - 简单值比较和赋值，常数时间复杂度
 * @flow 属性变化 → 值比较 → 状态同步 → 界面更新
 */
watch(() => props.period, (newPeriod) => {
  if (newPeriod && newPeriod !== selectedPeriod.value) {
    selectedPeriod.value = newPeriod
  }
}, { immediate: true })

/**
 * 组件事件定义
 * 定义AgentPerformanceChart组件对外发出的事件
 * 
 * @events
 * 
 * @event period-change - 时间周期变化事件，参数为新的周期值
 * @event refresh - 数据刷新事件，用于通知父组件重新加载数据
 * 
 * @example
 * ```typescript
 * // 事件处理示例
 * function handlePeriodChange(period: string) {
 *   // 处理周期变化，重新获取对应周期的数据
 *   fetchPerformanceData(period)
 * }
 * 
 * function handleRefresh() {
 *   // 处理刷新事件，重新加载当前数据
 *   reloadCurrentData()
 * }
 * ```
 */
const emit = defineEmits<{
  /** 时间周期变化事件 */
  (e: 'period-change', period: string): void;
  /** 数据刷新事件 */
  (e: 'refresh'): void;
}>()

/**
 * 变更时间周期
 * 处理用户点击周期按钮的操作，更新本地状态并通知父组件
 * 
 * @function changePeriod
 * @param {string} period - 新选择的时间周期
 * @returns {void}
 * 
 * @complexity O(1) - 简单状态更新和事件发出，常数时间复杂度
 * @flow 周期选择 → 状态更新 → 事件发出 → 父组件响应
 * 
 * @example
 * ```typescript
 * // 用户点击月份按钮时调用
 * changePeriod('month')
 * 
 * // 切换到年度视图
 * changePeriod('year')
 * ```
 */
const changePeriod = (period: string) => {
  selectedPeriod.value = period
  emit('period-change', period)
}

/**
 * 刷新数据
 * 触发数据刷新事件，通知父组件重新加载当前数据
 * 
 * @function refreshData
 * @returns {void}
 * 
 * @complexity O(1) - 简单事件发出，常数时间复杂度
 * 
 * @example
 * ```typescript
 * // 用户点击刷新按钮时调用
 * refreshData()
 * // 会触发父组件的refresh事件处理
 * ```
 */
const refreshData = () => {
  emit('refresh')
}

/**
 * 处理窗口大小改变
 * 响应窗口尺寸变化，自动调整图表大小以适应新的容器尺寸
 * 
 * @function handleResize
 * @returns {void}
 * 
 * @complexity O(1) - ECharts内部resize操作，常数时间复杂度
 * @flow 窗口变化 → 事件触发 → 图表实例检查 → 尺寸调整
 * 
 * @example
 * ```typescript
 * // 窗口大小改变时自动调用
 * window.addEventListener('resize', handleResize)
 * 
 * // 手动触发图表大小调整
 * handleResize()
 * ```
 */
const handleResize = () => {
  if (chart.value) {
    chart.value.resize()
  }
}

/**
 * 初始化ECharts图表实例
 * 创建图表实例并进行基础配置，包含DOM检查、实例清理和延迟重试机制
 * 
 * @function initChart
 * @returns {void}
 * 
 * @complexity O(1) - DOM操作和实例创建，常数时间复杂度
 * @flow DOM检查 → 实例清理 → 图表创建 → 加载状态 → 数据更新
 * 
 * @features
 * - DOM元素存在性检查
 * - 延迟重试机制（100ms）
 * - 旧实例清理避免内存泄漏
 * - 自动显示加载动画
 * - 链式调用数据更新
 * 
 * @example
 * ```typescript
 * // 组件挂载时初始化
 * onMounted(() => {
 *   initChart()
 * })
 * 
 * // 容器变化时重新初始化
 * if (containerChanged) {
 *   initChart()
 * }
 * ```
 */
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

/**
 * 计算用于图表的数据
 * 处理和转换原始性能数据为图表可用格式，包含数据验证和深拷贝处理
 * 
 * @computed chartData
 * @returns {Object | null} 格式化的图表数据对象或null
 * 
 * @complexity O(n) - n为数据点数量，需要数组拷贝操作
 * @flow 数据检查 → 结构验证 → 深拷贝处理 → 格式化输出
 * 
 * @returns {Object} 包含以下属性的数据对象：
 * - labels: 时间标签数组
 * - revenue: 收入数据数组
 * - clients: 客户数据数组
 * - commission: 提成数据数组
 * 
 * @example
 * ```typescript
 * // 获取格式化的图表数据
 * const data = chartData.value
 * if (data) {
 *   console.log('时间标签:', data.labels)
 *   console.log('收入数据:', data.revenue)
 *   console.log('客户数据:', data.clients)
 *   console.log('提成数据:', data.commission)
 * }
 * 
 * // 数据结构示例
 * {
 *   labels: ['1月', '2月', '3月'],
 *   revenue: [50000, 65000, 78000],
 *   clients: [25, 32, 38],
 *   commission: [2500, 3250, 3900]
 * }
 * ```
 */
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

/**
 * 更新图表数据和配置
 * 根据当前数据状态更新ECharts图表，包含完整的图表配置和错误处理
 * 
 * @function updateChart
 * @returns {void}
 * 
 * @complexity O(n) - n为数据点数量，ECharts内部渲染复杂度
 * @flow 实例检查 → 加载状态 → 数据验证 → 配置构建 → 图表渲染 → 错误处理
 * 
 * @features
 * - 图表实例存在性检查
 * - 数据有效性验证
 * - 双Y轴配置（客资数 + 金额）
 * - 平滑曲线渲染
 * - 自定义Tooltip格式化
 * - 响应式X轴标签旋转
 * - 完整的错误处理和用户反馈
 * 
 * @example
 * ```typescript
 * // 数据变化时更新图表
 * watch(() => props.performanceData, () => {
 *   updateChart()
 * })
 * 
 * // 手动触发图表更新
 * updateChart()
 * ```
 */
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