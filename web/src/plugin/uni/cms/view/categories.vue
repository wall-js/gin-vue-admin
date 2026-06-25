<template>
  <div>
    <LocaleSwitcher
      entity-type="term"
      :get-entity-id="() => selectedNode?.id"
      :can-translate="() => !!selectedNode"
      :on-translated="loadTerms"
    />

    <div class="gva-search-box">
      <div style="margin-bottom: 12px;">
        <h2 style="margin: 0;">{{ typeLabel }}管理</h2>
      </div>

      <!-- 树形模式（分类） -->
      <div v-if="hierarchical" class="tree-editor">
        <!-- Left: Draggable Tree -->
        <div class="tree-panel" v-loading="loading">
          <div class="tree-toolbar">
            <el-button type="primary" size="small" @click="handleAddRoot">
              <el-icon style="margin-right: 4px;"><Plus /></el-icon>
              新增顶级{{ typeLabel }}
            </el-button>
          </div>

          <div class="tree-drop-zone">
            <el-tree
              ref="treeRef"
              :data="treeData"
              node-key="id"
              default-expand-all
              draggable
              highlight-current
              :expand-on-click-node="false"
              :allow-drop="allowDrop"
              @node-click="handleNodeClick"
              @node-drop="handleNodeDrop"
              v-loading="dragging"
            >
              <template #default="{ node, data }">
                <div class="tree-node">
                  <span class="node-label">{{ getI18nText(data.name) }}</span>
                  <span class="node-slug">{{ data.slug }}</span>
                  <span class="node-actions">
                    <el-button type="primary" link size="small" @click.stop="handleAddChild(data)" title="添加子项">
                      <el-icon><Plus /></el-icon>
                    </el-button>
                    <el-popconfirm
                      :title="`确定删除「${getI18nText(data.name)}」及其子项？`"
                      @confirm="handleDelete(data)"
                    >
                      <template #reference>
                        <el-button type="danger" link size="small" @click.stop title="删除">
                          <el-icon><Delete /></el-icon>
                        </el-button>
                      </template>
                    </el-popconfirm>
                  </span>
                </div>
              </template>
            </el-tree>
          </div>

          <div v-if="!loading && treeData.length === 0" class="tree-empty">
            <el-empty :description="`暂无${typeLabel}，点击上方按钮新增`" :image-size="60" />
          </div>
        </div>

        <!-- Right: Edit Panel -->
        <div class="edit-panel" v-if="selectedNode">
          <h3 style="margin: 0 0 16px 0;">编辑{{ typeLabel }}</h3>
          <el-form :model="editForm" label-width="70px" size="default">
            <el-form-item v-if="hierarchical" label="父级">
              <el-select
                v-model="editForm.parentId"
                filterable
                placeholder="顶级（无父级）"
                clearable
                style="width: 100%;"
              >
                <el-option label="顶级（无父级）" :value="0" />
                <el-option
                  v-for="opt in parentOptions"
                  :key="opt.id"
                  :label="getI18nText(opt.name) || opt.slug"
                  :value="opt.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="名称" required>
              <el-input v-model="editName" :placeholder="`${typeLabel}名称`" />
            </el-form-item>
            <el-form-item label="Slug" required>
              <el-input v-model="editForm.slug" placeholder="URL slug" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="editDescription" type="textarea" :rows="3" placeholder="可选描述" />
            </el-form-item>
            <el-form-item label="排序">
              <el-input-number v-model="editForm.sortOrder" :min="0" />
            </el-form-item>
          </el-form>
          <div class="edit-actions">
            <el-button @click="clearSelection">取消</el-button>
            <el-button type="primary" @click="handleSaveEdit" :loading="saving">保存</el-button>
          </div>
        </div>
        <div class="edit-panel edit-placeholder" v-else>
          <el-empty description="选择左侧节点进行编辑" :image-size="60" />
        </div>
      </div>

      <!-- 扁平模式（标签） -->
      <div v-else class="tree-editor">
        <div class="tree-panel" v-loading="loading">
          <div class="tree-toolbar">
            <el-button type="primary" size="small" @click="handleAddRoot">
              <el-icon style="margin-right: 4px;"><Plus /></el-icon>
              新增{{ typeLabel }}
            </el-button>
          </div>

          <div class="tree-drop-zone">
            <el-tree
              ref="flatTreeRef"
              :data="flatTerms"
              node-key="id"
              draggable
              highlight-current
              :expand-on-click-node="false"
              :allow-drop="flatAllowDrop"
              @node-click="handleNodeClick"
              @node-drop="handleFlatNodeDrop"
            >
              <template #default="{ node, data }">
                <div class="tree-node">
                  <span class="node-label">{{ getI18nText(data.name) }}</span>
                  <span class="node-slug">{{ data.slug }}</span>
                  <span class="node-actions">
                    <el-popconfirm
                      :title="`确定删除「${getI18nText(data.name)}」？`"
                      @confirm="handleDelete(data)"
                    >
                      <template #reference>
                        <el-button type="danger" link size="small" @click.stop title="删除">
                          <el-icon><Delete /></el-icon>
                        </el-button>
                      </template>
                    </el-popconfirm>
                  </span>
                </div>
              </template>
            </el-tree>
          </div>

          <div v-if="!loading && flatTerms.length === 0" class="tree-empty">
            <el-empty :description="`暂无${typeLabel}，点击上方按钮新增`" :image-size="60" />
          </div>
        </div>

        <div class="edit-panel" v-if="selectedNode">
          <h3 style="margin: 0 0 16px 0;">编辑{{ typeLabel }}</h3>
          <el-form :model="editForm" label-width="70px" size="default">
            <el-form-item label="名称" required>
              <el-input v-model="editName" :placeholder="`${typeLabel}名称`" />
            </el-form-item>
            <el-form-item label="Slug" required>
              <el-input v-model="editForm.slug" placeholder="URL slug" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="editDescription" type="textarea" :rows="3" placeholder="可选描述" />
            </el-form-item>
            <el-form-item label="排序">
              <el-input-number v-model="editForm.sortOrder" :min="0" />
            </el-form-item>
          </el-form>
          <div class="edit-actions">
            <el-button @click="clearSelection">取消</el-button>
            <el-button type="primary" @click="handleSaveEdit" :loading="saving">保存</el-button>
          </div>
        </div>
        <div class="edit-panel edit-placeholder" v-else>
          <el-empty description="选择左侧标签进行编辑" :image-size="60" />
        </div>
      </div>
    </div>

    <!-- Quick Create Dialog -->
    <el-dialog
      v-model="createDialogVisible"
      :title="`新增${typeLabel}`"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="createForm" label-width="70px">
        <el-form-item label="名称" required>
          <el-input v-model="createName" :placeholder="`${typeLabel}名称`" />
        </el-form-item>
        <el-form-item label="Slug" required>
          <el-input v-model="createForm.slug" placeholder="URL slug" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createDescription" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="createForm.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import LocaleSwitcher from '../components/LocaleSwitcher.vue'
