import service from '@/utils/request'

// @Tags Scene
// @Summary 创建场景
// @Router /iot/scene/createScene [post]
export const createScene = (data) => {
  return service({
    url: '/iot/scene/createScene',
    method: 'post',
    data
  })
}

// @Tags Scene
// @Summary 删除场景
// @Router /iot/scene/deleteScene [delete]
export const deleteScene = (data) => {
  return service({
    url: '/iot/scene/deleteScene',
    method: 'delete',
    data
  })
}

// @Tags Scene
// @Summary 更新场景
// @Router /iot/scene/updateScene [put]
export const updateScene = (data) => {
  return service({
    url: '/iot/scene/updateScene',
    method: 'put',
    data
  })
}

// @Tags Scene
// @Summary 用id查询场景
// @Router /iot/scene/findScene [get]
export const findScene = (params) => {
  return service({
    url: '/iot/scene/findScene',
    method: 'get',
    params
  })
}

// @Tags Scene
// @Summary 分页获取场景列表
// @Router /iot/scene/getSceneList [get]
export const getSceneList = (params) => {
  return service({
    url: '/iot/scene/getSceneList',
    method: 'get',
    params
  })
}

// @Tags Scene
// @Summary 手动触发场景
// @Router /iot/scene/triggerScene [post]
export const triggerScene = (data) => {
  return service({
    url: '/iot/scene/triggerScene',
    method: 'post',
    data
  })
}
