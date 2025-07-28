/**
 * @fileoverview 来源识别工具模块
 * 提供客资来源自动识别和分析功能，包含UTM参数解析、引荐页面分析、用户代理检测和推荐码解析
 * 包含多种检测方法的综合引擎，支持智能匹配、置信度评估和备选方案推荐
 * 适用于市场投放效果追踪、用户来源分析和推广渠道评估等业务场景
 * 
 * @module utils/sourceDetection
 * @author Frontend Team
 * @since 1.0.0
 */

import type { 
  UTMParams, 
  SourceDetectionResult, 
  SourceDetectionMethod,
  PredefinedSource,
  SourceDetectionRule
} from '@/types/lead'

/**
 * UTM参数解析器
 * 提供完整的UTM参数解析、验证和分析功能
 * 
 * @class UTMParser
 * @example
 * ```typescript
 * // 从URL解析UTM参数
 * const utmParams = UTMParser.parseFromURL('https://example.com?utm_source=google&utm_medium=cpc')
 * console.log(utmParams) // { utmSource: 'google', utmMedium: 'cpc', ... }
 * 
 * // 验证UTM参数完整性
 * const validation = UTMParser.validateUTMParams(utmParams)
 * console.log(validation.isValid) // true/false
 * ```
 */
export class UTMParser {
  /**
   * 从URL中解析UTM参数
   * 从URL查询参数中提取所有UTM相关参数
   * 
   * @complexity O(1) - 常数时间复杂度，URL解析和参数提取
   * @flow URL解析 → 查询参数提取 → UTM对象构建
   * 
   * @param {string} url - 要解析的URL字符串
   * @returns {UTMParams} UTM参数对象
   * 
   * @example
   * ```typescript
   * const params = UTMParser.parseFromURL(
   *   'https://example.com?utm_source=google&utm_medium=cpc&utm_campaign=summer'
   * )
   * console.log(params)
   * // {
   * //   utmSource: 'google',
   * //   utmMedium: 'cpc',
   * //   utmCampaign: 'summer',
   * //   utmTerm: undefined,
   * //   utmContent: undefined
   * // }
   * ```
   */
  static parseFromURL(url: string): UTMParams {
    try {
      const urlObj = new URL(url)
      const params = urlObj.searchParams
      
      return {
        utmSource: params.get('utm_source') || undefined,
        utmMedium: params.get('utm_medium') || undefined,
        utmCampaign: params.get('utm_campaign') || undefined,
        utmTerm: params.get('utm_term') || undefined,
        utmContent: params.get('utm_content') || undefined
      }
    } catch (error) {
      console.warn('URL解析失败:', error)
      return {}
    }
  }
  
  /**
   * 从当前页面URL解析UTM参数
   * 从浏览器当前页面URL中获取UTM参数
   * 
   * @complexity O(1) - 常数时间复杂度，依赖于window.location和parseFromURL
   * @flow 环境检查 → 当前URL获取 → UTM解析
   * 
   * @returns {UTMParams} UTM参数对象，如果不在浏览器环境返回空对象
   * 
   * @example
   * ```typescript
   * // 在浏览器环境中调用
   * const currentParams = UTMParser.parseFromCurrentURL()
   * if (currentParams.utmSource) {
   *   console.log('检测到UTM来源:', currentParams.utmSource)
   * }
   * ```
   */
  static parseFromCurrentURL(): UTMParams {
    if (typeof window === 'undefined') {
      return {}
    }
    
    return this.parseFromURL(window.location.href)
  }
  
  /**
   * 从引荐页面URL解析UTM参数
   * 从浏览器引荐页面URL中获取UTM参数
   * 
   * @complexity O(1) - 常数时间复杂度，依赖于document.referrer和parseFromURL
   * @flow 环境检查 → referrer获取 → UTM解析
   * 
   * @returns {UTMParams} UTM参数对象，如果没有referrer返回空对象
   * 
   * @example
   * ```typescript
   * const referrerParams = UTMParser.parseFromReferrer()
   * if (Object.keys(referrerParams).length > 0) {
   *   console.log('从引荐页面检测到UTM参数:', referrerParams)
   * }
   * ```
   */
  static parseFromReferrer(): UTMParams {
    if (typeof window === 'undefined' || !document.referrer) {
      return {}
    }
    
    return this.parseFromURL(document.referrer)
  }
  
