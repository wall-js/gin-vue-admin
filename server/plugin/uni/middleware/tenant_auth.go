package middleware

import (
	"net/http"
	"strconv"

	systemReq "github.com/flipped-aurora/gin-vue-admin/server/model/system/request"
	"github.com/gin-gonic/gin"
	"github.com/uni/common/auth"
)

// TenantAuth 租户+站点隔离中间件
// 读取网关注入的 X-Tenant-Id / X-Site-Id header，与 JWT claims 交叉验证
// 复用 common/auth 共享校验函数，与 CMS TenantMiddleware 共享同一鉴权逻辑
// 验证通过后将 tenant_id / site_id 注入 gin context 供业务层使用
func TenantAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		headerTenantId := c.GetHeader("X-Tenant-Id")
		headerSiteId := c.GetHeader("X-Site-Id")

		// 无任何维度 header，主域名访问，放行
		if headerTenantId == "" && headerSiteId == "" {
			c.Next()
			return
		}

		// 解析 header 值
		var domainTenantId, domainSiteId uint64
		if headerTenantId != "" {
			domainTenantId, _ = strconv.ParseUint(headerTenantId, 10, 64)
		}
		if headerSiteId != "" {
			domainSiteId, _ = strconv.ParseUint(headerSiteId, 10, 64)
		}

		// 获取 JWTAuth 中间件设置的 claims
		claimsVal, exists := c.Get("claims")
		if !exists {
			c.Next()
			return
		}

		claims, ok := claimsVal.(*systemReq.CustomClaims)
		if !ok || claims == nil {
			c.Next()
			return
		}

		path := c.Request.URL.Path

		// 租户维度校验
		if domainTenantId > 0 {
			jwtTenantId := uint64(claims.TenantId)
			result := auth.ValidateTenantAccess(jwtTenantId, domainTenantId, path)
			if !result.Allowed {
				c.JSON(http.StatusForbidden, gin.H{
					"code": 403,
					"msg":  "无权访问该租户",
					"data": nil,
				})
				c.Abort()
				return
			}
		}

		// 站点维度校验
		if domainSiteId > 0 {
			jwtSiteId := uint64(claims.SiteId)
			result := auth.ValidateSiteAccess(jwtSiteId, domainSiteId, path)
			if !result.Allowed {
				c.JSON(http.StatusForbidden, gin.H{
					"code": 403,
					"msg":  "无权访问该站点",
					"data": nil,
				})
				c.Abort()
				return
			}
		}

		// 将 tenant_id / site_id 注入 gin context，供业务层取用
		c.Set("tenant_id", domainTenantId)
		c.Set("site_id", domainSiteId)

		c.Next()
	}
}
