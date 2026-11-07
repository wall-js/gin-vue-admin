package initialize

import (
	"context"

	model "github.com/flipped-aurora/gin-vue-admin/server/model/system"
	"github.com/flipped-aurora/gin-vue-admin/server/plugin/plugin-tool/utils"
)

// SCADA 运行视图模板组件（单一业务模板，按菜单参数出图）
const scadaViewComponent = "plugin/ems/view/scadaView.vue"

func Menu(ctx context.Context) {
	utils.RegisterMenus(
		// [0] 父容器：仅分组，不指向真实页面
		model.SysBaseMenu{
			Path:      "scada",
			Name:      "scadaRoot",
			Component: "view/routerHolder",
			Meta:      model.Meta{Title: "组态监控", Icon: "monitor"},
		},
		// [1..n] 子菜单：共用单一模板，仅靠 viewName 参数区分画面（数据驱动）
		// viewName 必须与 FUXA view.name 逐字一致；视图名统一中文，且与菜单标题相同。
		// 单一数据源：.workbuddy/skills/fuxa-industrial-iot-skill/examples/uni-iot-demo/view-names.json
		scadaMenu("overview", "scadaOverview", "能源总览", "data-board", "能源总览"),
		scadaMenu("power", "scadaPower", "配电监控", "lightning", "配电监控"),
		scadaMenu("water", "scadaWater", "用水监控", "water", "用水监控"),
		scadaMenu("hvac", "scadaHvac", "暖通空调", "sunny", "暖通空调"),
		scadaMenu("alarms", "scadaAlarms", "告警看板", "warning", "告警看板"),
		// 组态编辑：默认 Hidden，仅超管手动授权可见（仍用同一模板，靠 editor 参数）
		model.SysBaseMenu{
			Path:      "editor",
			Name:      "scadaEditor",
			Component: scadaViewComponent,
			Hidden:    true,
			Meta:      model.Meta{Title: "组态编辑", Icon: "setting", KeepAlive: false},
			Parameters: []model.SysBaseMenuParameter{
				{Type: "query", Key: "editor", Value: "true"},
			},
		},
	)
}

// scadaMenu 生成一条 SCADA 运行画面菜单（参数化、单一模板）
func scadaMenu(path, name, title, icon, viewName string) model.SysBaseMenu {
	return model.SysBaseMenu{
		Path:      path,
		Name:      name,
		Component: scadaViewComponent,
		Meta:      model.Meta{Title: title, Icon: icon, KeepAlive: true},
		Parameters: []model.SysBaseMenuParameter{
			{Type: "query", Key: "viewName", Value: viewName},
		},
	}
}