  /**
   * 验证UTM参数的完整性
   * 检查UTM参数的完整性和有效性，评估参数质量
   * 
   * @complexity O(1) - 常数时间复杂度，固定参数数量检查
   * @flow 必需参数检查 → 可选参数检查 → 完整性计算 → 结果返回
   * 
   * @param {UTMParams} params - 要验证的UTM参数对象
   * @returns {object} 验证结果，包含有效性、完整度和缺失参数
   * 
   * @example
   * ```typescript
   * const params = { utmSource: 'google', utmMedium: 'cpc' }
   * const validation = UTMParser.validateUTMParams(params)
   * 
   * console.log(validation.isValid) // false（缺少utmCampaign）
   * console.log(validation.completeness) // 0.4（2/5）
   * console.log(validation.missingParams) // ['utmCampaign']
   * ```
   */
  static validateUTMParams(params: UTMParams): {
    isValid: boolean
    completeness: number // 0-1，参数完整度
    missingParams: string[]
  } {
    const requiredParams = ['utmSource', 'utmMedium', 'utmCampaign']
    const optionalParams = ['utmTerm', 'utmContent']
    const allParams = [...requiredParams, ...optionalParams]
    
    const presentParams = allParams.filter(param => params[param as keyof UTMParams])
    const missingRequired = requiredParams.filter(param => !params[param as keyof UTMParams])
    
    return {
      isValid: missingRequired.length === 0,
      completeness: presentParams.length / allParams.length,
      missingParams: missingRequired
    }
  }
}

/**
 * 引荐页面分析器
 * 分析引荐页面URL，识别来源平台和流量类型
 * 
 * @class ReferrerAnalyzer
 * @example
 * ```typescript
 * const analysis = ReferrerAnalyzer.analyzeReferrer('https://www.google.com/search?q=example')
 * console.log(analysis.source) // PredefinedSource.GOOGLE
 * console.log(analysis.isSearchEngine) // true
 * console.log(analysis.confidence) // 0.9
 * ```
 */
export class ReferrerAnalyzer {
  /**
   * 获取预定义的引荐域名映射
   * 返回域名到预定义来源的映射关系表
   * 
   * @complexity O(1) - 常数时间复杂度，返回静态对象
   * @flow 映射表创建 → 结果返回
   * 
   * @returns {Record<string, PredefinedSource>} 域名到来源的映射关系
   * 
   * @private
   * @example
   * ```typescript
   * const mapping = ReferrerAnalyzer.getDomainMapping()
   * console.log(mapping['google.com']) // PredefinedSource.GOOGLE
   * console.log(mapping['weixin.qq.com']) // PredefinedSource.WECHAT
   * ```
   */
  private static getDomainMapping(): Record<string, PredefinedSource> {
    return {
      'google.com': PredefinedSource.GOOGLE,
      'google.cn': PredefinedSource.GOOGLE,
      'baidu.com': PredefinedSource.BAIDU,
      'bing.com': PredefinedSource.BING,
      'weixin.qq.com': PredefinedSource.WECHAT,
      'xiaohongshu.com': PredefinedSource.XIAOHONGSHU,
      'xhs.com': PredefinedSource.XIAOHONGSHU,
      'weibo.com': PredefinedSource.WEIBO,
      'douyin.com': PredefinedSource.DOUYIN,
      'kuaishou.com': PredefinedSource.KUAISHOU,
      'tiktok.com': PredefinedSource.DOUYIN
    }
  }
  
