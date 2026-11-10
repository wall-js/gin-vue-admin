<template>
  <div ref="stage" class="scada-stage">
    <div v-if="configError" class="scada-error">
      <p class="scada-error-title">SCADA 地址获取失败</p>
      <p class="scada-error-detail">{{ configError }}</p>
      <p class="scada-error-hint">请在后端 config.yaml 配置 ems.scada.base 并重启 gva-server</p>
      <button class="scada-error-retry" @click="loadScadaBase(true)">重试</button>
    </div>
    <div v-else-if="src && ready" class="scada-clip" :style="clipStyle">
      <iframe
        :key="src"
        :src="src"
        class="scada-frame"
        :style="frameStyle"
      ></iframe>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { buildScadaUrl, getScadaBase } from '../api/emsConfig.js'

const route = useRoute()

// SCADA 入口：FUXA 地址来自 ems 模块通用配置接口 GET /api/ems/config
// （data.scada.base，后端 config.yaml 的 ems.scada.base）。
// 前端不硬编码、不读 VITE_*、不在构建期注入；GVA 不反向代理，iframe 直连 FUXA 根路径。
// 换地址只需改后端配置并重启 gva-server，无需重新打包前端。
const scadaBase = ref('')
const configError = ref('')

async function loadScadaBase(force = false) {
  configError.value = ''
  try {
    scadaBase.value = await getScadaBase({ force })
  } catch (err) {
    scadaBase.value = ''
    configError.value = err?.message || String(err)
  }
}

// iframe 视口物理尺寸。FUXA 1.3.4-2890 的 div#container.home-container 是
// overflow:auto，运行视图 SVG 固定 1920×1080、scrollHeight 恒为 1084，垂直滚动条
// 占 7px；视口底部另有 46px 白色 #main-container。要让 FUXA 不出现滚动条：
//   宽 ≥ 1920+7（抵消滚动条）、高 ≥ 1080+4+46（内容余量 + 白栏）→ 1927×1130。
const IFRAME_W = 1920 + 7
// const IFRAME_H = 1080 + 50
const IFRAME_H = 1176  

// 缩放 / 裁切基准 = FUXA 的「有效内容尺寸」，不含滚动条余量与底部白栏。
// 左上对齐时 clip 必须严格等于它，否则右侧会露出 7px 非内容区。
// 这两个值与上面的 iframe 尺寸相互独立，改一个不要顺手改另一个。
const BOTTOM_BLANK = 46
const CANVAS_W = 1920
const CANVAS_H = IFRAME_H - BOTTOM_BLANK // 1084 = 1080 内容 + 4 余量

const stage = ref(null)
const viewport = ref({ w: 0, h: 0 })
let observer = null

const ready = computed(() => viewport.value.w > 0 && viewport.value.h > 0)

// 唯一的自适应逻辑：观察自身尺寸（stage 绝对定位贴合 GVA 内容区），
// 窗口变化、侧栏折叠、tabs 开关都会自动重算，无需手动改 DOM 或配对生命周期。
onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect
    if (width > 0 && height > 0) viewport.value = { w: width, h: height }
  })
  observer.observe(stage.value)
  // 地址是运行时异步下发的，拿到之前 src 为空，不渲染 iframe。
  loadScadaBase()
})
onBeforeUnmount(() => observer?.disconnect())

// 单一业务模板：根据菜单参数渲染不同 SCADA 页面
//   ?page=home           → SCADA 首页（<base>/home）
//   ?page=editor         → 视图编辑（<base>/editor）
//   ?page=logs           → 组态日志（<base>/logs）
//   ?page=flows          → 流程编辑（<base>/flows）
//   ?page=messages       → 告警设置（<base>/messages）
//   ?page=notifications  → 通知设置（<base>/notifications）
//   ?viewName=XXX        → SCADA 运行视图（<base>/?viewName=XXX）
// 所有独立页面统一走 page 参数；SCADA_PAGES 既是白名单，也是
// 「菜单参数值 → FUXA 页面名」的映射表（不带前导斜杠，由 buildScadaUrl 补齐）。
// 新增页面只需在这里加一行，并在 menu.go 用 scadaPageMenu 注册对应菜单，
// 无需改动下面的分支逻辑。
// 白名单是安全边界：避免 query 被篡改后把 iframe 指向任意外部地址（开放重定向）。
// FUXA 只识别 viewName / name / debug 三个查询参数，不存在 embedded 参数；
// 隐藏左下角导航需在项目 hmi.layout.hidenavigation 中配置。
const SCADA_PAGES = new Map([
  ['home', 'home'],
  ['editor', 'editor'],
  ['logs', 'logs'],
  ['flows', 'flows'],
  ['messages', 'messages'],
  ['notifications', 'notifications']
])

// 同名 query 参数重复出现时 vue-router 会给数组，统一取第一项。
const first = (v) => (Array.isArray(v) ? v[0] : v)

const src = computed(() => {
  const base = scadaBase.value
  if (!base) return ''
  const page = first(route.query.page)
  if (page) {
    const path = SCADA_PAGES.get(page)
    return path ? buildScadaUrl(base, path) : ''
  }
  const view = first(route.query.viewName)
  if (!view) return ''
  return buildScadaUrl(base, '/', { viewName: view })
})

// 只有运行视图需要按 1920×1080 缩放裁切；所有 page 页面保持原生自适应。
const isRuntime = computed(() => !route.query.page && !!route.query.viewName)

const scale = computed(() => {
  if (!isRuntime.value || !ready.value) return 1
  return (
    Math.min(
      viewport.value.w / CANVAS_W,
      viewport.value.h / CANVAS_H
    ) || 1
  )
})

// 裁切窗口 = 缩放后的有效内容尺寸，固定左上对齐（不居中，由 CSS 的 top/left:0 保证）。
// iframe 视觉上多出的右侧 7*s（滚动条余量）与底部 46*s（白栏）落在窗口外，被 overflow 裁掉。
const clipStyle = computed(() => {
  if (!isRuntime.value) return { inset: '0' }
  return {
    width: `${CANVAS_W * scale.value}px`,
    height: `${CANVAS_H * scale.value}px`
  }
})

const frameStyle = computed(() => {
  if (!isRuntime.value) {
    return { width: '100%', height: '100%' }
  }
  return {
    width: `${IFRAME_W}px`,
    height: `${IFRAME_H}px`,
    transform: `scale(${scale.value})`,
    transformOrigin: 'top left'
  }
})
</script>

<style scoped>
.scada-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #07121d;
}

.scada-clip {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  background: #07121d;
}

.scada-frame {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  border: 0;
  background: #07121d;
  color-scheme: dark;
}

.scada-error {
  position: absolute;
  top: 24px;
  left: 24px;
  max-width: 560px;
  padding: 16px 20px;
  border: 1px solid #7a3b3b;
  border-radius: 6px;
  background: #1c1113;
  color: #f0c9c9;
  font-size: 13px;
  line-height: 1.7;
}

.scada-error-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
}

.scada-error-detail {
  margin: 0;
  word-break: break-all;
}

.scada-error-hint {
  margin: 8px 0 12px;
  color: #b79a9a;
}

.scada-error-retry {
  padding: 4px 14px;
  border: 1px solid #7a3b3b;
  border-radius: 4px;
  background: transparent;
  color: #f0c9c9;
  cursor: pointer;
}

/* 仅在本组件挂载于 GVA 内容区时生效；切到别的页面后 :has() 不再匹配，
   样式自动失效，不改动任何 GVA 源文件，也不影响其它页面。 */
:global(#gva-base-load-dom:has(.scada-stage)) {
  position: relative;
}
</style>
