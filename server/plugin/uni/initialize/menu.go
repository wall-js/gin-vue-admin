package initialize

import (
	"context"
	"fmt"

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
			Component: "view/routerHolder.vue",
			Sort:      5,
			Meta:      model.Meta{Title: "内容管理", Icon: "document"},
		},
		{
			ParentId:  0,
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
		{
			ParentId:  0,
			Path:      "cmsCategories",
			Name:      "cmsCategories",
			Hidden:    false,
			Component: "plugin/uni/cms/view/categories.vue",
			Sort:      3,
			Meta:      model.Meta{Title: "分类管理", Icon: "folder"},
		},
		{
			ParentId:  0,
			Path:      "cmsTags",
			Name:      "cmsTags",
			Hidden:    false,
			Component: "plugin/uni/cms/view/tags.vue",
			Sort:      4,
			Meta:      model.Meta{Title: "标签管理", Icon: "price-tag"},
		},
		{
			ParentId:  0,
			Path:      "cmsMenus",
			Name:      "cmsMenus",
			Hidden:    false,
			Component: "plugin/uni/cms/view/menus.vue",
			Sort:      5,
			Meta:      model.Meta{Title: "菜单管理", Icon: "menu"},
		},
	}

	// Try batch registration (works on fresh installs)
	utils.RegisterMenus(entities...)

	// Fallback: ensure all child menus exist even if batch was skipped
	// (RegisterMenus skips if ANY menu name already exists)
	ensureChildMenus(entities)
}

// ensureChildMenus finds the parent "cms" menu and inserts any missing child menus,
// then associates them with the admin authority (888) so they appear in the sidebar.
func ensureChildMenus(entities []model.SysBaseMenu) {
	db := global.GVA_DB
	if db == nil {
		return
	}

	// Find the parent cms menu
	var parentMenu model.SysBaseMenu
	if err := db.Where("name = ?", "cms").First(&parentMenu).Error; err != nil {
		return
	}

	// Collect all CMS menu IDs (parent + children) for authority association
	cmsMenuIDs := []uint{parentMenu.ID}

	// Insert each child menu if it doesn't exist
	for _, m := range entities[1:] {
		var existing model.SysBaseMenu
		var count int64
		db.Model(&model.SysBaseMenu{}).Where("name = ?", m.Name).Count(&count)
		if count == 0 {
			m.ParentId = parentMenu.ID
			if err := db.Create(&m).Error; err != nil {
				fmt.Printf("[uni] failed to create menu %s: %v\n", m.Name, err)
				continue
			}
			cmsMenuIDs = append(cmsMenuIDs, m.ID)
		} else {
			db.Where("name = ?", m.Name).First(&existing)
			cmsMenuIDs = append(cmsMenuIDs, existing.ID)
		}
	}

	// Associate all CMS menus with admin authority (888) if not already linked
	adminAuthorityID := "888"
	for _, menuID := range cmsMenuIDs {
		menuIDStr := fmt.Sprintf("%d", menuID)
		var linkCount int64
		db.Table("sys_authority_menus").
			Where("sys_authority_authority_id = ? AND sys_base_menu_id = ?", adminAuthorityID, menuIDStr).
			Count(&linkCount)
		if linkCount == 0 {
			db.Table("sys_authority_menus").
				Create(map[string]interface{}{
					"sys_authority_authority_id": adminAuthorityID,
					"sys_base_menu_id":           menuIDStr,
				})
		}
	}
}