  /**
   * 分析引荐页面
   * 全面分析引荐页面URL，识别来源、类型和置信度
   * 
   * @complexity O(1) - 常数时间复杂度，URL解析和域名匹配
   * @flow URL解析 → 域名提取 → 直接匹配 → 模糊匹配 → 结果构建
   * 
   * @param {string} referrer - 引荐页面URL
   * @returns {object} 引荐页面分析结果
   * 
   * @example
   * ```typescript
   * const analysis = ReferrerAnalyzer.analyzeReferrer('https://www.baidu.com/s?wd=test')
   * console.log(analysis)
   * // {
   * //   domain: 'baidu.com',
   * //   source: PredefinedSource.BAIDU,
   * //   confidence: 0.9,
   * //   isSearchEngine: true,
   * //   isSocialMedia: false,
   * //   isAd: false
   * // }
   * ```
   */
  static analyzeReferrer(referrer: string): {
    domain: string
    source: PredefinedSource
    confidence: number
    isSearchEngine: boolean
    isSocialMedia: boolean
    isAd: boolean
  } {
    if (!referrer) {
      return {
        domain: '',
        source: PredefinedSource.DIRECT,
        confidence: 1.0,
        isSearchEngine: false,
        isSocialMedia: false,
        isAd: false
      }
    }
    
    try {
      const url = new URL(referrer)
      const domain = url.hostname.replace(/^www\./, '')
      
      // 直接域名匹配
      const domainMapping = this.getDomainMapping()
      const mappedSource = domainMapping[domain]
      if (mappedSource) {
        return {
          domain,
          source: mappedSource,
          confidence: 0.9,
          isSearchEngine: this.isSearchEngine(domain),
          isSocialMedia: this.isSocialMedia(domain),
          isAd: this.isAdTraffic(url)
        }
      }
      
      // 模糊匹配
      const fuzzyMatch = this.fuzzyMatchDomain(domain)
      if (fuzzyMatch) {
        return {
          domain,
          source: fuzzyMatch.source,
          confidence: fuzzyMatch.confidence,
          isSearchEngine: this.isSearchEngine(domain),
          isSocialMedia: this.isSocialMedia(domain),
          isAd: this.isAdTraffic(url)
        }
      }
      
      // 默认分类
      return {
        domain,
        source: PredefinedSource.OTHER,
        confidence: 0.3,
        isSearchEngine: this.isSearchEngine(domain),
        isSocialMedia: this.isSocialMedia(domain),
        isAd: this.isAdTraffic(url)
      }
    } catch (error) {
      console.warn('引荐页面分析失败:', error)
      return {
        domain: '',
        source: PredefinedSource.UNKNOWN,
        confidence: 0.1,
        isSearchEngine: false,
        isSocialMedia: false,
        isAd: false
      }
    }
  }
  
  /**
   * 判断是否为搜索引擎
   */
  private static isSearchEngine(domain: string): boolean {
    const searchEngines = ['google', 'baidu', 'bing', 'yahoo', 'sogou', '360', 'yandex']
    return searchEngines.some(engine => domain.includes(engine))
  }
  
  /**
   * 判断是否为社交媒体
   */
  private static isSocialMedia(domain: string): boolean {
    const socialPlatforms = ['weixin', 'xiaohongshu', 'weibo', 'douyin', 'kuaishou', 'tiktok', 'facebook', 'twitter', 'instagram']
    return socialPlatforms.some(platform => domain.includes(platform))
  }
  
  /**
   * 判断是否为广告流量
   */
  private static isAdTraffic(url: URL): boolean {
    const adParams = ['gclid', 'fbclid', 'utm_medium=cpc', 'utm_medium=paid']
    const urlString = url.href.toLowerCase()
    return adParams.some(param => urlString.includes(param))
  }
  
  /**
   * 模糊匹配域名
   */
  private static fuzzyMatchDomain(domain: string): {
    source: PredefinedSource
    confidence: number
  } | null {
    const fuzzyRules = [
      { keywords: ['google'], source: PredefinedSource.GOOGLE, confidence: 0.8 },
      { keywords: ['baidu'], source: PredefinedSource.BAIDU, confidence: 0.8 },
      { keywords: ['weixin', 'wechat'], source: PredefinedSource.WECHAT, confidence: 0.8 },
      { keywords: ['xiaohongshu', 'xhs'], source: PredefinedSource.XIAOHONGSHU, confidence: 0.8 },
      { keywords: ['weibo'], source: PredefinedSource.WEIBO, confidence: 0.8 },
      { keywords: ['douyin', 'tiktok'], source: PredefinedSource.DOUYIN, confidence: 0.8 },
      { keywords: ['kuaishou'], source: PredefinedSource.KUAISHOU, confidence: 0.8 }
    ]
    
    for (const rule of fuzzyRules) {
      if (rule.keywords.some(keyword => domain.includes(keyword))) {
        return {
          source: rule.source,
          confidence: rule.confidence
        }
      }
    }
    
    return null
  }
}

/**
 * 用户代理分析器
 * 分析用户代理字符串，识别平台、浏览器和特殊环境
 * 
 * @class UserAgentAnalyzer
 * @example
 * ```typescript
 * const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
 * const analysis = UserAgentAnalyzer.analyzeUserAgent(ua)
 * console.log(analysis.platform) // 'mobile'
 * console.log(analysis.os) // 'iOS'
 * ```
 */
