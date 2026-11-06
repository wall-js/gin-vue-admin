package initialize

import (
	"go.uber.org/zap"

	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	emsplugin "github.com/flipped-aurora/gin-vue-admin/server/plugin/ems/plugin"
	"github.com/gin-gonic/gin"
)

func Router(engine *gin.Engine) {
	public := engine.Group(global.GVA_CONFIG.System.RouterPrefix).Group("")
	public.Use()
	private := engine.Group(global.GVA_CONFIG.System.RouterPrefix).Group("")
	private.Use(middleware.JWTAuth()).Use(middleware.CasbinHandler())

	// SCADA 反向代理：前端通过 GVA 同源的 /scada/* 访问，无需任何前端环境变量。
	// 后端将 /scada/* 转发到内部 SCADA 服务，由 Golang 完成，与环境/部署形态无关。
	scadaTarget := emsplugin.Config.Scada.Target
	if scadaTarget == "" {
		scadaTarget = "http://scada:1881"
	}
	scadaProxy, err := newScadaProxy(scadaTarget)
	if err != nil {
		zap.L().Error("SCADA 反向代理初始化失败: " + err.Error())
		return
	}
	// 挂在引擎根路径，不依赖 RouterPrefix，前端写死 /scada 即可（同源）
	engine.Any("/scada", scadaProxy.ServeGin)
	engine.Any("/scada/*action", scadaProxy.ServeGin)
}
