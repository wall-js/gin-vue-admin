import { cmsGet, cmsPut, cmsPost } from './cmsClient'

// 获取站点列表
export const listSites = () => cmsGet('/sites')

// 获取站点配置
export const getSite = () => cmsGet('/site')

// 更新站点配置
export const updateSite = (data) => cmsPut('/site', data)

// 生成演示数据
export const createDemoData = () => cmsPost('/site/demodata')