export class UserAgentAnalyzer {
  /**
   * 分析用户代理字符串
   * 全面分析用户代理信息，识别平台、浏览器、操作系统和特殊环境
   * 
   * @complexity O(1) - 常数时间复杂度，固定的字符串匹配操作
   * @flow 字符串预处理 → 平台检测 → 浏览器检测 → 系统检测 → 特殊环境检测
   * 
   * @param {string} userAgent - 用户代理字符串
   * @returns {object} 用户代理分析结果
   * 
   * @example
   * ```typescript
   * const ua = 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
   * const analysis = UserAgentAnalyzer.analyzeUserAgent(ua)
   * console.log(analysis)
   * // {
   * //   platform: 'mobile',
   * //   browser: 'Chrome',
   * //   os: 'Android',
   * //   isWeChat: false,
   * //   isApp: false,
   * //   confidence: 0.8
   * // }
   * ```
   */
  static analyzeUserAgent(userAgent: string): {
    platform: 'mobile' | 'desktop' | 'tablet' | 'unknown'
    browser: string
    os: string
    isWeChat: boolean
    isApp: boolean
    confidence: number
  } {
    if (!userAgent) {
      return {
        platform: 'unknown',
        browser: 'unknown',
        os: 'unknown',
        isWeChat: false,
        isApp: false,
        confidence: 0
      }
    }
    
    const ua = userAgent.toLowerCase()
    
    return {
      platform: this.detectPlatform(ua),
      browser: this.detectBrowser(ua),
      os: this.detectOS(ua),
      isWeChat: ua.includes('micromessenger'),
      isApp: this.isAppEnvironment(ua),
      confidence: 0.8
    }
  }
  
  /**
   * 检测平台类型
   */
  private static detectPlatform(ua: string): 'mobile' | 'desktop' | 'tablet' | 'unknown' {
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile'
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet'
    }
    if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
      return 'desktop'
    }
    return 'unknown'
  }
  
  /**
   * 检测浏览器
   */
  private static detectBrowser(ua: string): string {
    if (ua.includes('chrome')) return 'Chrome'
    if (ua.includes('firefox')) return 'Firefox'
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari'
    if (ua.includes('edge')) return 'Edge'
    if (ua.includes('opera')) return 'Opera'
    if (ua.includes('micromessenger')) return 'WeChat'
    return 'Unknown'
  }
  
  /**
   * 检测操作系统
   */
  private static detectOS(ua: string): string {
    if (ua.includes('windows')) return 'Windows'
    if (ua.includes('macintosh') || ua.includes('mac os')) return 'macOS'
    if (ua.includes('linux')) return 'Linux'
    if (ua.includes('android')) return 'Android'
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) return 'iOS'
    return 'Unknown'
  }
  
  /**
   * 判断是否为App环境
   */
  private static isAppEnvironment(ua: string): boolean {
    const appIndicators = ['app', 'native', 'webview', 'hybrid']
    return appIndicators.some(indicator => ua.includes(indicator))
  }
}

/**
 * 推荐码分析器
 * 分析推荐码格式，识别码类型、级别和地区信息
 * 
 * @class ReferralCodeAnalyzer
 * @example
 * ```typescript
 * const analysis = ReferralCodeAnalyzer.analyzeReferralCode('AG12345')
 * console.log(analysis.type) // 'agent'
 * console.log(analysis.confidence) // 0.9
 * 
 * const promoAnalysis = ReferralCodeAnalyzer.analyzeReferralCode('PROMO2024')
 * console.log(promoAnalysis.type) // 'promotion'
 * ```
 */
