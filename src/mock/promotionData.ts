import type {
  PromotionTask,
  PromotionStatus,
  PromotionPlatform,
  PromotionContentType,
  AuditHistory,
  AuditStats,
  TaskSubmissionRequest,
  AgentTaskFilterParams,
  AgentTaskStats,
  URLRecognitionResult
} from '@/types/promotion'
import type { PaginatedResponse } from '@/types/api'
import dayjs from 'dayjs'

/**
 * 生成随机任务ID
 */
const generateTaskId = (index: number): string => {
  return `PT${dayjs().format('YYYYMMDD')}${String(index).padStart(4, '0')}`
}

/**
 * 生成随机代理信息
 */
const mockAgents = [
  { id: 'A001', name: '张小红', level: 'SV1' },
  { id: 'A002', name: '李美丽', level: 'SV2' },
  { id: 'A003', name: '王芳芳', level: 'SV1' },
  { id: 'A004', name: '刘晓琴', level: 'SV3' },
  { id: 'A005', name: '陈思思', level: 'SV2' },
  { id: 'A006', name: '杨雪梅', level: 'SV4' },
  { id: 'A007', name: '赵丽华', level: 'SV1' },
  { id: 'A008', name: '孙晓霞', level: 'SV3' },
  { id: 'A009', name: '周欣悦', level: 'SV2' },
  { id: 'A010', name: '吴佳佳', level: 'SV5' },
  { id: 'A011', name: '郑雅琪', level: 'SV1' },
  { id: 'A012', name: '何美玲', level: 'SV2' },
  { id: 'A013', name: '林诗雨', level: 'SV3' },
  { id: 'A014', name: '高婷婷', level: 'SV1' },
  { id: 'A015', name: '马琳琳', level: 'SV4' }
]

/**
 * 生成随机审核员信息
 */
const mockAuditors = [
  { id: 'AU001', name: '王审核', role: 'leader' },
  { id: 'AU002', name: '李总监', role: 'director' },
  { id: 'AU003', name: '张组长', role: 'leader' },
  { id: 'AU004', name: '超级管理员', role: 'super_admin' }
]

/**
 * 推广内容模板
 */
const mockContentDescriptions = [
  '【限时特惠】高端护肤品套装，让你拥有婴儿般嫩滑肌肤✨',
  '🔥【爆款推荐】这款面膜我用了一个月，朋友都说我年轻了5岁！',
  '真人测评：这支口红持妆12小时不脱色，姐妹们冲鸭！💄',
  '【种草分享】平价好物推荐，学生党也买得起的神仙单品',
  '亲测有效！一周瘦了8斤，这个减肥方法太神奇了',
  '【好物分享】居家好物推荐，提升生活品质必备',
  '真实体验：这款洗面奶用完后皮肤水嫰嫰的',
  '【美食探店】这家店的甜品颜值超高，味道也绝了！',
  '分享一个超好用的学习方法，让你效率翻倍',
  '【时尚穿搭】小个子女生显高穿搭技巧分享'
]

/**
 * 生成随机推广内容URL
 */
const generateContentUrl = (platform: PromotionPlatform, index: number): string => {
  const baseUrls = {
    douyin: 'https://v.douyin.com/',
    kuaishou: 'https://v.kuaishou.com/',
    xiaohongshu: 'https://www.xiaohongshu.com/explore/'
  }
  return `${baseUrls[platform]}${Math.random().toString(36).substring(2, 12)}`
}

/**
 * 生成随机审核意见
 */
const mockAuditComments = [
  '内容质量不错，推广信息清晰，通过审核',
  '推广内容符合平台规范，代理表现良好',
  '内容涉嫌夸大宣传，请修改后重新提交',
  '推广素材质量较低，建议优化后再次申请',
  '违反平台内容规范，含有禁用词汇',
  '推广效果数据造假，拒绝通过',
  '内容原创性不足，存在搬运嫌疑',
  '推广方式过于直接，影响用户体验'
]

/**
 * 生成曝光量数据
 * 确保有足够的任务达到300+门槛以便测试二次审核功能
 */
const generateViewCount = (status: PromotionStatus, index: number): number => {
  // 只有已通过的任务才有曝光量
  if (status !== 'APPROVED') {
    return 0
  }

  // 确保前30%的已通过任务曝光量达到300+
  if (index % 10 < 3) {
    return Math.floor(Math.random() * 5000) + 300 // 300-5300
  }

  // 其余任务随机曝光量，部分达到门槛
  if (Math.random() > 0.7) {
    return Math.floor(Math.random() * 2000) + 300 // 300-2300
  }

  // 大部分任务曝光量不足300
  return Math.floor(Math.random() * 299) + 1 // 1-299
}

