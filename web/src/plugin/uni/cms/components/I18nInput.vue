<template>
  <div class="i18n-input">
    <el-tabs v-model="activeLocale" type="border-card" class="i18n-tabs">
      <el-tab-pane
        v-for="locale in locales"
        :key="locale"
        :label="localeLabel(locale)"
        :name="locale"
      >
        <el-input
          v-if="type === 'textarea'"
          type="textarea"
          :rows="rows"
          :model-value="getLocaleValue(locale)"
          :placeholder="placeholder"
          @update:model-value="(val) => updateLocaleValue(locale, val)"
        />
        <el-input
          v-else
          :model-value="getLocaleValue(locale)"
          :placeholder="placeholder"
          @update:model-value="(val) => updateLocaleValue(locale, val)"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

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
    default: 'text' // text | textarea
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

const activeLocale = ref(props.locales[0] || 'zh')

// 解析 I18nText：可能是 JSON 字符串或 Object
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

const localeLabels = { zh: '中文', en: 'English', ar: 'العربية', ru: 'Русский' }

const localeLabel = (locale) => localeLabels[locale] || locale.toUpperCase()

const getLocaleValue = (locale) => {
  return parsedValue.value[locale] || ''
}

const updateLocaleValue = (locale, val) => {
  const newVal = { ...parsedValue.value }
  newVal[locale] = val
  emit('update:modelValue', newVal)
}

// 切换默认语言
watch(() => props.locales, (newLocales) => {
  if (newLocales.length > 0 && !newLocales.includes(activeLocale.value)) {
    activeLocale.value = newLocales[0]
  }
})
</script>

<style scoped>
.i18n-input {
  width: 100%;
}
.i18n-tabs :deep(.el-tabs__content) {
  padding: 8px;
}
.i18n-tabs :deep(.el-tab-pane) {
  min-height: 32px;
}
</style>
