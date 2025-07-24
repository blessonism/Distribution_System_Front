/**
 * 平台识别工具函数
 * 提供URL平台识别、验证和显示信息获取功能
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
 * @param url - 要验证的URL
 * @returns 验证结果
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
 * @param url - 要识别的URL
 * @returns 识别结果
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
 * @param url - URL字符串
 * @param pattern - 正则表达式模式
 * @returns 置信度 (0-1)
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
 * @param platform - 平台类型
 * @returns 平台显示信息
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
 * @returns 所有平台的显示信息数组
 */
export function getAllPlatformDisplayInfo(): PlatformDisplayInfo[] {
  return PLATFORM_RECOGNITION_RULES.map(rule => getPlatformDisplayInfo(rule.platform))
}

/**
 * 检查URL是否为支持的平台
 * @param url - 要检查的URL
 * @returns 是否为支持的平台
 */
export function isSupportedPlatform(url: string): boolean {
  const result = recognizePlatformFromURL(url)
  return result.platform !== null
}

/**
 * 获取平台的主域名列表
 * @param platform - 平台类型
 * @returns 主域名列表
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
