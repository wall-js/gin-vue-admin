package config

type Config struct {
	Scada ScadaConfig `mapstructure:"scada" json:"scada" yaml:"scada"`
}

// ScadaConfig 描述内部 SCADA 服务连接信息。
// 前端通过 GVA 同源的 /scada/* 访问，由 Golang 反向代理转发到该地址，无需任何前端环境变量。
type ScadaConfig struct {
	// Target 是内部 SCADA 服务地址（含协议与端口），默认 http://scada:1881（docker 服务名，按实际命名调整）。
	Target string `mapstructure:"target" json:"target" yaml:"target"`
}
