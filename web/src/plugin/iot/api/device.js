import service from '@/utils/request'

// @Tags Device
// @Summary 创建设备
// @Router /iot/device/createDevice [post]
export const createDevice = (data) => {
  return service({
    url: '/iot/device/createDevice',
    method: 'post',
    data
  })
}

// @Tags Device
// @Summary 删除设备
// @Router /iot/device/deleteDevice [delete]
export const deleteDevice = (data) => {
  return service({
    url: '/iot/device/deleteDevice',
    method: 'delete',
    data
  })
}

// @Tags Device
// @Summary 更新设备
// @Router /iot/device/updateDevice [put]
export const updateDevice = (data) => {
  return service({
    url: '/iot/device/updateDevice',
    method: 'put',
    data
  })
}

// @Tags Device
// @Summary 用id查询设备
// @Router /iot/device/findDevice [get]
export const findDevice = (params) => {
  return service({
    url: '/iot/device/findDevice',
    method: 'get',
    params
  })
}

// @Tags Device
// @Summary 分页获取设备列表
// @Router /iot/device/getDeviceList [get]
export const getDeviceList = (params) => {
  return service({
    url: '/iot/device/getDeviceList',
    method: 'get',
    params
  })
}

// @Tags Device
// @Summary 重置设备接入密钥
// @Router /iot/device/resetDeviceSecret [put]
export const resetDeviceSecret = (data) => {
  return service({
    url: '/iot/device/resetDeviceSecret',
    method: 'put',
    data
  })
}

// @Tags Device
// @Summary 查询设备遥测历史
// @Router /iot/device/getTelemetry [get]
export const getTelemetry = (params) => {
  return service({
    url: '/iot/device/getTelemetry',
    method: 'get',
    params
  })
}
