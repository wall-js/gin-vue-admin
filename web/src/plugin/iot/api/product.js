import service from '@/utils/request'

// @Tags Product
// @Summary 创建产品
// @Router /iot/product/createProduct [post]
export const createProduct = (data) => {
  return service({
    url: '/iot/product/createProduct',
    method: 'post',
    data
  })
}

// @Tags Product
// @Summary 删除产品
// @Router /iot/product/deleteProduct [delete]
export const deleteProduct = (data) => {
  return service({
    url: '/iot/product/deleteProduct',
    method: 'delete',
    data
  })
}

// @Tags Product
// @Summary 更新产品
// @Router /iot/product/updateProduct [put]
export const updateProduct = (data) => {
  return service({
    url: '/iot/product/updateProduct',
    method: 'put',
    data
  })
}

// @Tags Product
// @Summary 用id查询产品
// @Router /iot/product/findProduct [get]
export const findProduct = (params) => {
  return service({
    url: '/iot/product/findProduct',
    method: 'get',
    params
  })
}

// @Tags Product
// @Summary 分页获取产品列表
// @Router /iot/product/getProductList [get]
export const getProductList = (params) => {
  return service({
    url: '/iot/product/getProductList',
    method: 'get',
    params
  })
}

// @Tags Product
// @Summary 获取全部启用产品
// @Router /iot/product/getAllProducts [get]
export const getAllProducts = () => {
  return service({
    url: '/iot/product/getAllProducts',
    method: 'get'
  })
}
