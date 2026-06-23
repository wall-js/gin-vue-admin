import axios from 'axios'
import { useUserStore } from '@/pinia/modules/user'
import { emitter } from '@/utils/bus'
import router from '@/router/index'

/**
 * 创建 go-zero 微服务专用 axios 实例
 *
 * go-zero 后端已通过 SetOkHandler / SetErrorHandlerCtx 统一返回 GVA 标准格式：
 *  - 成功: {code: 0, data: ..., msg: "操作成功"}
 *  - 错误: {code: 400, msg: "..."}
 *
 * 前端拦截器职责与 GVA request.js 一致：
 *  - emitter('show-error') 统一错误通知
 *  - router.push Login 处理 401
 *  - new-token 响应头自动刷新 token
 *
 * @param {string} baseURL   服务前缀，如 '/api/v1/cms'
 * @param {object} [options]
 * @param {function} [options.getHeaders] 返回额外请求头的函数，每次请求时调用
 * @returns {{ instance, get, post, put, del }}
 */
function createApiClient(baseURL, options = {}) {
  const instance = axios.create({
    baseURL,
    timeout: 30000,
  })

  // ── 请求拦截：注入 token + 自定义头 ──
  instance.interceptors.request.use(
    (config) => {
      const userStore = useUserStore()
      const extra = options.getHeaders ? options.getHeaders() : {}
      config.headers = {
        'Content-Type': 'application/json',
        'x-token': userStore.token,
        'x-user-id': userStore.userInfo.ID,
        ...extra,
        ...config.headers,
      }
      return config
    },
    (error) => {
      emitter.emit('show-error', {
        code: 'request',
        message: error.message || '请求发送失败',
      })
      return Promise.reject(error)
    },
  )

  // ── 响应拦截：后端已返回 GVA 标准格式，直接透传 ──
  instance.interceptors.response.use(
    (response) => {
      const userStore = useUserStore()
      if (response.headers['new-token']) {
        userStore.setToken(response.headers['new-token'])
      }
      return response.data
    },
    (error) => {
      if (!error.response) {
        emitter.emit('show-error', {
          code: 'network',
          message: '网络错误',
        })
        return { code: 500, data: null, msg: '网络错误' }
      }

      const status = error.response.status
      const msg = getErrorMessage(error)

      // 401 → 清除登录态并跳转登录页（与 GVA 一致）
      if (status === 401) {
        emitter.emit('show-error', {
          code: '401',
          message: msg,
          fn: () => {
            const userStore = useUserStore()
            userStore.ClearStorage()
            router.push({ name: 'Login', replace: true })
          },
        })
        return { code: 401, data: null, msg: '登录已过期' }
      }

      emitter.emit('show-error', {
        code: status,
        message: msg,
      })
      return { code: status, data: null, msg }
    },
  )

  const get = (path, params) => instance({ url: path, method: 'get', params })
  const post = (path, data) => instance({ url: path, method: 'post', data })
  const put = (path, data) => instance({ url: path, method: 'put', data })
  const del = (path, params) => instance({ url: path, method: 'delete', params })

  return { instance, get, post, put, del }
}

/**
 * 从 go-zero 错误响应中提取错误信息
 * 兼容 JSON 对象（{msg}/{error}）和纯文本两种格式
 */
function getErrorMessage(error) {
  const data = error.response?.data
  if (typeof data === 'string' && data.trim()) {
    return data.trim()
  }
  if (data && typeof data === 'object') {
    return data.msg || data.error || '请求失败'
  }
  return '请求失败'
}

// ────────────────────────────────────────────────────
// CMS 服务
// X-Admin-Site-Id 从 localStorage 读取，支持超管跨站点切换
// 网关会覆盖 X-Site-Id（域名解析结果），但不会识别 X-Admin-Site-Id
// ────────────────────────────────────────────────────
const cms = createApiClient('/api/v1/cms', {
  getHeaders() {
    const siteId = localStorage.getItem('cms_site_id')
    return siteId ? { 'X-Admin-Site-Id': siteId } : {}
  },
})

export const cmsGet = cms.get
export const cmsPost = cms.post
export const cmsPut = cms.put
export const cmsDelete = cms.del

// ────────────────────────────────────────────────────
// Core 运营中心服务
// ────────────────────────────────────────────────────
const core = createApiClient('/api/v1/core')

export const coreGet = core.get
export const corePost = core.post
export const corePut = core.put
export const coreDelete = core.del
