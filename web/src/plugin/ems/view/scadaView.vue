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

// 组态画布由 Skill 按此设计尺寸生成。FUXA 不会等比缩放视图（官方 autoresize
// 是 stretch 非等比），所以运行视图按原尺寸渲染后由本组件整体等比缩放。
const DESIGN_WIDTH = 1920+7
const DESIGN_HEIGHT = 1080+50

// FUXA 1.3.4-2890 的 dark-theme 下 body 背景仍是白色，视口底部固定留 46px 纯白
// （1920x1080 / 1600x900 实测一致）。按「有效内容高度」缩放并用裁切容器挡掉它。
const BOTTOM_BLANK = 46
const CONTENT_HEIGHT = DESIGN_HEIGHT - BOTTOM_BLANK

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
      viewport.value.w / DESIGN_WIDTH,
      viewport.value.h / CONTENT_HEIGHT
    ) || 1
  )
})

// 裁切窗口 = 缩放后的「有效内容」尺寸，居中放置。
// iframe 视觉高度比它多出 BOTTOM_BLANK * scale，正好是那条白边，被 overflow 裁掉。
const clipStyle = computed(() => {
  if (!isRuntime.value) return { inset: '0' }
  const w = DESIGN_WIDTH * scale.value
  const h = CONTENT_HEIGHT * scale.value
  return {
    width: `${w}px`,
    height: `${h}px`,
    // left: `${Math.max(0, (viewport.value.w - w) / 2)}px`,
    // top: `${Math.max(0, (viewport.value.h - h) / 2)}px`
  }
})

const frameStyle = computed(() => {
  if (!isRuntime.value) {
    return { width: '100%', height: '100%' }
  }
  return {
    width: `${DESIGN_WIDTH}px`,
    height: `${DESIGN_HEIGHT}px`,
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
