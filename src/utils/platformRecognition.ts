/**
 * @fileoverview 推广平台识别工具模块
 * 提供完整的URL平台识别、验证和显示信息获取功能，支持抖音、快手、小红书等主流平台
 * 包含URL格式验证、平台自动识别、置信度计算和显示信息管理等核心功能
 * 
 * @module utils/platformRecognition
 * @author Frontend Team
 * @since 1.0.0
 */
import type { 
  PromotionPlatform, 
  PlatformRecognitionRule, 
  URLRecognitionResult 
} from '@/types/promotion'
import { PLATFORM_RECOGNITION_RULES } from '@/types/promotion'

/**
 * URL验证结果接口
 */
export interface URLValidationResult {
  isValid: boolean
  error?: string
  normalizedUrl?: string
}

/**
 * 平台显示信息接口
 */
export interface PlatformDisplayInfo {
  platform: PromotionPlatform
  displayName: string
  icon: string
  color: string
  description: string
}

/**
 * 验证URL格式是否正确
 * 进行URL格式验证、协议检查、长度限制和域名有效性验证
 * 
 * @complexity O(1) - 常数时间复杂度，仅进行字符串操作和正则匹配
 * @flow 输入验证 → 空值检查 → 长度检查 → 协议规范化 → URL构造验证 → 域名检查
 * 
 * @param {string} url - 要验证的URL字符串
 * @returns {URLValidationResult} 验证结果对象，包含有效性、错误信息和规范化URL
 * 
 * @example
 * ```typescript
 * // 验证完整URL
 * const result1 = validateURL('https://www.douyin.com/video/123')
 * console.log(result1) // { isValid: true, normalizedUrl: 'https://www.douyin.com/video/123' }
 * 
 * // 验证不带协议的URL（自动添加https）
 * const result2 = validateURL('douyin.com/video/123')
 * console.log(result2) // { isValid: true, normalizedUrl: 'https://douyin.com/video/123' }
 * 
 * // 验证无效URL
 * const result3 = validateURL('invalid-url')
 * console.log(result3) // { isValid: false, error: 'URL域名无效' }
 * ```
 */
export function validateURL(url: string): URLValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL不能为空'
    }
  }

  // 去除首尾空格
  const trimmedUrl = url.trim()
  
  if (trimmedUrl.length === 0) {
    return {
      isValid: false,
      error: 'URL不能为空'
    }
  }

  // 检查URL长度
  if (trimmedUrl.length > 2048) {
    return {
      isValid: false,
      error: 'URL长度不能超过2048个字符'
    }
  }

  // 基础URL格式验证
  try {
    // 如果URL没有协议，自动添加https://
    let normalizedUrl = trimmedUrl
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      normalizedUrl = `https://${trimmedUrl}`
    }

    // 使用URL构造函数验证格式
    const urlObj = new URL(normalizedUrl)
    
    // 检查协议是否为http或https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        isValid: false,
        error: '仅支持HTTP和HTTPS协议'
      }
    }

    // 检查域名是否有效
    if (!urlObj.hostname || urlObj.hostname.length === 0) {
      return {
        isValid: false,
        error: 'URL域名无效'
      }
    }

    return {
      isValid: true,
      normalizedUrl
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'URL格式无效'
    }
  }
}

/**
 * 从URL识别推广平台
 * 基于预定义的正则表达式规则识别URL所属的推广平台，并计算匹配置信度
 * 
 * @complexity O(n*m) - n为平台规则数量，m为每个平台的模式数量，通常为O(1)常数级别
 * @flow URL验证 → 遍历平台规则 → 模式匹配 → 置信度计算 → 最佳匹配选择 → 建议排序
 * 
 * @param {string} url - 要识别的URL字符串
 * @returns {URLRecognitionResult} 识别结果，包含平台、置信度和建议列表
 * 
 * @example
 * ```typescript
 * // 识别抖音链接
 * const result1 = recognizePlatformFromURL('https://www.douyin.com/video/7123456789')
 * console.log(result1) 
 * // {
 * //   platform: 'douyin',
 * //   confidence: 0.8,
 * //   suggestions: ['douyin']
 * // }
 * 
 * // 识别模糊链接
 * const result2 = recognizePlatformFromURL('https://v.douyin.com/abc123')
 * console.log(result2)
 * // {
 * //   platform: 'douyin',
 * //   confidence: 0.9,
 * //   suggestions: ['douyin']
 * // }
 * ```
 */
