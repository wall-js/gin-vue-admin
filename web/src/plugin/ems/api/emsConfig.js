/**
 * ems 模块前端的运行时配置入口（通用）。
 *
 * GET <VITE_BASE_API>/ems/config  →  { code:0, data:{ scada:{ base }, ... } }
 * 后端值来自 config.yaml 的 ems 段，按「域」分组下发；以后新增告警/报表/数字孪生
 * 等配置只需往 data 里加字段，前端接口地址不变。
 *
 * 因此 FUXA 地址【不写死在前端】：不硬编码、不读 VITE_SCADA_BASE、不在构建期注入。
 * VITE_BASE_API 只是 GVA 自身 API 前缀（默认 /api，Vite/nginx 会 rewrite 掉），与 FUXA 无关。
 *
 * 零外部依赖，浏览器与 Node 均可运行（便于单测）。
 */

const API_PREFIX = String(import.meta.env?.VITE_BASE_API || '/api').replace(/\/+$/, '')
export const EMS_CONFIG_URL = `${API_PREFIX}/ems/config`

/** 缓存的是整份配置的 Promise：多个模块取不同配置项也只发一次请求。 */
let pending = null

export class EmsConfigError extends Error {
  constructor(message, cause) {
    super(message)
    this.name = 'EmsConfigError'
    if (cause) this.cause = cause
  }
}

/** 强制下次重新拉取（配置接口报错后的「重试」按钮、测试用）。 */
export function resetEmsConfigCache() {
  pending = null
}

/**
 * 取整份 ems 前端配置，返回 Promise<object>（即响应的 data）。
 * @param {{force?: boolean, fetchImpl?: Function}} options
 */
export function getEmsConfig(options = {}) {
  const { force = false, fetchImpl } = options
  if (!force && pending) return pending

  const doFetch = fetchImpl || (typeof fetch === 'undefined' ? null : fetch)
  if (!doFetch) {
    return Promise.reject(new EmsConfigError('当前环境没有可用的 fetch 实现'))
  }

  const task = (async () => {
    let response
    try {
      response = await doFetch(EMS_CONFIG_URL, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin'
      })
    } catch (cause) {
      throw new EmsConfigError(`无法获取 ems 配置（${EMS_CONFIG_URL}）`, cause)
    }
    if (!response.ok) {
      throw new EmsConfigError(`ems 配置接口返回 HTTP ${response.status}`)
    }

    let payload
    try {
      payload = await response.json()
    } catch (cause) {
      throw new EmsConfigError('ems 配置接口返回内容不是 JSON', cause)
    }
    // GVA 标准响应：{ code: 0, data: {...}, msg: '成功' }；code!=0 为业务失败
    if (payload && typeof payload.code !== 'undefined' && payload.code !== 0) {
      throw new EmsConfigError(payload.msg || `ems 配置接口返回 code=${payload.code}`)
    }
    const data = payload?.data ?? payload
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new EmsConfigError('ems 配置接口未返回有效的 data 对象')
    }
    return data
  })()

  pending = task
  // 失败不缓存，下次调用可自动重试；成功则整份配置长期复用。
  task.catch(() => {
    if (pending === task) pending = null
  })
  return task
}

/**
 * 便捷方法：取 FUXA 独立服务根地址（无尾斜杠）。
 * 优先读 data.scada.base；兼容早期扁平的 data.base。
 */
export function getScadaBase(options = {}) {
  return getEmsConfig(options).then((cfg) => {
    const base = String(cfg?.scada?.base ?? cfg?.base ?? '').trim().replace(/\/+$/, '')
    if (!/^https?:\/\//i.test(base)) {
      throw new EmsConfigError('SCADA 地址无效：应为浏览器可访问的 http/https 绝对地址')
    }
    return base
  })
}

/**
 * 同步构造 FUXA 页面 URL。地址必须由 getScadaBase() 传入，本函数不读任何环境变量。
 * @param {string} base    FUXA 根地址
 * @param {string} path    '/home' | '/editor' | '/'
 * @param {object} params  query，例如 { viewName: '设备运转' }
 */
export function buildScadaUrl(base, path = '/', params = {}) {
  const clean = String(base || '').replace(/\/+$/, '')
  if (!clean) throw new EmsConfigError('SCADA 地址为空')
  const suffix = path.startsWith('/') ? path : `/${path}`
  let url
  try {
    url = new URL(`${clean}${suffix}`)
  } catch (cause) {
    throw new EmsConfigError(`SCADA 地址无法解析：${clean}`, cause)
  }
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}
