package initialize

import (
	"context"

	"github.com/flipped-aurora/gin-vue-admin/server/global"
	model "github.com/flipped-aurora/gin-vue-admin/server/model/system"
	"github.com/flipped-aurora/gin-vue-admin/server/plugin/plugin-tool/utils"
)

func Menu(ctx context.Context) {
	entities := []model.SysBaseMenu{
		{
			ParentId:  0,
			Path:      "cms",
			Name:      "cms",
			Hidden:    false,
			Component: "view/layout/index.vue",
			Sort:      5,
			Meta:      model.Meta{Title: "内容管理", Icon: "document"},
		},
		{
			ParentId:  0, // will be set to cms menu id after registration
			Path:      "cmsSite",
			Name:      "cmsSite",
			Hidden:    false,
			Component: "plugin/uni/cms/view/site.vue",
			Sort:      1,
			Meta:      model.Meta{Title: "站点设置", Icon: "setting"},
		},
		{
			ParentId:  0,
			Path:      "cmsPosts",
			Name:      "cmsPosts",
			Hidden:    false,
			Component: "plugin/uni/cms/view/posts.vue",
			Sort:      2,
			Meta:      model.Meta{Title: "文章管理", Icon: "notebook"},
		},
	}

	// Register menus; ParentId will be linked by utils.RegisterMenus
	utils.RegisterMenus(entities...)

	// Update parent id for child menus
	_ = global.GVA_DB // available if needed for manual parent linking
}