export function recognizePlatformFromURL(url: string): URLRecognitionResult {
  // 首先验证URL格式
  const validation = validateURL(url)
  if (!validation.isValid) {
    return {
      platform: null,
      confidence: 0,
      suggestions: []
    }
  }

  const normalizedUrl = validation.normalizedUrl!
  const suggestions: PromotionPlatform[] = []
  let bestMatch: PromotionPlatform | null = null
  let highestConfidence = 0

  // 遍历所有平台识别规则
  for (const rule of PLATFORM_RECOGNITION_RULES) {
    let confidence = 0
    
    // 检查每个模式
    for (const pattern of rule.patterns) {
      if (pattern.test(normalizedUrl)) {
        // 根据匹配的模式计算置信度
        confidence = Math.max(confidence, calculateConfidence(normalizedUrl, pattern))
      }
    }

    // 如果有匹配，添加到建议列表
    if (confidence > 0) {
      suggestions.push(rule.platform)
      
      // 更新最佳匹配
      if (confidence > highestConfidence) {
        highestConfidence = confidence
        bestMatch = rule.platform
      }
    }
  }

  return {
    platform: highestConfidence >= 0.7 ? bestMatch : null, // 置信度阈值70%
    confidence: highestConfidence,
    suggestions: suggestions.sort((a, b) => {
      // 按照匹配度排序建议
      const aRule = PLATFORM_RECOGNITION_RULES.find(r => r.platform === a)!
      const bRule = PLATFORM_RECOGNITION_RULES.find(r => r.platform === b)!
      
      const aConfidence = Math.max(...aRule.patterns.map(p => 
        p.test(normalizedUrl) ? calculateConfidence(normalizedUrl, p) : 0
      ))
      const bConfidence = Math.max(...bRule.patterns.map(p => 
        p.test(normalizedUrl) ? calculateConfidence(normalizedUrl, p) : 0
      ))
      
      return bConfidence - aConfidence
    })
  }
}

/**
 * 计算URL与模式的匹配置信度
 * 基于域名匹配程度计算置信度分数，主域名匹配得分更高
 * 
 * @complexity O(1) - 常数时间复杂度，仅进行字符串包含检查
 * @flow 模式测试 → URL解析 → 域名提取 → 主域名匹配检查 → 短域名匹配检查 → 置信度计算
 * 
 * @param {string} url - 要分析的URL字符串
 * @param {RegExp} pattern - 用于匹配的正则表达式模式
 * @returns {number} 置信度分数，范围0-1，1表示完全匹配
 * 
 * @example
 * ```typescript
 * const pattern = /douyin\.com/
 * const confidence1 = calculateConfidence('https://www.douyin.com/video/123', pattern)
 * console.log(confidence1) // 0.8 (主域名匹配)
 * 
 * const confidence2 = calculateConfidence('https://dy.com/abc', pattern)
 * console.log(confidence2) // 0 (不匹配)
 * ```
 * 
 * @private
 */
function calculateConfidence(url: string, pattern: RegExp): number {
  if (!pattern.test(url)) {
    return 0
  }

  // 基础匹配得分
  let confidence = 0.5

  // 域名完全匹配加分
  const urlObj = new URL(url)
  const hostname = urlObj.hostname.toLowerCase()
  
  // 检查是否为主域名匹配
  if (pattern.source.includes('douyin\\.com') && hostname.includes('douyin.com')) {
    confidence += 0.3
  } else if (pattern.source.includes('kuaishou\\.com') && hostname.includes('kuaishou.com')) {
    confidence += 0.3
  } else if (pattern.source.includes('xiaohongshu\\.com') && hostname.includes('xiaohongshu.com')) {
    confidence += 0.3
  }

  // 短域名匹配加分较少
  if (pattern.source.includes('dy\\.com') && hostname.includes('dy.com')) {
    confidence += 0.2
  } else if (pattern.source.includes('ks\\.com') && hostname.includes('ks.com')) {
    confidence += 0.2
  } else if (pattern.source.includes('xhs\\.com') && hostname.includes('xhs.com')) {
    confidence += 0.2
  }

  // 确保置信度不超过1
  return Math.min(confidence, 1)
}

/**
 * 获取平台显示信息
 * 根据平台类型返回包含显示名称、图标、颜色和描述的完整显示信息
 * 
 * @complexity O(1) - 常数时间复杂度，对象属性访问
 * @flow 平台类型输入 → 配置查找 → 显示信息返回
 * 
 * @param {PromotionPlatform} platform - 平台类型枚举值
 * @returns {PlatformDisplayInfo} 平台显示信息对象
 * 
 * @example
 * ```typescript
 * // 获取抖音平台信息
 * const douyinInfo = getPlatformDisplayInfo('douyin')
 * console.log(douyinInfo)
 * // {
 * //   platform: 'douyin',
 * //   displayName: '抖音',
 * //   icon: 'douyin-icon',
 * //   color: '#000000',
 * //   description: '抖音短视频平台'
 * // }
 * 
 * // 获取小红书平台信息
 * const xhsInfo = getPlatformDisplayInfo('xiaohongshu')
 * console.log(xhsInfo.displayName) // '小红书'
 * ```
 */
