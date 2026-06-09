<template>
  <div class="i18n-input-single">
    <div class="locale-label">{{ localeLabel }} ({{ activeLocale }})</div>
    <el-input
      v-if="type === 'textarea'"
      type="textarea"
      :rows="rows"
      :model-value="currentValue"
      :placeholder="placeholder"
      @update:model-value="updateValue"
    />
    <el-input
      v-else
      :model-value="currentValue"
      :placeholder="placeholder"
      @update:model-value="updateValue"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCmsLocaleStore } from '../store/cmsLocale.js'

const props = defineProps({
  modelValue: {
    type: [Object, String],
    default: () => ({})
  },
  locales: {
    type: Array,
    default: () => ['zh', 'en']
  },
  type: {
    type: String,
    default: 'text'
  },
  rows: {
    type: Number,
    default: 3
  },
  placeholder: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const cmsLocaleStore = useCmsLocaleStore()

// 当前编辑的语言（从全局 store 获取，降级到 locales prop）
const activeLocale = computed(() => {
  return cmsLocaleStore.activeLocale || props.locales[0] || 'zh'
})

// 解析 I18nText
const parsedValue = computed(() => {
  if (!props.modelValue) return {}
  if (typeof props.modelValue === 'string') {
    try {
      return JSON.parse(props.modelValue)
    } catch {
      return { [props.locales[0]]: props.modelValue }
    }
  }
  return props.modelValue
})

// 当前语言的值
const currentValue = computed(() => {
  return parsedValue.value[activeLocale.value] || ''
})

const localeLabels = { zh: '中文', en: 'English', ar: 'العربية', ru: 'Русский' }
const localeLabel = computed(() => localeLabels[activeLocale.value] || activeLocale.value.toUpperCase())

const updateValue = (val) => {
  const newVal = { ...parsedValue.value }
  newVal[activeLocale.value] = val
  emit('update:modelValue', newVal)
}
</script>

<style scoped>
.i18n-input-single {
  width: 100%;
}
.locale-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}
</style>