import { listTerms, createTerm, updateTerm, deleteTerm, batchReorderTerms } from '../api/term.js'
import { useCmsLocaleStore } from '../store/cmsLocale.js'

const props = defineProps({
  termType: { type: String, default: 'category' }
})

const cmsLocaleStore = useCmsLocaleStore()
const typeLabel = computed(() => props.termType === 'category' ? '分类' : '标签')
const hierarchical = computed(() => props.termType === 'category')

// ---- i18n helpers ----
const getI18nText = (val) => {
  if (!val) return ''
  const locale = cmsLocaleStore.activeLocale
  if (typeof val === 'string') {
    try {
      const obj = JSON.parse(val)
      return obj[locale] || obj.zh || obj.en || ''
    } catch { return val }
  }
  return val[locale] || val.zh || val.en || ''
}

const parseI18nField = (val) => {
  if (!val) return {}
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return {} }
  }
  return val
}

// ---- Data ----
const loading = ref(false)
const dragging = ref(false)
const flatTerms = ref([])

const loadTerms = async () => {
  loading.value = true
  try {
    const res = await listTerms({ type: props.termType })
    if (res.code === 0) {
      flatTerms.value = res.data.list || []
    }
  } catch (e) {
    console.error(`加载${typeLabel.value}列表失败:`, e)
  } finally {
    loading.value = false
  }
}

// Build tree from flat list
const treeData = computed(() => {
  const items = flatTerms.value
  const map = {}
  const roots = []
  for (const item of items) {
    map[item.id] = { ...item, children: [] }
  }
  for (const item of items) {
    const node = map[item.id]
    if (item.parentId && map[item.parentId]) {
      map[item.parentId].children.push(node)
    } else {
      roots.push(node)
    }
  }
  const clean = (nodes) => {
    for (const n of nodes) {
      if (n.children.length === 0) delete n.children
      else clean(n.children)
    }
  }
  clean(roots)
  return roots
})

