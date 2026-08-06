import service from '@/utils/request'

// @Tags Certificate
// @Summary 新增CA证书
// @Router /iot/certificate/createCertificate [post]
export const createCertificate = (data) => {
  return service({
    url: '/iot/certificate/createCertificate',
    method: 'post',
    data
  })
}

// @Tags Certificate
// @Summary 删除CA证书
// @Router /iot/certificate/deleteCertificate [delete]
export const deleteCertificate = (data) => {
  return service({
    url: '/iot/certificate/deleteCertificate',
    method: 'delete',
    data
  })
}

// @Tags Certificate
// @Summary 更新CA证书
// @Router /iot/certificate/updateCertificate [put]
export const updateCertificate = (data) => {
  return service({
    url: '/iot/certificate/updateCertificate',
    method: 'put',
    data
  })
}

// @Tags Certificate
// @Summary 用id查询CA证书
// @Router /iot/certificate/findCertificate [get]
export const findCertificate = (params) => {
  return service({
    url: '/iot/certificate/findCertificate',
    method: 'get',
    params
  })
}

// @Tags Certificate
// @Summary 分页获取CA证书列表
// @Router /iot/certificate/getCertificateList [get]
export const getCertificateList = (params) => {
  return service({
    url: '/iot/certificate/getCertificateList',
    method: 'get',
    params
  })
}

// @Tags Certificate
// @Summary 自动生成CA证书（入库并返回私钥供下载）
// @Router /iot/certificate/generateCA [post]
export const generateCA = (data) => {
  return service({
    url: '/iot/certificate/generateCA',
    method: 'post',
    data
  })
}

// @Tags Certificate
// @Summary 用库中CA签发客户端证书（CN自由指定不绑定设备，返回PEM供下载）
// @Router /iot/certificate/issueDeviceCert [post]
export const issueDeviceCert = (data) => {
  return service({
    url: '/iot/certificate/issueDeviceCert',
    method: 'post',
    data
  })
}

// @Tags Certificate
// @Summary 用库中CA生成Broker服务端证书（证书与私钥均入库，供Broker配置页选用）
// @Router /iot/certificate/generateServerCert [post]
export const generateServerCert = (data) => {
  return service({
    url: '/iot/certificate/generateServerCert',
    method: 'post',
    data
  })
}
