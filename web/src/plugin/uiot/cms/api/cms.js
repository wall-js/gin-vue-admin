import service from '@/utils/request'

// ==================== 页面管理 ====================

// 获取页面列表
export const getPageList = (params) => {
  return service({
    url: '/cms/pages',
    method: 'get',
    params
  })
}

// 创建页面
export const createPage = (data) => {
  return service({
    url: '/cms/pages',
    method: 'post',
    data
  })
}

// 获取页面详情
export const getPage = (params) => {
  return service({
    url: '/cms/pages',
    method: 'get',
    params
  })
}

// 更新页面
export const updatePage = (data) => {
  return service({
    url: '/cms/pages',
    method: 'put',
    data
  })
}

// 删除页面
export const deletePage = (params) => {
  return service({
    url: '/cms/pages',
    method: 'delete',
    params
  })
}

// 发布页面
export const publishPage = (data) => {
  return service({
    url: '/cms/pages/publish',
    method: 'post',
    data
  })
}

// 取消发布页面
export const unpublishPage = (data) => {
  return service({
    url: '/cms/pages/unpublish',
    method: 'post',
    data
  })
}

// ==================== 文章管理 ====================

// 获取文章列表
export const getPostList = (params) => {
  return service({
    url: '/cms/posts',
    method: 'get',
    params
  })
}

// 创建文章
export const createPost = (data) => {
  return service({
    url: '/cms/posts',
    method: 'post',
    data
  })
}

// 获取文章详情
export const getPost = (params) => {
  return service({
    url: '/cms/posts',
    method: 'get',
    params
  })
}

// 更新文章
export const updatePost = (data) => {
  return service({
    url: '/cms/posts',
    method: 'put',
    data
  })
}

// 删除文章
export const deletePost = (params) => {
  return service({
    url: '/cms/posts',
    method: 'delete',
    params
  })
}

// 发布文章
export const publishPost = (data) => {
  return service({
    url: '/cms/posts/publish',
    method: 'post',
    data
  })
}

// 取消发布文章
export const unpublishPost = (data) => {
  return service({
    url: '/cms/posts/unpublish',
    method: 'post',
    data
  })
}

// ==================== 分类管理 ====================

// 获取分类列表
export const getCategoryList = (params) => {
  return service({
    url: '/cms/categories',
    method: 'get',
    params
  })
}

// 创建分类
export const createCategory = (data) => {
  return service({
    url: '/cms/categories',
    method: 'post',
    data
  })
}

// 更新分类
export const updateCategory = (data) => {
  return service({
    url: '/cms/categories',
    method: 'put',
    data
  })
}

// 删除分类
export const deleteCategory = (params) => {
  return service({
    url: '/cms/categories',
    method: 'delete',
    params
  })
}

// ==================== 标签管理 ====================

// 获取标签列表
export const getTagList = (params) => {
  return service({
    url: '/cms/tags',
    method: 'get',
    params
  })
}

// 创建标签
export const createTag = (data) => {
  return service({
    url: '/cms/tags',
    method: 'post',
    data
  })
}

// 更新标签
export const updateTag = (data) => {
  return service({
    url: '/cms/tags',
    method: 'put',
    data
  })
}

// 删除标签
export const deleteTag = (params) => {
  return service({
    url: '/cms/tags',
    method: 'delete',
    params
  })
}

// ==================== 模板管理 ====================

// 获取模板列表
export const getTemplateList = (params) => {
  return service({
    url: '/cms/templates',
    method: 'get',
    params
  })
}

// 创建模板
export const createTemplate = (data) => {
  return service({
    url: '/cms/templates',
    method: 'post',
    data
  })
}

// 获取模板详情
export const getTemplate = (params) => {
  return service({
    url: '/cms/templates',
    method: 'get',
    params
  })
}

// 更新模板
export const updateTemplate = (data) => {
  return service({
    url: '/cms/templates',
    method: 'put',
    data
  })
}

// 删除模板
export const deleteTemplate = (params) => {
  return service({
    url: '/cms/templates',
    method: 'delete',
    params
  })
}

// 激活模板
export const activateTemplate = (data) => {
  return service({
    url: '/cms/templates/activate',
    method: 'post',
    data
  })
}

// 预览模板
export const previewTemplate = (params) => {
  return service({
    url: '/cms/templates/preview',
    method: 'get',
    params
  })
}

// ==================== 媒体管理 ====================

// 获取媒体文件列表
export const getMediaList = (params) => {
  return service({
    url: '/cms/media',
    method: 'get',
    params
  })
}

// 上传媒体文件
export const uploadMedia = (data) => {
  return service({
    url: '/cms/media',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 删除媒体文件
export const deleteMedia = (params) => {
  return service({
    url: '/cms/media',
    method: 'delete',
    params
  })
}

// 获取媒体文件夹列表
export const getMediaFolders = (params) => {
  return service({
    url: '/cms/media/folders',
    method: 'get',
    params
  })
}

// 创建媒体文件夹
export const createMediaFolder = (data) => {
  return service({
    url: '/cms/media/folders',
    method: 'post',
    data
  })
}

// ==================== 菜单管理 ====================

// 获取菜单列表
export const getMenuList = (params) => {
  return service({
    url: '/cms/menus',
    method: 'get',
    params
  })
}

// 创建菜单
export const createMenu = (data) => {
  return service({
    url: '/cms/menus',
    method: 'post',
    data
  })
}

// 更新菜单
export const updateMenu = (data) => {
  return service({
    url: '/cms/menus',
    method: 'put',
    data
  })
}

// 删除菜单
export const deleteMenu = (params) => {
  return service({
    url: '/cms/menus',
    method: 'delete',
    params
  })
}

// 获取菜单树
export const getMenuTree = (params) => {
  return service({
    url: '/cms/menus/tree',
    method: 'get',
    params
  })
}
