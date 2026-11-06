package initialize

import (
	"io"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// scadaProxy 将 GVA 同源路径 /scada/* 反向代理到内部 SCADA 服务。
//
// 关键约束：内部 SCADA（FUXA）已配置 BASE_PATH=/scada，因此它生成的 HTML、
// 静态资源（/scada/assets/...）与 socket.io（/scada/socket.io/...）全部位于 /scada 之下
// （见其 <base href="/scada/">）。
//
// 因此本代理【必须保留】/scada 前缀原样转发，绝不能像普通反代那样“剥掉前缀”。
// 早先把 /scada/assets/... 转发成 /assets/... 正是静态资源 404 的根因。
type scadaProxy struct {
	target    *url.URL
	httpProxy *httputil.ReverseProxy
}

// newScadaProxy 构造代理。target 形如 http://scada:1881 或 http://127.0.0.1:1881
func newScadaProxy(target string) (*scadaProxy, error) {
	u, err := url.Parse(target)
	if err != nil {
		return nil, err
	}
	rp := &httputil.ReverseProxy{
		// 只改写协议/主机，完整保留原始请求的 Path 与 Query（含 /scada 前缀）
		Director: func(req *http.Request) {
			req.URL.Scheme = u.Scheme
			req.URL.Host = u.Host
			req.Host = u.Host
		},
		// 让 SSE / 长轮询类响应（socket.io polling）能边收边发
		FlushInterval: 100 * time.Millisecond,
	}
	return &scadaProxy{target: u, httpProxy: rp}, nil
}

// ServeGin 是 gin 路由处理函数：/scada 与 /scada/*action
func (p *scadaProxy) ServeGin(c *gin.Context) {
	// WebSocket（socket.io 的 ws 传输）：手动双向隧道，ReverseProxy 单向拷贝不支持升级
	if strings.EqualFold(c.Request.Header.Get("Upgrade"), "websocket") {
		p.proxyWebSocket(c.Writer, c.Request)
		return
	}
	// 普通 HTTP / socket.io 长轮询：原样转发（保留 /scada 前缀），由 FUXA 自己按 BASE_PATH 路由
	p.httpProxy.ServeHTTP(c.Writer, c.Request)
}

// proxyWebSocket 在客户端与内部 SCADA 之间建立原始 TCP 双向隧道，
// 透传 101 握手及后续帧，支持 socket.io 的 WebSocket 传输。
// 同样需要保留 /scada 前缀（socket.io 路径为 /scada/socket.io/...）。
func (p *scadaProxy) proxyWebSocket(w http.ResponseWriter, r *http.Request) {
	targetConn, err := net.DialTimeout("tcp", p.target.Host, 10*time.Second)
	if err != nil {
		http.Error(w, "scada backend unreachable", http.StatusBadGateway)
		return
	}
	defer targetConn.Close()

	// 构造到内部 SCADA 的升级请求：完整保留原始 Path（含 /scada 前缀）与 Query
	clone := r.Clone(r.Context())
	clone.URL = &url.URL{
		Scheme:   p.target.Scheme,
		Host:     p.target.Host,
		Path:     r.URL.Path,
		RawPath:  r.URL.RawPath,
		RawQuery: r.URL.RawQuery,
	}
	clone.Host = p.target.Host
	clone.RequestURI = ""
	if err := clone.Write(targetConn); err != nil {
		http.Error(w, "scada backend write error", http.StatusBadGateway)
		return
	}

	hj, ok := w.(http.Hijacker)
	if !ok {
		http.Error(w, "hijack not supported", http.StatusInternalServerError)
		return
	}
	clientConn, _, err := hj.Hijack()
	if err != nil {
		http.Error(w, "hijack error", http.StatusInternalServerError)
		return
	}
	defer clientConn.Close()

	var wg sync.WaitGroup
	wg.Add(2)
	go func() { defer wg.Done(); io.Copy(clientConn, targetConn) }()
	go func() { defer wg.Done(); io.Copy(targetConn, clientConn) }()
	wg.Wait()
}