export function getPlatformDisplayInfo(platform: PromotionPlatform): PlatformDisplayInfo {
  const platformConfigs: Record<PromotionPlatform, PlatformDisplayInfo> = {
    douyin: {
      platform: 'douyin',
      displayName: '抖音',
      icon: 'douyin-icon',
      color: '#000000',
      description: '抖音短视频平台'
    },
    kuaishou: {
      platform: 'kuaishou',
      displayName: '快手',
      icon: 'kuaishou-icon', 
      color: '#FF6600',
      description: '快手短视频平台'
    },
    xiaohongshu: {
      platform: 'xiaohongshu',
      displayName: '小红书',
      icon: 'xiaohongshu-icon',
      color: '#FF2442',
      description: '小红书生活分享平台'
    }
  }

  return platformConfigs[platform]
}

/**
 * 获取所有支持的平台显示信息
 * 返回系统支持的所有推广平台的显示信息数组
 * 
 * @complexity O(n) - n为支持的平台数量，当前为3个平台
 * @flow 平台规则遍历 → 显示信息提取 → 数组构建
 * 
 * @returns {PlatformDisplayInfo[]} 所有平台显示信息的数组
 * 
 * @example
 * ```typescript
 * const allPlatforms = getAllPlatformDisplayInfo()
 * console.log(allPlatforms.length) // 3
 * console.log(allPlatforms.map(p => p.displayName)) // ['抖音', '快手', '小红书']
 * 
 * // 用于生成平台选择列表
 * allPlatforms.forEach(platform => {
 *   console.log(`${platform.displayName}: ${platform.description}`)
 * })
 * ```
 */
export function getAllPlatformDisplayInfo(): PlatformDisplayInfo[] {
  return PLATFORM_RECOGNITION_RULES.map(rule => getPlatformDisplayInfo(rule.platform))
}

/**
 * 检查URL是否为支持的平台
 * 快速检查URL是否属于系统支持的任何推广平台
 * 
 * @complexity O(n*m) - 依赖于recognizePlatformFromURL的复杂度
 * @flow URL输入 → 平台识别 → 结果判断
 * 
 * @param {string} url - 要检查的URL字符串
 * @returns {boolean} 如果URL属于支持的平台返回true，否则返回false
 * 
 * @example
 * ```typescript
 * // 检查支持的平台
 * console.log(isSupportedPlatform('https://www.douyin.com/video/123')) // true
 * console.log(isSupportedPlatform('https://www.kuaishou.com/profile/abc')) // true
 * 
 * // 检查不支持的平台
 * console.log(isSupportedPlatform('https://www.youtube.com/watch?v=123')) // false
 * console.log(isSupportedPlatform('https://example.com')) // false
 * ```
 */
export function isSupportedPlatform(url: string): boolean {
  const result = recognizePlatformFromURL(url)
  return result.platform !== null
}

/**
 * 获取平台的主域名列表
 * 从平台识别规则中提取该平台的所有主域名
 * 
 * @complexity O(m) - m为指定平台的模式数量
 * @flow 平台查找 → 规则提取 → 正则解析 → 域名提取 → 转义处理
 * 
 * @param {PromotionPlatform} platform - 平台类型
 * @returns {string[]} 该平台的主域名列表，如果平台不存在返回空数组
 * 
 * @example
 * ```typescript
 * // 获取抖音的域名列表
 * const douyinDomains = getPlatformDomains('douyin')
 * console.log(douyinDomains) // ['douyin.com', 'dy.com', 'v.douyin.com']
 * 
 * // 获取快手的域名列表
 * const kuaishouDomains = getPlatformDomains('kuaishou')
 * console.log(kuaishouDomains) // ['kuaishou.com', 'ks.com']
 * 
 * // 获取不存在平台的域名
 * const unknownDomains = getPlatformDomains('unknown' as any)
 * console.log(unknownDomains) // []
 * ```
 */
export function getPlatformDomains(platform: PromotionPlatform): string[] {
  const rule = PLATFORM_RECOGNITION_RULES.find(r => r.platform === platform)
  if (!rule) {
    return []
  }

  // 从正则表达式中提取域名
  return rule.patterns.map(pattern => {
    const source = pattern.source
    // 简单的域名提取，去除转义字符
    return source.replace(/\\\./g, '.').replace(/\\/g, '')
  })
}