export class ReferralCodeAnalyzer {
  /**
   * 分析推荐码格式
   * 基于预定义的正则模式分析推荐码的类型、级别和地区
   * 
   * @complexity O(1) - 常数时间复杂度，固定数量的正则匹配
   * @flow 输入验证 → 大小写转换 → 正则匹配 → 类型识别 → 结果构建
   * 
   * @param {string} code - 要分析的推荐码
   * @returns {object} 推荐码分析结果
   * 
   * @example
   * ```typescript
   * // 代理推荐码
   * const agentCode = ReferralCodeAnalyzer.analyzeReferralCode('AG12345')
   * console.log(agentCode) // { type: 'agent', confidence: 0.9 }
   * 
   * // 员工推荐码
   * const empCode = ReferralCodeAnalyzer.analyzeReferralCode('EMP999')
   * console.log(empCode) // { type: 'employee', confidence: 0.9 }
   * 
   * // 地区代理码
   * const regionCode = ReferralCodeAnalyzer.analyzeReferralCode('BJ12345')
   * console.log(regionCode) // { type: 'agent', region: 'BJ', confidence: 0.7 }
   * ```
   */
  static analyzeReferralCode(code: string): {
    type: 'agent' | 'employee' | 'customer' | 'promotion' | 'unknown'
    level?: string
    region?: string
    confidence: number
  } {
    if (!code) {
      return {
        type: 'unknown',
        confidence: 0
      }
    }
    
    const upperCode = code.toUpperCase()
    
    // 代理推荐码模式：AG + 数字
    if (/^AG\d+$/.test(upperCode)) {
      return {
        type: 'agent',
        confidence: 0.9
      }
    }
    
    // 员工推荐码模式：EMP + 数字
    if (/^EMP\d+$/.test(upperCode)) {
      return {
        type: 'employee',
        confidence: 0.9
      }
    }
    
    // 客户推荐码模式：CUS + 数字
    if (/^CUS\d+$/.test(upperCode)) {
      return {
        type: 'customer',
        confidence: 0.9
      }
    }
    
    // 促销推荐码模式：PROMO + 字符
    if (/^PROMO/.test(upperCode)) {
      return {
        type: 'promotion',
        confidence: 0.8
      }
    }
    
    // 地区代码分析
    const regionMatch = upperCode.match(/^([A-Z]{2,3})\d+$/)
    if (regionMatch) {
      return {
        type: 'agent',
        region: regionMatch[1],
        confidence: 0.7
      }
    }
    
    return {
      type: 'unknown',
      confidence: 0.3
    }
  }
}

/**
 * 来源检测引擎
 * 综合多种检测方法，提供智能的来源识别和置信度评估
 * 
 * @class SourceDetectionEngine
 * @example
 * ```typescript
 * const result = SourceDetectionEngine.detectSource({
 *   referrer: 'https://www.google.com/search?q=example',
 *   utmParams: { utmSource: 'google', utmMedium: 'cpc' },
 *   userAgent: navigator.userAgent,
 *   referralCode: 'AG12345'
 * })
 * 
 * console.log(result.suggestedSource) // PredefinedSource.GOOGLE
 * console.log(result.confidence) // 0.9
 * console.log(result.detectionMethod) // 'utm'
 * ```
 */
export class SourceDetectionEngine {
  /**
   * 综合来源检测
   * 综合多种检测方法，选择最高置信度的结果作为主推荐，并提供备选方案
   * 
   * @complexity O(n) - n为可用检测方法数量，最多4种方法
   * @flow 输入验证 → 多方法检测 → 置信度比较 → 最优结果选择 → 备选方案生成
   * 
   * @param {object} data - 检测数据对象
   * @param {string} data.referrer - 引荐页面URL
   * @param {UTMParams} data.utmParams - UTM参数
   * @param {string} data.userAgent - 用户代理字符串
   * @param {string} data.referralCode - 推荐码
   * @param {string} data.currentURL - 当前URL
   * @returns {SourceDetectionResult} 来源检测结果
   * 
   * @example
   * ```typescript
   * const detectionResult = SourceDetectionEngine.detectSource({
   *   referrer: 'https://www.xiaohongshu.com/explore',
   *   utmParams: {
   *     utmSource: 'xiaohongshu',
   *     utmMedium: 'social',
   *     utmCampaign: 'brand_awareness'
   *   },
   *   userAgent: navigator.userAgent,
   *   referralCode: undefined
   * })
   * 
   * console.log(detectionResult)
   * // {
   * //   suggestedSource: PredefinedSource.XIAOHONGSHU,
   * //   sourceDetail: 'UTM来源: xiaohongshu, 媒介: social',
   * //   confidence: 0.9,
   * //   detectionMethod: 'utm',
   * //   alternatives: [...],
   * //   detectedAt: '2024-01-01T12:00:00.000Z'
   * // }
   * ```
   */
  static detectSource(data: {
    referrer?: string
    utmParams?: UTMParams
    userAgent?: string
    referralCode?: string
    currentURL?: string
  }): SourceDetectionResult {
    const detectionMethods: {
      method: SourceDetectionMethod
      result: Partial<SourceDetectionResult>
      confidence: number
    }[] = []
    
    // UTM参数检测
    if (data.utmParams && Object.keys(data.utmParams).length > 0) {
      const utmResult = this.detectFromUTM(data.utmParams)
      detectionMethods.push({
        method: 'utm',
        result: utmResult,
        confidence: utmResult.confidence
      })
    }
    
    // 引荐页面检测
    if (data.referrer) {
      const referrerResult = this.detectFromReferrer(data.referrer)
      detectionMethods.push({
        method: 'referrer',
        result: referrerResult,
        confidence: referrerResult.confidence
      })
    }
    
    // 用户代理检测
    if (data.userAgent) {
      const uaResult = this.detectFromUserAgent(data.userAgent)
      detectionMethods.push({
        method: 'user_agent',
        result: uaResult,
        confidence: uaResult.confidence
      })
    }
    
    // 推荐码检测
    if (data.referralCode) {
      const codeResult = this.detectFromReferralCode(data.referralCode)
      detectionMethods.push({
        method: 'referral_code',
        result: codeResult,
        confidence: codeResult.confidence
      })
    }
    
    // 选择最高置信度的结果
    const bestMethod = detectionMethods.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    , { method: 'default' as SourceDetectionMethod, result: {}, confidence: 0 })
    
