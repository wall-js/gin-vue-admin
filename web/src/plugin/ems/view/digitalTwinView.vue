<template>
  <div class="twin-blank"></div>
</template>

<script setup>
// 三维视图占位页。菜单由 MCP 创建：组态监控 → 三维视图（ID 52）。
// 3D 渲染方案未审核前保持空白：不引入依赖、不连接 FUXA、不加载模型。
</script>

<style scoped>
.twin-blank {
  position: absolute;
  inset: 0;
}

:global(#gva-base-load-dom:has(.twin-blank)) {
  position: relative;
}
</style>