/**
 * 生成模拟推广任务数据
 */
export const generateMockPromotionTasks = (count: number = 100): PromotionTask[] => {
  const tasks: PromotionTask[] = []
  const statuses: PromotionStatus[] = ['PENDING_MACHINE_AUDIT', 'PENDING_MANUAL_AUDIT', 'APPROVED', 'REJECTED']
  const platforms: PromotionPlatform[] = ['douyin', 'kuaishou', 'xiaohongshu']
  const contentTypes: PromotionContentType[] = ['normal', 'live_person']

  for (let i = 1; i <= count; i++) {
    const agent = mockAgents[i % mockAgents.length]
    const platform = platforms[i % platforms.length]
    const contentType = contentTypes[i % contentTypes.length]
    const status = statuses[i % statuses.length]
    const auditor = status === 'APPROVED' || status === 'REJECTED' 
      ? mockAuditors[i % mockAuditors.length] 
      : undefined

    // 根据状态生成不同的时间
    const submittedAt = dayjs().subtract(Math.floor(Math.random() * 30), 'day').toISOString()
    const auditedAt = (status === 'APPROVED' || status === 'REJECTED') 
      ? dayjs(submittedAt).add(Math.floor(Math.random() * 24), 'hour').toISOString()
      : undefined

    const task: PromotionTask = {
      id: generateTaskId(i),
      agentId: agent.id,
      agentName: agent.name,
      agentLevel: agent.level,
      platform,
      contentType,
      contentUrl: generateContentUrl(platform, i),
      contentPreview: `https://picsum.photos/300/400?random=${i}`, // 随机预览图
      contentDescription: mockContentDescriptions[i % mockContentDescriptions.length],
      status,
      submittedAt,
      auditedAt,
      auditorId: auditor?.id,
      auditorName: auditor?.name,
      auditComment: (status === 'APPROVED' || status === 'REJECTED') 
        ? mockAuditComments[i % mockAuditComments.length]
        : undefined,
      rewardAmount: status === 'APPROVED' ? (contentType === 'live_person' ? 5 : 1) : undefined,
      viewCount: generateViewCount(status, i),
      isSecondAudit: Math.random() > 0.8, // 20% 概率为二次审核
      createdAt: submittedAt,
      updatedAt: auditedAt || submittedAt
    }

    tasks.push(task)
  }

  return tasks
}

/**
 * 生成模拟审核历史数据
 */
export const generateMockAuditHistory = (taskId: string): AuditHistory[] => {
  const history: AuditHistory[] = []
  const task = mockPromotionTasks.find(t => t.id === taskId)

  console.log('[Mock] 生成审核历史，taskId:', taskId, '找到任务:', !!task)

  if (!task) {
    console.log('[Mock] 未找到任务，返回空历史')
    return history
  }

  console.log('[Mock] 任务状态:', task.status, '审核员:', task.auditorName)

  // 生成初始提交记录（系统自动记录）
  history.push({
    id: `H${taskId}_001`,
    taskId,
    auditorId: 'SYSTEM',
    auditorName: '系统',
    action: 'approve',
    comment: '任务提交成功，进入待审核状态',
    auditedAt: task.submittedAt,
    previousStatus: 'PENDING_MACHINE_AUDIT',
    newStatus: 'PENDING_MANUAL_AUDIT'
  })

  // 如果任务已审核，生成审核记录
  if (task.status === 'APPROVED' || task.status === 'REJECTED') {
    const action = task.status === 'APPROVED' ? 'approve' : 'reject'

    // 确保有审核员信息，如果没有则使用默认值
    const auditorId = task.auditorId || mockAuditors[0].id
    const auditorName = task.auditorName || mockAuditors[0].name
    const auditComment = task.auditComment || (action === 'approve' ? '审核通过' : '审核不通过')
    const auditedAt = task.auditedAt || dayjs(task.submittedAt).add(1, 'hour').toISOString()

    history.push({
      id: `H${taskId}_002`,
      taskId,
      auditorId,
      auditorName,
      action,
      comment: auditComment,
      auditedAt,
      previousStatus: 'PENDING_MANUAL_AUDIT',
      newStatus: task.status
    })
  }

  // 20% 概率生成二次审核记录
  if (task.isSecondAudit && task.status === 'APPROVED') {
    const secondAuditTime = task.auditedAt
      ? dayjs(task.auditedAt).add(Math.floor(Math.random() * 7), 'day').toISOString()
      : dayjs(task.submittedAt).add(2, 'day').toISOString()

    history.push({
      id: `H${taskId}_003`,
      taskId,
      auditorId: mockAuditors[0].id,
      auditorName: mockAuditors[0].name,
      action: 'approve',
      comment: '二次审核通过，追加奖励',
      auditedAt: secondAuditTime,
      previousStatus: 'APPROVED',
      newStatus: 'APPROVED'
    })
  }

  console.log('[Mock] 生成审核历史完成，共', history.length, '条记录')
  return history
}

