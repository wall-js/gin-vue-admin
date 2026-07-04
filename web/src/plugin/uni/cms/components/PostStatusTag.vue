<template>
  <el-tag :type="tagType" size="small">{{ label }}</el-tag>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  status: {
    type: Number,
    required: true
  }
})

const tagType = computed(() => {
  switch (props.status) {
    case 1: return 'info'
    case 2: return 'success'
    case 3: return 'warning'
    default: return 'info'
  }
})

const label = computed(() => {
  switch (props.status) {
    case 1: return t('plugins.uni.postStatus.draft')
    case 2: return t('plugins.uni.postStatus.published')
    case 3: return t('plugins.uni.postStatus.archived')
    default: return t('plugins.uni.unknown')
  }
})
</script>
