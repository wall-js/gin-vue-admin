import { coreGet, corePost, corePut, coreDelete } from '../../utils/apiClient'

// 租户列表
export const listTenants = (params) => coreGet('/tenants', params)

// 获取租户详情
export const getTenant = (id) => coreGet(`/tenants/${id}`)

// 创建租户
export const createTenant = (data) => corePost('/tenants', data)

// 更新租户
export const updateTenant = (id, data) => corePut(`/tenants/${id}`, data)

// 删除租户
export const deleteTenant = (id) => coreDelete(`/tenants/${id}`) 
