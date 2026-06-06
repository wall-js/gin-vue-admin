import { centerGet, centerPost, centerPut, centerDelete } from './centerClient'

// 租户列表
export const listTenants = (params) => centerGet('/tenants', params)

// 获取租户详情
export const getTenant = (id) => centerGet(`/tenants/${id}`)

// 创建租户
export const createTenant = (data) => centerPost('/tenants', data)

// 更新租户
export const updateTenant = (id, data) => centerPut(`/tenants/${id}`, data)

// 删除租户
export const deleteTenant = (id) => centerDelete(`/tenants/${id}`)
