import { cmsGet, cmsPost, cmsPut, cmsDelete } from './cmsClient'

// 文章列表
export const listPosts = (params) => cmsGet('/posts', params)

// 获取单个文章
export const getPost = (id) => cmsGet(`/posts/${id}`)

// 创建文章
export const createPost = (data) => cmsPost('/posts', data)

// 更新文章
export const updatePost = (id, data) => cmsPut(`/posts/${id}`, data)

// 删除文章
export const deletePost = (id) => cmsDelete(`/posts/${id}`)

// 获取文章修订历史
export const listRevisions = (postId, params) => cmsGet(`/posts/${postId}/revisions`, params)
