package initialize

import (
	"context"

	"github.com/flipped-aurora/gin-vue-admin/server/model/system"
	"github.com/flipped-aurora/gin-vue-admin/server/plugin/plugin-tool/utils"
)

func Api(ctx context.Context) {
	entities := []system.SysApi{
		{Path: "/api/v1/cms/site", Description: "获取站点配置", ApiGroup: "CMS内容管理", Method: "GET"},
		{Path: "/api/v1/cms/site", Description: "更新站点配置", ApiGroup: "CMS内容管理", Method: "PUT"},
		{Path: "/api/v1/cms/site/demodata", Description: "生成演示数据", ApiGroup: "CMS内容管理", Method: "POST"},
		{Path: "/api/v1/cms/posts", Description: "文章列表", ApiGroup: "CMS内容管理", Method: "GET"},
		{Path: "/api/v1/cms/posts", Description: "创建文章", ApiGroup: "CMS内容管理", Method: "POST"},
		{Path: "/api/v1/cms/posts/:id", Description: "获取文章详情", ApiGroup: "CMS内容管理", Method: "GET"},
		{Path: "/api/v1/cms/posts/:id", Description: "更新文章", ApiGroup: "CMS内容管理", Method: "PUT"},
		{Path: "/api/v1/cms/posts/:id", Description: "删除文章", ApiGroup: "CMS内容管理", Method: "DELETE"},
		{Path: "/api/v1/cms/terms", Description: "分类标签列表", ApiGroup: "CMS内容管理", Method: "GET"},
		{Path: "/api/v1/cms/terms", Description: "创建分类标签", ApiGroup: "CMS内容管理", Method: "POST"},
		{Path: "/api/v1/cms/terms/:id", Description: "更新分类标签", ApiGroup: "CMS内容管理", Method: "PUT"},
		{Path: "/api/v1/cms/terms/:id", Description: "删除分类标签", ApiGroup: "CMS内容管理", Method: "DELETE"},
	}
	utils.RegisterApis(entities...)
}
