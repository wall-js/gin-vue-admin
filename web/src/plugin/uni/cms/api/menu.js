import { cmsGet, cmsPost, cmsPut, cmsDelete } from './cmsClient'

// Menu Containers
export const listMenuContainers = () => cmsGet('/menus')

export const getMenuContainer = (id) => cmsGet(`/menus/${id}`)

export const createMenuContainer = (data) => cmsPost('/menus', data)

export const updateMenuContainer = (id, data) => cmsPut(`/menus/${id}`, data)

export const deleteMenuContainer = (id) => cmsDelete(`/menus/${id}`)

// Menu Items
export const createMenuItem = (menuId, data) => cmsPost(`/menus/${menuId}/items`, data)

export const updateMenuItem = (id, data) => cmsPut(`/menu-items/${id}`, data)

export const deleteMenuItem = (id) => cmsDelete(`/menu-items/${id}`)

export const reorderMenuItems = (menuId, ids) => cmsPut(`/menus/${menuId}/reorder`, { ids })
