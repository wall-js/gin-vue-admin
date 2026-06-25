import { coreGet, corePost } from '../../utils/apiClient'

// 文件列表（分页+搜索+分类过滤）
export const getFileList = (data) => corePost('/fileUploadAndDownload/getFileList', data)

// 删除文件
export const deleteFile = (data) => corePost('/fileUploadAndDownload/deleteFile', data)

// 编辑文件名
export const editFileName = (data) => corePost('/fileUploadAndDownload/editFileName', data)

// 导入URL
export const importURL = (data) => corePost('/fileUploadAndDownload/importURL', data)

// 分类列表
export const getCategoryList = () => coreGet('/attachmentCategory/getCategoryList')

// 添加/编辑分类
export const addCategory = (data) => corePost('/attachmentCategory/addCategory', data)

// 删除分类
export const deleteCategory = (data) => corePost('/attachmentCategory/deleteCategory', data)
