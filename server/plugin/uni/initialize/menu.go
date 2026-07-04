package initialize

import (
	"context"
	"fmt"

	"github.com/flipped-aurora/gin-vue-admin/server/global"
	model "github.com/flipped-aurora/gin-vue-admin/server/model/system"
)

// menuGroup defines a parent menu and its children.
type menuGroup struct {
	parent   model.SysBaseMenu
	children []model.SysBaseMenu
}

func Menu(ctx context.Context) {
	groups := []menuGroup{
		{
			parent: model.SysBaseMenu{
				ParentId:  0,
				Path:      "cms",
				Name:      "cms",
				Hidden:    false,
				Component: "view/routerHolder.vue",
				Sort:      5,
				Meta:      model.Meta{Title: "plugins.uni.nav.cms", Icon: "document"},
			},
			children: []model.SysBaseMenu{
				{
					ParentId:  0,
					Path:      "cmsPosts",
					Name:      "cmsPosts",
					Hidden:    false,
					Component: "plugin/uni/cms/view/posts.vue",
					Sort:      1,
					Meta:      model.Meta{Title: "plugins.uni.nav.posts", Icon: "notebook"},
				},
				{
					ParentId:  0,
					Path:      "cmsSite",
					Name:      "cmsSite",
					Hidden:    false,
					Component: "plugin/uni/cms/view/site.vue",
					Sort:      2,
					Meta:      model.Meta{Title: "plugins.uni.nav.site", Icon: "setting"},
				},
				{
					ParentId:  0,
					Path:      "cmsCategories",
					Name:      "cmsCategories",
					Hidden:    false,
					Component: "plugin/uni/cms/view/categories.vue",
					Sort:      3,
					Meta:      model.Meta{Title: "plugins.uni.nav.categories", Icon: "folder"},
				},
				{
					ParentId:  0,
					Path:      "cmsTags",
					Name:      "cmsTags",
					Hidden:    false,
					Component: "plugin/uni/cms/view/tags.vue",
					Sort:      4,
					Meta:      model.Meta{Title: "plugins.uni.nav.tags", Icon: "price-tag"},
				},
				{
					ParentId:  0,
					Path:      "cmsMenus",
					Name:      "cmsMenus",
					Hidden:    false,
					Component: "plugin/uni/cms/view/menus.vue",
					Sort:      5,
					Meta:      model.Meta{Title: "plugins.uni.nav.menus", Icon: "menu"},
				},
				{
					ParentId:  0,
					Path:      "cmsMedia",
					Name:      "cmsMedia",
					Hidden:    false,
					Component: "plugin/uni/cms/view/media.vue",
					Sort:      6,
					Meta:      model.Meta{Title: "plugins.uni.nav.media", Icon: "picture"},
				},
			},
		},
		{
			parent: model.SysBaseMenu{
				ParentId:  0,
				Path:      "operations",
				Name:      "operations",
				Hidden:    false,
				Component: "view/routerHolder.vue",
				Sort:      6,
				Meta:      model.Meta{Title: "plugins.uni.nav.operations", Icon: "data-line"},
			},
			children: []model.SysBaseMenu{
				{
					ParentId:  0,
					Path:      "tenants",
					Name:      "tenants",
					Hidden:    false,
					Component: "plugin/uni/center/view/tenants.vue",
					Sort:      0,
					Meta:      model.Meta{Title: "plugins.uni.nav.tenants", Icon: "avatar"},
				},
				{
					ParentId:  0,
					Path:      "cmsSites",
					Name:      "cmsSites",
					Hidden:    false,
					Component: "plugin/uni/core/view/sites.vue",
					Sort:      0,
					Meta:      model.Meta{Title: "plugins.uni.nav.sites", Icon: "grid"},
				},
			},
		},
	}

	// Idempotent: ensure all menus exist.
	// Each menu is checked individually — safe to run on both fresh and existing installs.
	for _, g := range groups {
		ensureMenuGroup(g)
	}
}

// ensureMenuGroup ensures a parent menu and its children exist.
func ensureMenuGroup(group menuGroup) {
	db := global.GVA_DB
	if db == nil {
		return
	}

	parentDef := group.parent

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

	// Ensure the parent menu exists
	var parentMenu model.SysBaseMenu
	if err := db.Where("name = ?", parentDef.Name).First(&parentMenu).Error; err != nil {
		parentMenu = parentDef
		if err := db.Create(&parentMenu).Error; err != nil {
			fmt.Printf("[uni] failed to create parent menu %s: %v\n", parentDef.Name, err)
			return
		}
	} else if parentMenu.Meta.Title != parentDef.Meta.Title {
		db.Model(&parentMenu).UpdateColumns(map[string]interface{}{"title": parentDef.Meta.Title})
	}

	// Ensure each child menu exists and is parented correctly
	for _, m := range group.children {
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
			updates := map[string]interface{}{}
			if existing.ParentId != parentMenu.ID {
				updates["parent_id"] = parentMenu.ID
			}
			if existing.Meta.Title != m.Meta.Title {
				updates["title"] = m.Meta.Title
			}
			if len(updates) > 0 {
				db.Model(&existing).UpdateColumns(updates)
			}
		}
	}
}