/**
 * 生成模拟代理任务列表数据
 */
export const generateMockAgentTaskList = (params: any): PaginatedResponse<PromotionTask> => {
  console.log('[Mock] 生成代理任务列表，参数:', params)

  // 过滤任务数据（模拟当前用户的任务）
  let filteredTasks = [...mockPromotionTasks]

  // 根据筛选条件过滤
  if (params.status && params.status !== 'all') {
    filteredTasks = filteredTasks.filter(task => task.status === params.status)
  }

  if (params.platform && params.platform !== 'all') {
    filteredTasks = filteredTasks.filter(task => task.platform === params.platform)
  }

  if (params.contentType && params.contentType !== 'all') {
    filteredTasks = filteredTasks.filter(task => task.contentType === params.contentType)
  }

  if (params.keyword) {
    const keyword = params.keyword.toLowerCase()
    filteredTasks = filteredTasks.filter(task =>
      task.contentUrl.toLowerCase().includes(keyword) ||
      task.contentDescription.toLowerCase().includes(keyword) ||
      task.id.toLowerCase().includes(keyword)
    )
  }

  // 分页处理
  const page = params.page || 1
  const pageSize = params.pageSize || 20
  const total = filteredTasks.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const list = filteredTasks.slice(startIndex, endIndex)

  console.log('[Mock] 代理任务列表生成完成，总数:', total, '当前页:', page, '页面大小:', pageSize, '返回:', list.length, '条')

  return {
    list,
    page,
    pageSize,
    total,
    totalPages
  }
}

/**
 * 生成模拟代理任务统计数据
 */
export const generateMockAgentTaskStats = (): AgentTaskStats => {
  console.log('[Mock] 生成代理任务统计')

  // 基于现有任务数据计算统计
  const tasks = mockPromotionTasks

  const pending = tasks.filter(task => task.status === 'PENDING_MANUAL_AUDIT' || task.status === 'PENDING_MACHINE_AUDIT').length
  const approved = tasks.filter(task => task.status === 'APPROVED').length
  const rejected = tasks.filter(task => task.status === 'REJECTED').length
  const total = tasks.length

  // 计算总奖励
  const totalReward = tasks
    .filter(task => task.status === 'APPROVED' && task.rewardAmount)
    .reduce((sum, task) => sum + (task.rewardAmount || 0), 0)

  // 计算平台分布
  const platformStats = {
    douyin: tasks.filter(task => task.platform === 'douyin').length,
    kuaishou: tasks.filter(task => task.platform === 'kuaishou').length,
    xiaohongshu: tasks.filter(task => task.platform === 'xiaohongshu').length
  }

  // 计算内容类型分布
  const contentTypeStats = {
    video: tasks.filter(task => task.contentType === 'video').length,
    live_person: tasks.filter(task => task.contentType === 'live_person').length,
    live_goods: tasks.filter(task => task.contentType === 'live_goods').length
  }

  const stats = {
    total,
    pending,
    approved,
    rejected,
    totalReward,
    platformStats,
    contentTypeStats,
    // 添加一些额外的统计信息
    averageReward: approved > 0 ? totalReward / approved : 0,
    approvalRate: total > 0 ? (approved / total) * 100 : 0,
    rejectionRate: total > 0 ? (rejected / total) * 100 : 0
  }

  console.log('[Mock] 代理任务统计生成完成:', stats)
  return stats
}

/**
 * 生成模拟审核统计数据
 */
export const generateMockAuditStats = (): AuditStats => {
  const totalPending = Math.floor(Math.random() * 100) + 20
  const todayAudited = Math.floor(Math.random() * 50) + 10
  const todayApproved = Math.floor(todayAudited * 0.7) + Math.floor(Math.random() * 10)
  const todayRejected = todayAudited - todayApproved

  return {
    totalPending,
    todayAudited,
    todayApproved,
    todayRejected,
    approvalRate: Math.round((todayApproved / todayAudited) * 100) / 100,
    avgAuditTime: Math.floor(Math.random() * 120) + 30, // 30-150分钟
    rewardAmountToday: todayApproved * 1.5 // 平均每个任务1.5元奖励
  }
}

