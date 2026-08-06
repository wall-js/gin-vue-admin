import service from '@/utils/request'

// @Tags Broker
// @Summary 获取Broker配置与运行状态
// @Router /iot/broker/getConfig [get]
export const getBrokerConfig = () => {
  return service({
    url: '/iot/broker/getConfig',
    method: 'get'
  })
}

// @Tags Broker
// @Summary 保存Broker配置（运行中会按新配置重启）
// @Router /iot/broker/saveConfig [post]
export const saveBrokerConfig = (data) => {
  return service({
    url: '/iot/broker/saveConfig',
    method: 'post',
    data
  })
}

// @Tags Broker
// @Summary 启动Broker
// @Router /iot/broker/start [post]
export const startBroker = () => {
  return service({
    url: '/iot/broker/start',
    method: 'post'
  })
}

// @Tags Broker
// @Summary 停止Broker
// @Router /iot/broker/stop [post]
export const stopBroker = () => {
  return service({
    url: '/iot/broker/stop',
    method: 'post'
  })
}

// @Tags Broker
// @Summary 获取Broker运行状态
// @Router /iot/broker/getStatus [get]
export const getBrokerStatus = () => {
  return service({
    url: '/iot/broker/getStatus',
    method: 'get'
  })
}
