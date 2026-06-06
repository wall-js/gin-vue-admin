import axios from 'axios'
import { useUserStore } from '@/pinia/modules/user'
import { ElMessage } from 'element-plus'

// Center 运营中心专用 axios 实例
// Gateway 统一代理，baseURL 指向 /api/v1/center
// Center go-zero 返回纯 JSON body，需包装为 GVA 标准格式 {code:0, data, msg}
const centerService = axios.create({
  baseURL: '/api/v1/center',
  timeout: 30000
})

// 请求拦截：注入 x-token（与 GVA 共用同一 token）
centerService.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    config.headers = {
      'Content-Type': 'application/json',
      'x-token': userStore.token,
      ...config.headers
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截：包装为 GVA 标准格式 {code:0, data, msg}
centerService.interceptors.response.use(
  (response) => {
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
export const centerGet = (path, params) => {
  return centerService({ url: path, method: 'get', params })
}

export const centerPost = (path, data) => {
  return centerService({ url: path, method: 'post', data })
}

export const centerPut = (path, data) => {
  return centerService({ url: path, method: 'put', data })
}

export const centerDelete = (path, params) => {
  return centerService({ url: path, method: 'delete', params })
}

export default centerService
