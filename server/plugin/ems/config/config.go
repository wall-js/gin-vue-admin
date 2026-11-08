package config

// Scada 是 SCADA(FUXA) 独立服务的接入配置。
//
// 语义变化：早期 Base 曾是 GVA 反向代理的「服务端内部目标」（容器名 scada:1881）；
// 现在 FUXA 独立部署，浏览器直接加载 iframe 与调用其 REST/socket.io，
// 因此 Base 必须是【浏览器可访问的绝对地址】，不能写 docker 内网服务名。
//
// 该值只存在于后端 config.yaml，前端不写死、不在构建期注入，
// 运行时通过 ems 模块通用配置接口 GET /ems/config 获取（data.scada.base）。
type Scada struct {
	Base string `mapstructure:"base" json:"base" yaml:"base"`
}

// Config 是 ems 插件的配置，由 initialize.Viper() 从 config.yaml 的 ems 段装载。
type Config struct {
	Scada Scada `mapstructure:"scada" json:"scada" yaml:"scada"`
}
