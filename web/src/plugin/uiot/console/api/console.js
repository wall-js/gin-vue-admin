import service from '@/utils/request'

// 获取用户个人资料
export const getUserProfile = () => {
  return service({
    url: '/user/getUserProfile',
    method: 'get'
  })
}

// 更新用户个人资料
export const updateUserProfile = (data) => {
  return service({
    url: '/user/updateUserProfile',
    method: 'put',
    data
  })
}

// 修改密码
export const changePassword = (data) => {
  return service({
    url: '/user/changePassword',
    method: 'post',
    data
  })
}

// 获取用户站点列表
export const getUserSites = (params) => {
  return service({
    url: '/cms/sites',
    method: 'get',
    params
  })
}

// 创建站点
export const createSite = (data) => {
  return service({
    url: '/cms/sites',
    method: 'post',
    data
  })
}

// 获取用户页面列表
export const getUserPages = (params) => {
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

// 获取用户文章列表
export const getUserPosts = (params) => {
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

// 获取分类列表
export const getCategories = (params) => {
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

// 获取媒体文件列表
export const getMediaFiles = (params) => {
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
