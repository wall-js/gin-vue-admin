<template>
  <el-tree-select
    v-if="loaded"
    v-model="selectedValue"
    :data="treeData"
    :props="treeProps"
    :placeholder="placeholder"
    :multiple="multiple"
    check-strictly
    :render-after-expand="false"
    clearable
    style="width: 100%"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { listTerms } from '../api/term.js'

const props = defineProps({
  modelValue: {
    type: [Number, Array],
    default: null
  },
  type: {
    type: String,
    default: 'category'
  },
  placeholder: {
    type: String,
    default: '请选择'
  },
  multiple: {
    type: Boolean,
    default: false
  },
  /** 可选：排除某些节点（如编辑时排除自身） */
  excludeId: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue'])

const treeProps = {
  label: 'label',
  value: 'value',
  children: 'children'
}

const rawTerms = ref([])
const loaded = ref(false)

const selectedValue = computed({
  get() { return props.modelValue },
  set(val) { emit('update:modelValue', val) }
})

// 解析 I18nText
const getI18nText = (val) => {
  if (!val) return ''
  if (typeof val === 'string') {
    try {
      const obj = JSON.parse(val)
      return obj.zh || obj.en || val
    } catch { return val }
  }
  return val.zh || val.en || ''
}

// 将扁平列表构建为树结构
const buildTree = (items, excludeId) => {
  const filtered = excludeId ? items.filter(i => i.id !== excludeId) : items
  const map = {}
  const roots = []
  // 先建索引
  for (const item of filtered) {
    map[item.id] = {
      value: item.id,
      label: getI18nText(item.name),
      children: []
    }
  }
  // 组装树
  for (const item of filtered) {
    const node = map[item.id]
    if (item.parentId && map[item.parentId]) {
      map[item.parentId].children.push(node)
    } else {
      roots.push(node)
    }
  }
  // 移除空 children 数组（让 el-tree-select 正确展示叶子节点）
  const clean = (nodes) => {
    for (const n of nodes) {
      if (n.children.length === 0) {
        delete n.children
      } else {
        clean(n.children)
      }
    }
  }
  clean(roots)
  return roots
}

const treeData = computed(() => buildTree(rawTerms.value, props.excludeId))

const loadTerms = async () => {
  try {
    const res = await listTerms({ type: props.type })
    if (res.code === 0) {
      rawTerms.value = res.data.list || []
    }
  } catch (e) {
    console.error('加载分类/标签失败:', e)
  } finally {
    loaded.value = true
  }
}

// 暴露刷新方法，供父组件在增删改后调用
const refresh = () => loadTerms()
defineExpose({ refresh })

onMounted(() => {
  loadTerms()
})
</script>