/**
 * 根据用户权限过滤推广任务
 */
export const filterTasksByPermission = (
  tasks: PromotionTask[],
  userRole: string,
  userId: string
): PromotionTask[] => {
  switch (userRole) {
    case 'super_admin':
      return tasks // 超级管理员可以看到所有任务

    case 'director':
      // 销售总监可以看到其管辖范围内的任务
      // 这里简化处理，假设可以看到80%的任务
      return tasks.filter((_, index) => index % 5 !== 0)

    case 'leader':
      // 销售组长只能看到其管辖销售发展的代理任务
      // 这里简化处理，假设只能看到40%的任务
      return tasks.filter((_, index) => index % 5 < 2)

    default:
      return [] // 其他角色无法查看
  }
}

/**
 * 根据筛选条件过滤任务
 */
export const filterTasksByParams = (
  tasks: PromotionTask[],
  params: {
    keyword?: string
    status?: string
    platform?: string
    contentType?: string
    dateRange?: { startDate: string; endDate: string }
    auditorId?: string
  }
): PromotionTask[] => {
  let filtered = [...tasks]

  // 关键词搜索（任务ID、代理姓名）
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase()
    filtered = filtered.filter(task =>
      task.id.toLowerCase().includes(keyword) ||
      task.agentName.toLowerCase().includes(keyword) ||
      task.contentDescription?.toLowerCase().includes(keyword)
    )
  }

  // 状态筛选
  if (params.status && params.status !== 'all') {
    filtered = filtered.filter(task => task.status === params.status)
  }

  // 平台筛选
  if (params.platform && params.platform !== 'all') {
    filtered = filtered.filter(task => task.platform === params.platform)
  }

  // 内容类型筛选
  if (params.contentType && params.contentType !== 'all') {
    filtered = filtered.filter(task => task.contentType === params.contentType)
  }

  // 时间范围筛选
  if (params.dateRange) {
    const { startDate, endDate } = params.dateRange
    filtered = filtered.filter(task => {
      const taskDate = dayjs(task.submittedAt)
      return taskDate.isAfter(dayjs(startDate)) && taskDate.isBefore(dayjs(endDate))
    })
  }

  // 审核员筛选
  if (params.auditorId && params.auditorId !== 'all') {
    filtered = filtered.filter(task => task.auditorId === params.auditorId)
  }

  return filtered
}

/**
 * 模拟数据实例
 */
export const mockPromotionTasks = generateMockPromotionTasks(150)
export const mockAuditStatsData = generateMockAuditStats()

/**
 * 获取特定任务的详情
 */
export const getMockTaskDetail = (taskId: string): PromotionTask | null => {
  return mockPromotionTasks.find(task => task.id === taskId) || null
}

/**
 * 更新任务状态（用于审核操作）
 */
export const updateTaskStatus = (
  taskId: string,
  action: 'approve' | 'reject',
  auditorId: string,
  auditorName: string,
  comment?: string,
  rewardAmount?: number
): PromotionTask | null => {
  const taskIndex = mockPromotionTasks.findIndex(task => task.id === taskId)
  if (taskIndex === -1) return null

  const task = mockPromotionTasks[taskIndex]
  const now = new Date().toISOString()

  // 更新任务状态
  mockPromotionTasks[taskIndex] = {
    ...task,
    status: action === 'approve' ? 'APPROVED' : 'REJECTED',
    auditedAt: now,
    auditorId,
    auditorName,
    auditComment: comment,
    rewardAmount: action === 'approve' ? (rewardAmount || 1) : undefined,
    updatedAt: now
  }

  return mockPromotionTasks[taskIndex]
}

// ==================== 代理任务提交相关Mock函数 ====================

/**
 * 模拟代理提交任务
 * @param request - 任务提交请求
 * @param agentId - 当前代理ID（从用户状态获取）
 */
