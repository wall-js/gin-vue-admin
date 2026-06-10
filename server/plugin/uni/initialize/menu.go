package initialize

import (
	"context"
	"fmt"

	"github.com/flipped-aurora/gin-vue-admin/server/global"
	model "github.com/flipped-aurora/gin-vue-admin/server/model/system"
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

	// Idempotent: ensure all CMS menus exist.
	// Each menu is checked individually — safe to run on both fresh and existing installs.
	ensureAllMenus(entities)
}

// ensureAllMenus ensures the parent "cms" menu and all child menus exist.
func ensureAllMenus(entities []model.SysBaseMenu) {
	db := global.GVA_DB
	if db == nil {
		return
	}

	parentDef := entities[0]

	// Deduplicate: if multiple parent menus with the same name exist, keep the oldest one
	var parentMenus []model.SysBaseMenu
	db.Where("name = ?", parentDef.Name).Order("id ASC").Find(&parentMenus)
	if len(parentMenus) > 1 {
		keeper := parentMenus[0]
		for _, dup := range parentMenus[1:] {
			db.Model(&model.SysBaseMenu{}).Where("parent_id = ?", dup.ID).Update("parent_id", keeper.ID)
			db.Table("sys_authority_menus").Where("sys_base_menu_id = ?", fmt.Sprintf("%d", dup.ID)).Delete(nil)
			db.Delete(&dup)
			fmt.Printf("[uni] removed duplicate menu %s (id=%d), kept id=%d\n", dup.Name, dup.ID, keeper.ID)
		}
	}

	// Ensure the parent cms menu exists
	var parentMenu model.SysBaseMenu
	if err := db.Where("name = ?", parentDef.Name).First(&parentMenu).Error; err != nil {
		parentMenu = parentDef
		if err := db.Create(&parentMenu).Error; err != nil {
			fmt.Printf("[uni] failed to create parent menu %s: %v\n", parentDef.Name, err)
			return
		}
	}

	// Ensure each child menu exists and is parented correctly
	for _, m := range entities[1:] {
		var existing model.SysBaseMenu
		var count int64
		db.Model(&model.SysBaseMenu{}).Where("name = ?", m.Name).Count(&count)
		if count == 0 {
			m.ParentId = parentMenu.ID
			if err := db.Create(&m).Error; err != nil {
				fmt.Printf("[uni] failed to create menu %s: %v\n", m.Name, err)
			}
		} else {
			db.Where("name = ?", m.Name).First(&existing)
			if existing.ParentId != parentMenu.ID {
				db.Model(&existing).Update("parent_id", parentMenu.ID)
			}
		}
	}
}
