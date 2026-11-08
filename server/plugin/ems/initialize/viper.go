package initialize

import (
	"fmt"

	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/plugin/ems/plugin"
	"github.com/pkg/errors"
	"go.uber.org/zap"
)

func Viper() {
	err := global.GVA_VP.UnmarshalKey("ems", &plugin.Config)
	if err != nil {
		err = errors.Wrap(err, "初始化配置文件失败!")
		zap.L().Error(fmt.Sprintf("%+v", err))
		return
	}
	// 配置下发接口依赖此值；漏配时及早暴露，避免前端只看到一个空 iframe。
	if plugin.Config.Scada.Base == "" {
		zap.L().Warn("ems.scada.base 未配置，/ems/config 将返回失败；请在 config.yaml 中设置浏览器可访问的地址")
		return
	}
	zap.L().Info("SCADA 独立服务地址已加载", zap.String("base", plugin.Config.Scada.Base))
}
