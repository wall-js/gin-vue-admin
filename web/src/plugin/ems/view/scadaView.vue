<template>
  <div ref="stage" class="scada-stage">
    <div v-if="src && ready" class="scada-clip" :style="clipStyle">
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

const route = useRoute()

// SCADA 入口：GVA 同源的 Golang 反向代理路径，写死、无需任何前端环境变量。
//   后端 ems 插件将 /scada/* 转发到内部 SCADA 服务（见 initialize/scada_proxy.go）。
//   内部 SCADA 服务需配置 BASE_PATH=/scada，使其生成的静态资源与 socket.io 地址都在 /scada 下。
const scadaBase = '/scada'

// iframe 视口物理尺寸。FUXA 1.3.4-2890 的 div#container.home-container 是
// overflow:auto，运行视图 SVG 固定 1920×1080、scrollHeight 恒为 1084，垂直滚动条
// 占 7px；视口底部另有 46px 白色 #main-container。要让 FUXA 不出现滚动条：
//   宽 ≥ 1920+7（抵消滚动条）、高 ≥ 1080+4+46（内容余量 + 白栏）→ 1927×1130。
const IFRAME_W = 1920 + 7
const IFRAME_H = 1080 + 50

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
})
onBeforeUnmount(() => observer?.disconnect())

// 单一业务模板：根据菜单参数渲染不同 SCADA 画面
//   ?editor=true   → SCADA 编辑器（/scada/editor）
//   ?home=true     → SCADA 首页（/scada/home，画板组件）
//   ?viewName=XXX  → SCADA 运行视图（/scada/?viewName=XXX）
// FUXA 1.3.4 只识别 viewName / name / debug 三个查询参数，不存在 embedded 参数；
// 隐藏左下角导航需在项目 hmi.layout.hidenavigation 中配置。
const src = computed(() => {
  if (route.query.home) {
    return `${scadaBase}/home`
  }
  if (route.query.editor) {
    return `${scadaBase}/editor`
  }
  const view = route.query.viewName
  if (!view) return ''
  return `${scadaBase}/?viewName=${encodeURIComponent(view)}`
})

// 编辑器与首页保持原生自适应（缩放后控件太小不便操作），只缩放运行视图。
const isRuntime = computed(
  () => !route.query.editor && !route.query.home && !!route.query.viewName
)

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

/* 仅在本组件挂载于 GVA 内容区时生效；切到别的页面后 :has() 不再匹配，
   样式自动失效，不改动任何 GVA 源文件，也不影响其它页面。 */
:global(#gva-base-load-dom:has(.scada-stage)) {
  position: relative;
}
</style>
