<template>
  <el-select
    v-model="selectedIds"
    multiple
    :placeholder="placeholder"
    style="width: 100%"
  >
    <el-option
      v-for="item in options"
      :key="item.id"
      :label="getI18nText(item.name)"
      :value="item.id"
    />
  </el-select>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { listTerms } from '../api/term.js'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  type: {
    type: String,
    default: 'category' // category | tag
  },
  placeholder: {
    type: String,
    default: '请选择'
  }
})

const emit = defineEmits(['update:modelValue'])

const selectedIds = ref([...props.modelValue])
const options = ref([])

// 解析 I18nText
const getI18nText = (val) => {
  if (!val) return ''
  if (typeof val === 'string') {
    try {
      const obj = JSON.parse(val)
      return obj.zh || obj.en || val
    } catch {
      return val
    }
  }
  return val.zh || val.en || ''
}

const loadTerms = async () => {
  try {
    const res = await listTerms({ type: props.type })
    if (res.code === 0) {
      options.value = res.data.list || []
    }
  } catch (e) {
    console.error('加载分类/标签失败:', e)
  }
}

watch(selectedIds, (val) => {
  emit('update:modelValue', val)
}, { deep: true })

watch(() => props.modelValue, (val) => {
  selectedIds.value = [...val]
}, { deep: true })

onMounted(() => {
  loadTerms()
})
</script>
