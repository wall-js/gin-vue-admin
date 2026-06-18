import axios from 'axios'
import { useUserStore } from '@/pinia/modules/user'
import { ElMessage } from 'element-plus'

// CMS 专用 axios 实例
// Gateway 统一代理，baseURL 指向 /api/v1/cms
// CMS go-zero 返回纯 JSON body，需包装为 GVA 标准格式 {code:0, data, msg}
const cmsService = axios.create({
  baseURL: '/api/v1/cms',
  timeout: 30000
})

// CMS 请求拦截：注入 x-token 和 X-Admin-Site-Id
// X-Admin-Site-Id 从 localStorage 读取，支持超管跨站点切换
// 网关会覆盖 X-Site-Id（域名解析结果），但不会识别 X-Admin-Site-Id
cmsService.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    const siteId = localStorage.getItem('cms_site_id')
    config.headers = {
      'Content-Type': 'application/json',
      'x-token': userStore.token,
      ...(siteId ? { 'X-Admin-Site-Id': siteId } : {}),
      ...config.headers
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截：包装为 GVA 标准格式 {code:0, data, msg}
cmsService.interceptors.response.use(
  (response) => {
    // CMS 返回纯 JSON body，包装为 GVA 格式
    return { code: 0, data: response.data, msg: '操作成功' }
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        const userStore = useUserStore()
        userStore.ClearStorage()
        window.location.reload()
        return { code: 401, data: null, msg: '登录已过期' }
      }
      const msg = error.response.data?.msg || error.response.data?.error || '请求失败'
      ElMessage.error(msg)
      return { code: status, data: null, msg }
    }
    ElMessage.error('网络错误')
    return { code: 500, data: null, msg: '网络错误' }
  }
)

// 便捷方法
export const cmsGet = (path, params) => {
  return cmsService({ url: path, method: 'get', params })
}

export const cmsPost = (path, data) => {
  return cmsService({ url: path, method: 'post', data })
}

export const cmsPut = (path, data) => {
  return cmsService({ url: path, method: 'put', data })
}

export const cmsDelete = (path, params) => {
  return cmsService({ url: path, method: 'delete', params })
}

export default cmsService