// ---- Tree ref & selection ----
const treeRef = ref(null)
const flatTreeRef = ref(null)
const selectedId = ref(null)

// 获取当前激活的 tree ref
const activeTreeRef = computed(() => hierarchical.value ? treeRef.value : flatTreeRef.value)

const selectedNode = computed(() => {
  if (!selectedId.value) return null
  return flatTerms.value.find(t => t.id === selectedId.value) || null
})

const handleNodeClick = (data) => {
  selectedId.value = data.id
}

const clearSelection = () => {
  selectedId.value = null
  if (treeRef.value) treeRef.value.setCurrentKey(null)
  if (flatTreeRef.value) flatTreeRef.value.setCurrentKey(null)
}

// ---- Right panel edit form ----
const editForm = ref({ name: {}, slug: '', description: {}, sortOrder: 0, parentId: 0 })
const saving = ref(false)

const editName = computed({
  get() {
    const obj = editForm.value.name
    return (obj && typeof obj === 'object') ? (obj[cmsLocaleStore.activeLocale] || '') : ''
  },
  set(val) {
    if (!editForm.value.name || typeof editForm.value.name !== 'object') {
      editForm.value.name = {}
    }
    editForm.value.name[cmsLocaleStore.activeLocale] = val
  }
})

const editDescription = computed({
  get() {
    const obj = editForm.value.description
    return (obj && typeof obj === 'object') ? (obj[cmsLocaleStore.activeLocale] || '') : ''
  },
  set(val) {
    if (!editForm.value.description || typeof editForm.value.description !== 'object') {
      editForm.value.description = {}
    }
    editForm.value.description[cmsLocaleStore.activeLocale] = val
  }
})

// Watch selectedNode and populate editForm
watch(selectedNode, (node) => {
  if (node) {
    editForm.value = {
      name: parseI18nField(node.name),
      slug: node.slug || '',
      description: parseI18nField(node.description),
      sortOrder: node.sortOrder || 0,
      parentId: node.parentId || 0
    }
  }
})

