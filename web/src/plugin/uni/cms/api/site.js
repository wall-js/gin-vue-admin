import { cmsGet, cmsPut, cmsPost, cmsDelete } from '../../utils/apiClient'

// 获取站点列表
export const listSites = () => cmsGet('/sites')

// 创建站点
export const createSite = (data) => cmsPost('/sites', data)

// 获取站点配置
export const getSite = () => cmsGet('/site')

// 更新站点配置
export const updateSite = (data) => cmsPut('/site', data)

// 生成演示数据
export const createDemoData = () => cmsPost('/site/demodata')

// 获取证书信息
export const getCert = () => cmsGet('/site/cert')

// 上传证书
export const uploadCert = (data) => cmsPost('/site/cert', data)

// 清除证书
export const clearCert = () => cmsDelete('/site/cert')
