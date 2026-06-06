package initialize

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

func Router(engine *gin.Engine) {
	// CMS API routes are proxied by gateway to go-zero CMS service,
	// so we don't need to register CMS handlers here.
	// Only register any GVA-side routes if needed in the future.
	_ = global.GVA_CONFIG
	_ = middleware.JWTAuth()

	// Placeholder: if GVA needs its own uni-related endpoints,
	// they can be added here with:
	// private := engine.Group(global.GVA_CONFIG.System.RouterPrefix).Group("")
	// private.Use(middleware.JWTAuth()).Use(middleware.CasbinHandler())
	// ...
}