const handleSaveEdit = async () => {
  if (!selectedId.value) return
  saving.value = true
  try {
    const data = {
      type: props.termType,
      parentId: editForm.value.parentId || 0,
      name: JSON.stringify(editForm.value.name),
      slug: editForm.value.slug,
      description: JSON.stringify(editForm.value.description),
      sortOrder: editForm.value.sortOrder
    }
    const res = await updateTerm(selectedId.value, data)
    if (res.code === 0) {
      ElMessage.success('保存成功')
      await loadTerms()
      await nextTick()
      if (activeTreeRef.value && selectedId.value) {
        activeTreeRef.value.setCurrentKey(selectedId.value)
      }
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    console.error('保存失败:', e)
  } finally {
    saving.value = false
  }
}

// ---- Drag & Drop ----
const allowDrop = (draggingNode, dropNode, type) => {
  // 只允许同级拖放排序（prev/next），不允许嵌套改变父级
  return type !== 'inner'
}

// 扁平模式：只允许 prev/next，禁止 inner（不允许嵌套）
const flatAllowDrop = (draggingNode, dropNode, type) => {
  return type !== 'inner'
}

const handleFlatNodeDrop = async (draggingNode, dropNode, dropType) => {
  const siblings = dropNode.parent?.childNodes || flatTreeRef.value?.store?.root?.childNodes || []
  const moves = siblings.map((node, index) => ({
    id: node.data.id,
    parentId: 0,
    sortOrder: index
  }))

  dragging.value = true
  try {
    const res = await batchReorderTerms(moves)
    if (res.code === 0) {
      ElMessage.success('排序已更新')
      await loadTerms()
    } else {
      ElMessage.error(res.msg || '排序失败')
      await loadTerms()
    }
  } catch (e) {
    console.error('拖拽排序失败:', e)
    await loadTerms()
  } finally {
    dragging.value = false
  }
}

const handleNodeDrop = async (draggingNode, dropNode, dropType) => {
  const siblings = dropNode.parent?.childNodes || treeRef.value?.store?.root?.childNodes || []
  const parentId = dropNode.parent?.data?.id || 0

  const moves = siblings.map((node, index) => ({
    id: node.data.id,
    parentId: parentId,
    sortOrder: index
  }))

  dragging.value = true
  try {
    const res = await batchReorderTerms(moves)
    if (res.code === 0) {
      ElMessage.success('排序已更新')
      await loadTerms()
      await nextTick()
      if (activeTreeRef.value && selectedId.value) {
        activeTreeRef.value.setCurrentKey(selectedId.value)
      }
    } else {
      ElMessage.error(res.msg || '排序失败')
      await loadTerms()
    }
  } catch (e) {
    console.error('拖拽排序失败:', e)
    await loadTerms()
  } finally {
    dragging.value = false
  }
}

// ---- Parent options for hierarchical edit ----
const parentOptions = computed(() => {
  if (!hierarchical.value) return []
  return flatTerms.value.filter(t => t.id !== selectedId.value)
})

// ---- Create new ----
const createDialogVisible = ref(false)
const createForm = ref({ parentId: 0, name: {}, slug: '', description: {}, sortOrder: 0 })

const createName = computed({
  get() {
    const obj = createForm.value.name
    return (obj && typeof obj === 'object') ? (obj[cmsLocaleStore.activeLocale] || '') : ''
  },
  set(val) {
    if (!createForm.value.name || typeof createForm.value.name !== 'object') {
      createForm.value.name = {}
    }
    createForm.value.name[cmsLocaleStore.activeLocale] = val
  }
})

const createDescription = computed({
  get() {
    const obj = createForm.value.description
    return (obj && typeof obj === 'object') ? (obj[cmsLocaleStore.activeLocale] || '') : ''
  },
  set(val) {
    if (!createForm.value.description || typeof createForm.value.description !== 'object') {
      createForm.value.description = {}
    }
    createForm.value.description[cmsLocaleStore.activeLocale] = val
  }
})

const handleAddRoot = () => {
  createForm.value = { parentId: 0, name: {}, slug: '', description: {}, sortOrder: treeData.value.length }
  createDialogVisible.value = true
}

const handleAddChild = (parentNode) => {
  createForm.value = {
    parentId: parentNode.id,
    name: {},
    slug: '',
    description: {},
    sortOrder: (parentNode.children || []).length
  }
  createDialogVisible.value = true
}

const handleCreate = async () => {
  saving.value = true
  try {
    const data = {
      type: props.termType,
      ...createForm.value,
      parentId: createForm.value.parentId || 0,
      name: JSON.stringify(createForm.value.name),
      description: JSON.stringify(createForm.value.description)
    }
    const res = await createTerm(data)
    if (res.code === 0) {
      ElMessage.success('创建成功')
      createDialogVisible.value = false
      await loadTerms()
      // Auto-select the newly created node
      await nextTick()
      const items = flatTerms.value
      if (items.length > 0) {
        const newest = items[items.length - 1]
        selectedId.value = newest.id
        if (activeTreeRef.value) {
          activeTreeRef.value.setCurrentKey(newest.id)
        }
      }
    } else {
      ElMessage.error(res.msg || '创建失败')
    }
  } catch (e) {
    console.error('创建失败:', e)
  } finally {
    saving.value = false
  }
}

// ---- Delete ----
const handleDelete = async (data) => {
  try {
    const res = await deleteTerm(data.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      if (selectedId.value === data.id) {
        selectedId.value = null
      }
      await loadTerms()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (e) {
    console.error('删除失败:', e)
  }
}

onMounted(() => {
  loadTerms()
  cmsLocaleStore.init()
})
</script>

<style scoped>
.gva-search-box {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}

.tree-editor {
  display: flex;
  gap: 20px;
  min-height: 420px;
}

.tree-drop-zone {
  min-height: 300px;
  flex: 1;
}

.tree-panel {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  border-radius: 4px;
  padding: 12px;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.tree-toolbar {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
}

.edit-panel {
  width: 50%;
  flex-shrink: 0;
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  border-radius: 4px;
  padding: 20px;
  background: var(--el-fill-color-lighter, #f5f7fa);
}

.edit-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter, #ebeef5);
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  padding-right: 8px;
  font-size: 14px;
}

.node-label {
  font-weight: 500;
}

.node-slug {
  color: var(--el-text-color-secondary, #909399);
  font-size: 12px;
}

.node-actions {
  margin-left: auto;
  display: none;
  gap: 2px;
}

.tree-node:hover .node-actions {
  display: flex;
}

.tree-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
</style>