export const mockSubmitTask = (request: TaskSubmissionRequest, agentId: string = 'A001'): PromotionTask => {
  const agent = mockAgents.find(a => a.id === agentId) || mockAgents[0]
  const taskId = generateTaskId(mockPromotionTasks.length + 1)
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const newTask: PromotionTask = {
    id: taskId,
    agentId: agent.id,
    agentName: agent.name,
    agentLevel: agent.level,
    platform: request.platform,
    contentType: request.contentType,
    contentUrl: request.contentUrl,
    contentDescription: request.contentDescription,
    status: 'PENDING',
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
    // 新增字段
    submissionSource: 'agent',
    autoDetectedPlatform: request.autoDetectedPlatform,
    manualPlatformOverride: request.autoDetectedPlatform !== request.platform
  }

  // 添加到Mock数据中
  mockPromotionTasks.unshift(newTask)

  return newTask
}

/**
 * 模拟获取代理任务列表
 * @param params - 筛选参数
 * @param agentId - 当前代理ID
 */
export const mockGetAgentTaskList = (
  params: AgentTaskFilterParams,
  agentId: string = 'A001'
): { list: PromotionTask[]; total: number; page: number; pageSize: number } => {
  // 筛选出当前代理的任务
  let filteredTasks = mockPromotionTasks.filter(task => task.agentId === agentId)

  // 应用筛选条件
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase()
    filteredTasks = filteredTasks.filter(task =>
      task.contentDescription?.toLowerCase().includes(keyword) ||
      task.contentUrl.toLowerCase().includes(keyword)
    )
  }

  if (params.status && params.status !== 'all') {
    filteredTasks = filteredTasks.filter(task => task.status === params.status)
  }

  if (params.platform && params.platform !== 'all') {
    filteredTasks = filteredTasks.filter(task => task.platform === params.platform)
  }

  if (params.contentType && params.contentType !== 'all') {
    filteredTasks = filteredTasks.filter(task => task.contentType === params.contentType)
  }

  if (params.dateRange) {
    const { startDate, endDate } = params.dateRange
    filteredTasks = filteredTasks.filter(task => {
      const taskDate = dayjs(task.submittedAt).format('YYYY-MM-DD')
      return taskDate >= startDate && taskDate <= endDate
    })
  }

  // 分页处理
  const page = params.page || 1
  const pageSize = params.pageSize || 20
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex)

  return {
    list: paginatedTasks,
    total: filteredTasks.length,
    page,
    pageSize
  }
}

/**
 * 模拟获取代理任务统计
 * @param agentId - 当前代理ID
 */
export const mockGetAgentTaskStats = (agentId: string = 'A001'): AgentTaskStats => {
  const agentTasks = mockPromotionTasks.filter(task => task.agentId === agentId)

  const totalSubmitted = agentTasks.length
  const pendingAudit = agentTasks.filter(task => task.status === 'PENDING').length
  const approved = agentTasks.filter(task => task.status === 'APPROVED').length
  const rejected = agentTasks.filter(task => task.status === 'REJECTED').length

  const totalReward = agentTasks
    .filter(task => task.status === 'APPROVED' && task.rewardAmount)
    .reduce((sum, task) => sum + (task.rewardAmount || 0), 0)

  // 本月数据
  const thisMonth = dayjs().format('YYYY-MM')
  const thisMonthTasks = agentTasks.filter(task =>
    dayjs(task.submittedAt).format('YYYY-MM') === thisMonth
  )
  const thisMonthSubmitted = thisMonthTasks.length
  const thisMonthApproved = thisMonthTasks.filter(task => task.status === 'APPROVED').length

  return {
    totalSubmitted,
    pendingAudit,
    approved,
    rejected,
    totalReward,
    thisMonthSubmitted,
    thisMonthApproved
  }
}

/**
 * 模拟URL平台识别
 * @param url - 要识别的URL
 */
export const mockRecognizePlatform = (url: string): URLRecognitionResult => {
  const urlLower = url.toLowerCase()

  // 抖音识别
  if (urlLower.includes('douyin.com') || urlLower.includes('dy.com')) {
    return {
      platform: 'douyin',
      confidence: 0.95,
      suggestions: ['douyin']
    }
  }

  // 快手识别
  if (urlLower.includes('kuaishou.com') || urlLower.includes('ks.com')) {
    return {
      platform: 'kuaishou',
      confidence: 0.95,
      suggestions: ['kuaishou']
    }
  }

  // 小红书识别
  if (urlLower.includes('xiaohongshu.com') || urlLower.includes('xhs.com')) {
    return {
      platform: 'xiaohongshu',
      confidence: 0.95,
      suggestions: ['xiaohongshu']
    }
  }

  // 无法识别
  return {
    platform: null,
    confidence: 0,
    suggestions: []
  }
}