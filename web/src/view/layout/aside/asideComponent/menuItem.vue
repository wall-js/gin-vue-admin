<template>
  <el-menu-item
    :index="routerInfo.name"
    :style="{
          height: sideHeight
        }"
  >
    <el-icon v-if="routerInfo.meta.icon">
      <component :is="routerInfo.meta.icon" />
    </el-icon>
    <template v-else>
      {{ isCollapse ? t(routerInfo.meta.title)[0] : "" }}
    </template>
    <template #title>
      {{ t(routerInfo.meta.title) }}
    </template>
  </el-menu-item>
</template>

<script setup>
import {computed, inject} from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useAppStore } from '@/pinia'
  import { storeToRefs } from 'pinia'
  const { t } = useI18n()
  const appStore = useAppStore()
  const { config } = storeToRefs(appStore)

  defineOptions({
    name: 'MenuItem'
  })

  defineProps({
    routerInfo: {
      default: function () {
        return null
      },
      type: Object
    }
  })

const isCollapse = inject('isCollapse', {
  default: false
})

  const sideHeight = computed(() => {
    return config.value.layout_side_item_height + 'px'
  })
</script>

<style lang="scss"></style>