    // 生成备选方案
    const alternatives = detectionMethods
      .filter(m => m.method !== bestMethod.method && m.confidence > 0.5)
      .map(m => ({
        source: m.result.suggestedSource || PredefinedSource.OTHER,
        confidence: m.confidence,
        reason: `基于${m.method}检测`
      }))
    
    return {
      suggestedSource: bestMethod.result.suggestedSource || PredefinedSource.UNKNOWN,
      sourceDetail: bestMethod.result.sourceDetail || '自动检测',
      confidence: bestMethod.confidence,
      detectionMethod: bestMethod.method,
      utmParams: data.utmParams,
      referrer: data.referrer,
      userAgent: data.userAgent,
      referralCode: data.referralCode,
      matchedRules: [],
      alternatives,
      detectedAt: new Date().toISOString()
    }
  }
  
  /**
   * 基于UTM参数检测来源
   * 从结构化的UTM参数中推断来源平台和流量类型
   * 
   * @complexity O(1) - 常数时间复杂度，映射表查找和条件判断
   * @flow UTM参数验证 → 来源映射 → 媒介调整 → 结果构建
   * 
   * @param {UTMParams} utmParams - UTM参数对象
   * @returns {Partial<SourceDetectionResult>} 部分来源检测结果
   * 
   * @private
   * @example
   * ```typescript
   * const utmResult = this.detectFromUTM({
   *   utmSource: 'google',
   *   utmMedium: 'cpc',
   *   utmCampaign: 'brand'
   * })
   * console.log(utmResult)
   * // {
   * //   suggestedSource: PredefinedSource.GOOGLE_ADS,
   * //   sourceDetail: 'UTM来源: google, 媒介: cpc',
   * //   confidence: 0.9
   * // }
   * ```
   */
  private static detectFromUTM(utmParams: UTMParams): Partial<SourceDetectionResult> {
    const { utmSource, utmMedium } = utmParams
    
    if (!utmSource) {
      return {
        suggestedSource: PredefinedSource.UNKNOWN,
        sourceDetail: 'UTM参数不完整',
        confidence: 0.2
      }
    }
    
    // 来源映射
    const sourceMapping: Record<string, PredefinedSource> = {
      'google': PredefinedSource.GOOGLE,
      'baidu': PredefinedSource.BAIDU,
      'wechat': PredefinedSource.WECHAT,
      'xiaohongshu': PredefinedSource.XIAOHONGSHU,
      'weibo': PredefinedSource.WEIBO,
      'douyin': PredefinedSource.DOUYIN
    }
    
    const source = sourceMapping[utmSource.toLowerCase()] || PredefinedSource.OTHER
    
    // 根据medium调整来源
    let adjustedSource = source
    if (utmMedium === 'cpc' || utmMedium === 'paid') {
      // 付费广告
      if (source === PredefinedSource.GOOGLE) adjustedSource = PredefinedSource.GOOGLE_ADS
      if (source === PredefinedSource.WECHAT) adjustedSource = PredefinedSource.WECHAT_ADS
      if (source === PredefinedSource.XIAOHONGSHU) adjustedSource = PredefinedSource.XIAOHONGSHU_ADS
    }
    
    return {
      suggestedSource: adjustedSource,
      sourceDetail: `UTM来源: ${utmSource}${utmMedium ? `, 媒介: ${utmMedium}` : ''}`,
      confidence: 0.9
    }
  }
  
  /**
   * 基于引荐页面检测来源
   * 使用引荐页面分析器的结果进行来源推断
   * 
   * @complexity O(1) - 依赖于ReferrerAnalyzer.analyzeReferrer的复杂度
   * @flow 引荐页面分析 → 结果转换
   * 
   * @param {string} referrer - 引荐页面URL
   * @returns {Partial<SourceDetectionResult>} 部分来源检测结果
   * 
   * @private
   * @example
   * ```typescript
   * const referrerResult = this.detectFromReferrer('https://weibo.com/u/123456')
   * console.log(referrerResult)
   * // {
   * //   suggestedSource: PredefinedSource.WEIBO,
   * //   sourceDetail: '引荐域名: weibo.com',
   * //   confidence: 0.9
   * // }
   * ```
   */
  private static detectFromReferrer(referrer: string): Partial<SourceDetectionResult> {
    const analysis = ReferrerAnalyzer.analyzeReferrer(referrer)
    
    return {
      suggestedSource: analysis.source,
      sourceDetail: `引荐域名: ${analysis.domain}`,
      confidence: analysis.confidence
    }
  }
  
  /**
   * 基于用户代理检测来源
   * 从用户代理信息中推断可能的来源平台（如微信内置浏览器）
   * 
   * @complexity O(1) - 依赖于UserAgentAnalyzer.analyzeUserAgent的复杂度
   * @flow 用户代理分析 → 特殊环境检测 → 结果转换
   * 
   * @param {string} userAgent - 用户代理字符串
   * @returns {Partial<SourceDetectionResult>} 部分来源检测结果
   * 
   * @private
   * @example
   * ```typescript
   * const uaResult = this.detectFromUserAgent(
   *   'Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36 MicroMessenger/8.0.5'
   * )
   * console.log(uaResult)
   * // {
   * //   suggestedSource: PredefinedSource.WECHAT,
   * //   sourceDetail: '微信内置浏览器',
   * //   confidence: 0.8
   * // }
   * ```
   */
  private static detectFromUserAgent(userAgent: string): Partial<SourceDetectionResult> {
    const analysis = UserAgentAnalyzer.analyzeUserAgent(userAgent)
    
    if (analysis.isWeChat) {
      return {
        suggestedSource: PredefinedSource.WECHAT,
        sourceDetail: '微信内置浏览器',
        confidence: 0.8
      }
    }
    
    return {
      suggestedSource: PredefinedSource.UNKNOWN,
      sourceDetail: `${analysis.platform} ${analysis.browser}`,
      confidence: 0.3
    }
  }
  
  /**
   * 基于推荐码检测来源
   * 从推荐码类型推断来源渠道（如代理推荐、员工推荐等）
   * 
   * @complexity O(1) - 依赖于ReferralCodeAnalyzer.analyzeReferralCode的复杂度
   * @flow 推荐码分析 → 类型映射 → 结果转换
   * 
   * @param {string} code - 推荐码字符串
   * @returns {Partial<SourceDetectionResult>} 部分来源检测结果
   * 
   * @private
   * @example
   * ```typescript
   * const codeResult = this.detectFromReferralCode('AG12345')
   * console.log(codeResult)
   * // {
   * //   suggestedSource: PredefinedSource.AGENT_REFERRAL,
   * //   sourceDetail: '推荐码类型: agent',
   * //   confidence: 0.9
   * // }
   * ```
   */
  private static detectFromReferralCode(code: string): Partial<SourceDetectionResult> {
    const analysis = ReferralCodeAnalyzer.analyzeReferralCode(code)
    
    const sourceMapping = {
      'agent': PredefinedSource.AGENT_REFERRAL,
      'employee': PredefinedSource.EMPLOYEE_REFERRAL,
      'customer': PredefinedSource.REFERRAL,
      'promotion': PredefinedSource.OTHER
    }
    
    return {
      suggestedSource: sourceMapping[analysis.type] || PredefinedSource.OTHER,
      sourceDetail: `推荐码类型: ${analysis.type}`,
      confidence: analysis.confidence
    }
  }
}
