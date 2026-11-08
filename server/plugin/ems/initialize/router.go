package initialize

import (
	emsApi "github.com/flipped-aurora/gin-vue-admin/server/plugin/ems/api"
	"github.com/gin-gonic/gin"
)

// Router 注册 ems 插件的后端路由。
//
// SCADA(FUXA) 已改为独立服务部署：GVA 不注册 /scada/* 反向代理，不转发任何
// SCADA 流量。这里只提供 ems 模块的通用配置下发接口 /ems/config，
// 前端拿到 data.scada.base 后直连 FUXA（iframe / REST / socket.io）。
// 后续新增 ems 前端配置往 data 里加域即可，不必再开新接口。
//
// 注意 Vite 与 nginx 都会把 /api 前缀 rewrite 掉，因此前端请求
// /api/ems/config 时，后端只需注册 /ems/config。
func Router(group *gin.Engine) {
	group.GET("/ems/config", emsApi.Api.GetConfig)
}
