package initialize

import (
	"io"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"

	"github.com/gin-gonic/gin"
)

// TestScadaProxyKeepsBasePath 是回归测试，守住下面这条关键规则：
//
//   内部 SCADA(FUXA) 配置了 BASE_PATH=/scada，其 HTML/静态资源/socket.io 全部位于 /scada 之下。
//   反向代理【必须原样保留 /scada 前缀】，绝不能 rewrite/剥离。
//
// 曾经的实现里 `c.Request.URL.Path = action`（gin 通配符捕获值不含前缀）把
// /scada/assets/... 改写成 /assets/...，导致页面能出来但所有静态资源 404。
// 本测试用假后端代替 FUXA，不依赖 Docker，可随 go test 长期运行。
func TestScadaProxyKeepsBasePath(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// 假 SCADA 后端：记录收到的请求路径，并返回 200
	var gotPath, gotQuery atomic.Value
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath.Store(r.URL.Path)
		gotQuery.Store(r.URL.RawQuery)
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	}))
	defer backend.Close()

	p, err := newScadaProxy(backend.URL)
	if err != nil {
		t.Fatal(err)
	}
	r := gin.New()
	r.Any("/scada", p.ServeGin)
	r.Any("/scada/*action", p.ServeGin)
	front := httptest.NewServer(r)
	defer front.Close()

	cases := []struct {
		name      string
		path      string
		wantPath  string
		wantQuery string
	}{
		{"root", "/scada/", "/scada/", ""},
		{"embed-view", "/scada/?viewName=Water&embedded=true", "/scada/", "viewName=Water&embedded=true"},
		{"gauge-js", "/scada/assets/lib/gauge/gauge.js", "/scada/assets/lib/gauge/gauge.js", ""},
		{"jquery-js", "/scada/assets/lib/svgeditor/jquery-plugin.min.js", "/scada/assets/lib/svgeditor/jquery-plugin.min.js", ""},
		{"nouislider-js", "/scada/assets/lib/nouislider/nouislider.min.js", "/scada/assets/lib/nouislider/nouislider.min.js", ""},
		{"editor-js", "/scada/assets/lib/svgeditor/fuxa-editor.min.js", "/scada/assets/lib/svgeditor/fuxa-editor.min.js", ""},
		{"socketio-polling", "/scada/socket.io/?EIO=4&transport=polling", "/scada/socket.io/", "EIO=4&transport=polling"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			resp, err := http.Get(front.URL + c.path)
			if err != nil {
				t.Fatalf("request error: %v", err)
			}
			_, _ = io.Copy(io.Discard, resp.Body)
			resp.Body.Close()
			if resp.StatusCode != http.StatusOK {
				t.Errorf("status = %d, want 200", resp.StatusCode)
			}
			if p := gotPath.Load(); p != c.wantPath {
				t.Errorf("转发路径被改写: got %q, want %q (禁止剥离 /scada 前缀)", p, c.wantPath)
			}
			if q := gotQuery.Load(); q != c.wantQuery {
				t.Errorf("query = %q, want %q", q, c.wantQuery)
			}
		})
	}
}
