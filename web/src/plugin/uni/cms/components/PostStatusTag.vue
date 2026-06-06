<template>
  <el-tag :type="tagType" size="small">{{ label }}</el-tag>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: Number,
    required: true
  }
})

const tagType = computed(() => {
  switch (props.status) {
    case 1: return 'info'    // 草稿
    case 2: return 'success' // 已发布
    case 3: return 'warning' // 已归档
    default: return 'info'
  }
})

const label = computed(() => {
  switch (props.status) {
    case 1: return '草稿'
    case 2: return '已发布'
    case 3: return '已归档'
    default: return '未知'
  }
})
</script>
