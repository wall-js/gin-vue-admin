package api

import (
	"strings"

	"github.com/flipped-aurora/gin-vue-admin/server/model/common/response"
	"github.com/flipped-aurora/gin-vue-admin/server/plugin/ems/plugin"
	"github.com/gin-gonic/gin"
)

// GetConfig 下发 ems 模块的对外配置（前端运行时唯一配置入口）。
//
// 用模块级路径 /ems/config 而非 /ems/scada/config：后续新增任何 ems 前端配置
// （告警、报表、数字孪生等）都往 data 里加一个域，不必再开新接口、也不必改前端请求地址。
// 目前只有 scada 一个域：data.scada.base = 浏览器可直连的 FUXA 地址。
//
// 配置值来自 config.yaml 的 ems 段，前端不写死、不在构建期注入；
// 改地址只需改后端配置并重启后端，无需重新打包前端。
//
// 只下发前端确实需要的字段，不下发 secretCode、内部服务名等后端私有配置。
//
// @Tags Ems
// @Summary 获取 ems 模块前端配置
// @Produce json
// @Success 200 {object} response.Response{data=map[string]interface{}}
// @Router /ems/config [get]
func (a *api) GetConfig(c *gin.Context) {
	base := strings.TrimRight(strings.TrimSpace(plugin.Config.Scada.Base), "/")
	if base == "" {
		response.FailWithMessage("SCADA 地址未配置：请在 config.yaml 设置 ems.scada.base", c)
		return
	}
	if !strings.HasPrefix(base, "http://") && !strings.HasPrefix(base, "https://") {
		response.FailWithMessage("SCADA 地址必须是浏览器可访问的 http/https 绝对地址", c)
		return
	}
	response.OkWithData(gin.H{
		"scada": gin.H{"base": base},
	}, c)
}
