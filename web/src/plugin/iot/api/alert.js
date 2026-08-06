import service from '@/utils/request'

// @Tags AlertRule
// @Summary 创建告警规则
// @Router /iot/alert/createAlertRule [post]
export const createAlertRule = (data) => {
  return service({
    url: '/iot/alert/createAlertRule',
    method: 'post',
    data
  })
}

// @Tags AlertRule
// @Summary 删除告警规则
// @Router /iot/alert/deleteAlertRule [delete]
export const deleteAlertRule = (data) => {
  return service({
    url: '/iot/alert/deleteAlertRule',
    method: 'delete',
    data
  })
}

// @Tags AlertRule
// @Summary 更新告警规则
// @Router /iot/alert/updateAlertRule [put]
export const updateAlertRule = (data) => {
  return service({
    url: '/iot/alert/updateAlertRule',
    method: 'put',
    data
  })
}

// @Tags AlertRule
// @Summary 用id查询告警规则
// @Router /iot/alert/findAlertRule [get]
export const findAlertRule = (params) => {
  return service({
    url: '/iot/alert/findAlertRule',
    method: 'get',
    params
  })
}

// @Tags AlertRule
// @Summary 分页获取告警规则列表
// @Router /iot/alert/getAlertRuleList [get]
export const getAlertRuleList = (params) => {
  return service({
    url: '/iot/alert/getAlertRuleList',
    method: 'get',
    params
  })
}

// @Tags AlertRecord
// @Summary 分页获取告警记录列表
// @Router /iot/alert/getAlertRecordList [get]
export const getAlertRecordList = (params) => {
  return service({
    url: '/iot/alert/getAlertRecordList',
    method: 'get',
    params
  })
}

// @Tags AlertRecord
// @Summary 标记告警记录为已处理
// @Router /iot/alert/handleAlertRecord [put]
export const handleAlertRecord = (data) => {
  return service({
    url: '/iot/alert/handleAlertRecord',
    method: 'put',
    data
  })
}
