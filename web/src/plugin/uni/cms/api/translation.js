import { coreGet, corePost } from '../../utils/apiClient'

// 提取待翻译片段
export const extractTranslations = (params) => coreGet('/ai/translations/extract', params)

// 应用翻译结果
export const applyTranslations = (data) => corePost('/ai/translations/apply', data)

// AI 一键翻译实体（异步，立即返回 taskId）
export const translateEntity = (data) => corePost('/ai/translations/translate', data)

// 查询翻译任务状态
export const translateTaskStatus = (taskId) => coreGet('/ai/translations/translate/status', { taskId })
