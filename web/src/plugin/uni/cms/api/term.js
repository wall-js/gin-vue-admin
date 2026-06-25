import { cmsGet, cmsPost, cmsPut, cmsDelete } from '../../utils/apiClient'

// 分类/标签列表
export const listTerms = (params) => cmsGet('/terms', params)

// 创建分类/标签
export const createTerm = (data) => cmsPost('/terms', data)

// 更新分类/标签
export const updateTerm = (id, data) => cmsPut(`/terms/${id}`, data)

// 删除分类/标签
export const deleteTerm = (id) => cmsDelete(`/terms/${id}`)

// 批量排序分类/标签
export const batchReorderTerms = (moves) => cmsPut('/terms/reorder', { moves })
