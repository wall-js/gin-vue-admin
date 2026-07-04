<template>
  <div>
    <LocaleSwitcher
      entity-type="menu"
      :get-entity-id="() => selectedNode?.id"
      :can-translate="() => !!selectedNode"
      :on-translated="loadTree"
    />

    <div class="gva-search-box">
      <div style="margin-bottom: 12px;">
        <h2 style="margin: 0;">{{ t('plugins.uni.menus.management') }}</h2>
      </div>

      <div class="tree-editor">
        <!-- Left: Draggable Tree -->
        <div class="tree-panel" v-loading="loading">
          <div class="tree-toolbar">
            <el-button type="primary" size="small" @click="openCreateContainerDialog">
              <el-icon style="margin-right: 4px;"><Plus /></el-icon>
              {{ t('plugins.uni.menus.newContainer') }}
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
              @node-drag-start="handleDragStart"
              @node-drop="handleNodeDrop"
              v-loading="dragging"
            >
              <template #default="{ node, data }">
                <div class="tree-node">
                  <span class="node-label">{{ getI18nText(data.name) }}</span>
                  <el-tag v-if="data.isContainer" size="small" type="info" class="node-tag">{{ data.slug }}</el-tag>
                  <el-tag v-else size="small" class="node-tag">{{ getItemMeta(data.metaJson).type || 'url' }}</el-tag>
                  <span v-if="!data.isContainer" class="node-url">{{ getItemMeta(data.metaJson).url || '' }}</span>
                  <span class="node-actions">
                    <el-button
                      v-if="data.isContainer"
                      type="primary"
                      link
                      size="small"
                      @click.stop="handleAddItem(data)"
                      :title="t('plugins.uni.menus.addMenuItem')"
                    >
                      <el-icon><Plus /></el-icon>
                    </el-button>
                    <el-button
                      v-if="!data.isContainer"
                      type="primary"
                      link
                      size="small"
                      @click.stop="handleAddChild(data)"
                      :title="t('plugins.uni.menus.addChild')"
                    >
                      <el-icon><Plus /></el-icon>
                    </el-button>
                    <el-popconfirm
                      :title="t('plugins.uni.menus.deleteConfirm', { name: getI18nText(data.name) })"
                      @confirm="handleDelete(data)"
                    >
                      <template #reference>
                        <el-button type="danger" link size="small" @click.stop :title="t('plugins.uni.delete')">
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
            <el-empty :description="t('plugins.uni.menus.emptyHint')" :image-size="60" />
          </div>
        </div>

        <!-- Right: Edit Panel -->
        <div class="edit-panel" v-if="selectedNode">
          <!-- Container Edit Form -->
          <template v-if="selectedNode.isContainer">
            <h3 style="margin: 0 0 16px 0;">{{ t('plugins.uni.menus.editContainer') }}</h3>
            <el-form :model="containerEditForm" label-width="80px" size="default">
              <el-form-item :label="t('plugins.uni.menus.name')" required>
                <el-input v-model="containerEditName" :placeholder="t('plugins.uni.menus.namePlaceholder')" />
              </el-form-item>
              <el-form-item :label="t('plugins.uni.menus.renderPosition')" required>
                <el-select v-model="containerEditForm.slug" filterable allow-create :placeholder="t('plugins.uni.menus.selectRenderPosition')">
                  <el-option :label="t('plugins.uni.menus.mainNav')" value="main" />
                  <el-option :label="t('plugins.uni.menus.footerNav')" value="footer" />
                  <el-option :label="t('plugins.uni.menus.externalNav')" value="external" />
                </el-select>
              </el-form-item>
              <el-form-item :label="t('plugins.uni.categories.sortOrder')">
                <el-input-number v-model="containerEditForm.sortOrder" :min="0" />
              </el-form-item>
            </el-form>
            <div class="edit-actions">
              <el-button @click="clearSelection">{{ t('plugins.uni.cancel') }}</el-button>
              <el-button type="primary" @click="handleSaveContainer" :loading="saving">{{ t('plugins.uni.save') }}</el-button>
            </div>
          </template>

          <!-- Item Edit Form -->
          <template v-else>
            <h3 style="margin: 0 0 16px 0;">{{ t('plugins.uni.menus.editMenuItem') }}</h3>
            <el-form :model="itemEditForm" label-width="80px" size="default">
              <el-form-item :label="t('plugins.uni.menus.name')" required>
                <el-input v-model="itemEditName" :placeholder="t('plugins.uni.menus.menuItemName')" />
              </el-form-item>
              <el-form-item label="Slug" required>
                <el-input v-model="itemEditForm.slug" placeholder="URL slug" />
              </el-form-item>
              <el-form-item :label="t('plugins.uni.menus.container')">
                <el-select
                  v-model="itemEditContainerId"
                  filterable
                  :placeholder="t('plugins.uni.menus.selectContainer')"
                  style="width: 100%;"
                >
                  <el-option
                    v-for="c in containerOptions"
                    :key="c.id"
                    :label="getI18nText(c.name) || c.slug"
                    :value="c.id"
                  />
                </el-select>
              </el-form-item>

              <el-divider content-position="left">{{ t('plugins.uni.menus.linkConfig') }}</el-divider>

              <el-form-item :label="t('plugins.uni.menus.type')">
                <el-select v-model="itemEditMeta.type" :placeholder="t('plugins.uni.menus.selectType')">
                  <el-option :label="t('plugins.uni.menus.customUrl')" value="url" />
                  <el-option :label="t('plugins.uni.menus.page')" value="page" />
                  <el-option :label="t('plugins.uni.menus.post')" value="post" />
                  <el-option :label="t('plugins.uni.menus.category')" value="category" />
                  <el-option :label="t('plugins.uni.menus.tag')" value="tag" />
                </el-select>
              </el-form-item>
              <el-form-item label="URL">
                <el-input v-model="itemEditMeta.url" :placeholder="t('plugins.uni.menus.linkAddress')" />
              </el-form-item>
              <el-form-item :label="t('plugins.uni.menus.target')">
                <el-select v-model="itemEditMeta.target">
                  <el-option :label="t('plugins.uni.menus.targetSelf')" value="_self" />
                  <el-option :label="t('plugins.uni.menus.targetBlank')" value="_blank" />
                </el-select>
              </el-form-item>
              <el-form-item :label="t('plugins.uni.categories.sortOrder')">
                <el-input-number v-model="itemEditForm.sortOrder" :min="0" />
              </el-form-item>
            </el-form>
            <div class="edit-actions">
              <el-button @click="clearSelection">{{ t('plugins.uni.cancel') }}</el-button>
              <el-button type="primary" @click="handleSaveItem" :loading="saving">{{ t('plugins.uni.save') }}</el-button>
            </div>
          </template>
        </div>
        <div class="edit-panel edit-placeholder" v-else>
          <el-empty :description="t('plugins.uni.categories.selectNodeHint')" :image-size="60" />
        </div>
      </div>
    </div>

    <!-- Create Container Dialog -->
    <el-dialog
      v-model="createContainerVisible"
      :title="t('plugins.uni.menus.newContainerDialog')"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="createForm" label-width="80px">
        <el-form-item :label="t('plugins.uni.menus.name')" required>
          <el-input v-model="createContainerName" :placeholder="t('plugins.uni.menus.namePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.menus.renderPosition')" required>
          <el-select v-model="createForm.slug" filterable allow-create :placeholder="t('plugins.uni.menus.selectRenderPosition')">
            <el-option :label="t('plugins.uni.menus.mainNav')" value="main" />
            <el-option :label="t('plugins.uni.menus.footerNav')" value="footer" />
            <el-option :label="t('plugins.uni.menus.externalNav')" value="external" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('plugins.uni.categories.sortOrder')">
          <el-input-number v-model="createForm.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createContainerVisible = false">{{ t('plugins.uni.cancel') }}</el-button>
        <el-button type="primary" @click="handleCreateContainer" :loading="saving">{{ t('plugins.uni.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- Create Item Dialog -->
    <el-dialog
      v-model="createItemVisible"
      :title="createItemTitle"
      width="550px"
      :close-on-click-modal="false"
    >
      <el-form :model="createItemForm" label-width="80px">
        <el-form-item :label="t('plugins.uni.menus.name')" required>
          <el-input v-model="createItemName" :placeholder="t('plugins.uni.menus.menuItemName')" />
        </el-form-item>
        <el-form-item label="Slug" required>
          <el-input v-model="createItemForm.slug" placeholder="URL slug" />
        </el-form-item>

        <el-divider content-position="left">{{ t('plugins.uni.menus.linkConfig') }}</el-divider>

        <el-form-item :label="t('plugins.uni.menus.type')">
          <el-select v-model="createItemMeta.type" :placeholder="t('plugins.uni.menus.selectType')">
            <el-option :label="t('plugins.uni.menus.customUrl')" value="url" />
            <el-option :label="t('plugins.uni.menus.page')" value="page" />
            <el-option :label="t('plugins.uni.menus.post')" value="post" />
            <el-option :label="t('plugins.uni.menus.category')" value="category" />
            <el-option :label="t('plugins.uni.menus.tag')" value="tag" />
          </el-select>
        </el-form-item>
        <el-form-item label="URL">
          <el-input v-model="createItemMeta.url" :placeholder="t('plugins.uni.menus.linkAddress')" />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.menus.target')">
          <el-select v-model="createItemMeta.target">
            <el-option :label="t('plugins.uni.menus.targetSelf')" value="_self" />
            <el-option :label="t('plugins.uni.menus.targetBlank')" value="_blank" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('plugins.uni.categories.sortOrder')">
          <el-input-number v-model="createItemForm.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createItemVisible = false">{{ t('plugins.uni.cancel') }}</el-button>
        <el-button type="primary" @click="handleCreateItem" :loading="saving">{{ t('plugins.uni.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import LocaleSwitcher from '../components/LocaleSwitcher.vue'
import {
  getMenuTree, batchReorderMenu,
  createMenuContainer, updateMenuContainer, deleteMenuContainer,
  createMenuItem, updateMenuItem, deleteMenuItem
} from '../api/menu.js'
import { useCmsLocaleStore } from '../store/cmsLocale.js'

const { t } = useI18n()
const cmsLocaleStore = useCmsLocaleStore()

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

const getItemMeta = (metaJson) => {
  if (!metaJson) return {}
  try { return JSON.parse(metaJson) } catch { return {} }
}

// ---- Tree Data ----
const loading = ref(false)
const dragging = ref(false)
const dragStartContainerId = ref(null) // 拖拽开始时的原始容器 ID
const treeData = ref([])
const flatNodes = ref([]) // flat list of all nodes for lookup

const loadTree = async () => {
  loading.value = true
  try {
    const res = await getMenuTree()
    if (res.code === 0) {
      treeData.value = res.data.tree || []
      buildFlatNodes(treeData.value)
    }
  } catch (e) {
    console.error('加载菜单树失败:', e)
  } finally {
    loading.value = false
  }
}

const buildFlatNodes = (nodes, result = []) => {
  for (const n of (nodes || [])) {
    result.push(n)
    if (n.children && n.children.length > 0) {
      buildFlatNodes(n.children, result)
    }
  }
  flatNodes.value = result
}

// Find container ID for a given node (walk up the tree)
const findContainerId = (nodeId) => {
  // BFS to find the ancestor container
  const findPath = (nodes, targetId, path = []) => {
    for (const n of nodes) {
      const currentPath = [...path, n]
      if (n.id === targetId) return currentPath
      if (n.children && n.children.length > 0) {
        const found = findPath(n.children, targetId, currentPath)
        if (found) return found
      }
    }
    return null
  }
  const path = findPath(treeData.value, nodeId)
  if (!path || path.length === 0) return null
  return path[0].id // container is always the root of the path
}

// ---- Tree ref & selection ----
const treeRef = ref(null)
const selectedId = ref(null)
const selectedNode = computed(() => {
  if (!selectedId.value) return null
  return flatNodes.value.find(n => n.id === selectedId.value) || null
})

const handleNodeClick = (data) => {
  selectedId.value = data.id
}

const clearSelection = () => {
  selectedId.value = null
  if (treeRef.value) treeRef.value.setCurrentKey(null)
}

// ---- Container Edit Form ----
const containerEditForm = ref({ name: {}, slug: '', sortOrder: 0 })
const containerEditName = computed({
  get() {
    const obj = containerEditForm.value.name
    return (obj && typeof obj === 'object') ? (obj[cmsLocaleStore.activeLocale] || '') : ''
  },
  set(val) {
    if (!containerEditForm.value.name || typeof containerEditForm.value.name !== 'object') {
      containerEditForm.value.name = {}
    }
    containerEditForm.value.name[cmsLocaleStore.activeLocale] = val
  }
})

// ---- Item Edit Form ----
const itemEditForm = ref({ name: {}, slug: '', sortOrder: 0 })
const itemEditMeta = ref({ type: 'url', url: '', target: '_self', object_id: 0 })
const itemEditContainerId = ref(0)
const itemEditName = computed({
  get() {
    const obj = itemEditForm.value.name
    return (obj && typeof obj === 'object') ? (obj[cmsLocaleStore.activeLocale] || '') : ''
  },
  set(val) {
    if (!itemEditForm.value.name || typeof itemEditForm.value.name !== 'object') {
      itemEditForm.value.name = {}
    }
    itemEditForm.value.name[cmsLocaleStore.activeLocale] = val
  }
})

// Watch selectedNode → populate edit form
watch(selectedNode, (node) => {
  if (!node) return
  if (node.isContainer) {
    containerEditForm.value = {
      name: parseI18nField(node.name),
      slug: node.slug || '',
      sortOrder: node.sortOrder || 0
    }
  } else {
    itemEditForm.value = {
      name: parseI18nField(node.name),
      slug: node.slug || '',
      sortOrder: node.sortOrder || 0
    }
    itemEditMeta.value = { ...{ type: 'url', url: '', target: '_self', object_id: 0 }, ...getItemMeta(node.metaJson) }
    itemEditContainerId.value = findContainerId(node.id) || 0
  }
})

// ---- Save Container ----
const saving = ref(false)

const handleSaveContainer = async () => {
  if (!selectedId.value) return
  saving.value = true
  try {
    const data = {
      name: JSON.stringify(containerEditForm.value.name),
      slug: containerEditForm.value.slug,
      sortOrder: containerEditForm.value.sortOrder
    }
    const res = await updateMenuContainer(selectedId.value, data)
    if (res.code === 0) {
      ElMessage.success(t('plugins.uni.saveSuccess'))
      await loadTree()
      await nextTick()
      if (treeRef.value && selectedId.value) treeRef.value.setCurrentKey(selectedId.value)
    } else {
      ElMessage.error(res.msg || t('plugins.uni.saveFailed'))
    }
  } catch (e) {
    console.error('保存容器失败:', e)
  } finally {
    saving.value = false
  }
}

// ---- Container options for item parent selector ----
const containerOptions = computed(() => {
  return treeData.value.filter(n => n.isContainer)
})

// ---- Save Item ----
const handleSaveItem = async () => {
  if (!selectedId.value) return
  saving.value = true
  try {
    const data = {
      name: JSON.stringify(itemEditForm.value.name),
      slug: itemEditForm.value.slug,
      sortOrder: itemEditForm.value.sortOrder,
      metaJson: JSON.stringify(itemEditMeta.value)
    }
    // If container changed, include new containerId in data
    const currentContainerId = findContainerId(selectedId.value) || 0
    if (itemEditContainerId.value && itemEditContainerId.value !== currentContainerId) {
      data.containerId = itemEditContainerId.value
    }
    const res = await updateMenuItem(selectedId.value, data)
    if (res.code === 0) {
      ElMessage.success(t('plugins.uni.saveSuccess'))
      await loadTree()
      await nextTick()
      if (treeRef.value && selectedId.value) treeRef.value.setCurrentKey(selectedId.value)
    } else {
      ElMessage.error(res.msg || t('plugins.uni.saveFailed'))
    }
  } catch (e) {
    console.error('保存菜单项失败:', e)
  } finally {
    saving.value = false
  }
}

// ---- Drag & Drop ----
const handleDragStart = (node) => {
  // 在 DOM 变更前记录菜单项的原始容器 ID
  if (!node.data.isContainer) {
    dragStartContainerId.value = findContainerId(node.data.id)
  } else {
    dragStartContainerId.value = null
  }
}

const allowDrop = (draggingNode, dropNode, type) => {
  // 只允许同级拖放排序（prev/next），不允许嵌套改变父级
  if (type === 'inner') return false
  // 容器只能与容器互换
  if (draggingNode.data.isContainer) return dropNode.data.isContainer
  // 菜单项只能与菜单项互换
  return !dropNode.data.isContainer
}

const handleNodeDrop = async (draggingNode, dropNode, dropType) => {
  const moves = []

  if (draggingNode.data.isContainer) {
    // 容器同级排序
    const containerSiblings = dropNode.parent?.childNodes || treeRef.value?.store?.root?.childNodes || []
    for (let i = 0; i < containerSiblings.length; i++) {
      moves.push({ id: containerSiblings[i].data.id, parentId: null, sortOrder: i })
    }
  } else {
    // 菜单项排序 — 新容器下的所有子项
    const newSiblings = dropNode.parent?.childNodes || []
    const newParentId = dropNode.parent?.data?.id || 0
    for (let i = 0; i < newSiblings.length; i++) {
      moves.push({ id: newSiblings[i].data.id, parentId: newParentId, sortOrder: i })
    }

    // 跨容器拖拽时，旧容器的剩余子项也需要重新计算 sortOrder
    const oldContainerId = dragStartContainerId.value
    if (oldContainerId && oldContainerId !== newParentId) {
      const oldContainerNode = treeRef.value?.getNode(oldContainerId)
      if (oldContainerNode && oldContainerNode.childNodes) {
        for (let i = 0; i < oldContainerNode.childNodes.length; i++) {
          moves.push({ id: oldContainerNode.childNodes[i].data.id, parentId: oldContainerId, sortOrder: i })
        }
      }
    }
  }

  dragging.value = true
  try {
    const res = await batchReorderMenu(moves)
    if (res.code === 0) {
      ElMessage.success(t('plugins.uni.categories.sortUpdated'))
      await loadTree()
      await nextTick()
      if (treeRef.value && selectedId.value) treeRef.value.setCurrentKey(selectedId.value)
    } else {
      ElMessage.error(res.msg || t('plugins.uni.loadFailed'))
      await loadTree()
    }
  } catch (e) {
    console.error('拖拽排序失败:', e)
    await loadTree()
  } finally {
    dragging.value = false
  }
}

// ---- Create Container Dialog ----
const createContainerVisible = ref(false)
const createForm = ref({ name: {}, slug: '', sortOrder: 0 })
const createContainerName = computed({
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

const openCreateContainerDialog = () => {
  createForm.value = { name: {}, slug: '', sortOrder: treeData.value.length }
  createContainerVisible.value = true
}

const handleCreateContainer = async () => {
  saving.value = true
  try {
    const data = {
      name: JSON.stringify(createForm.value.name),
      slug: createForm.value.slug,
      sortOrder: createForm.value.sortOrder
    }
    const res = await createMenuContainer(data)
    if (res.code === 0) {
      ElMessage.success(t('plugins.uni.createSuccess'))
      createContainerVisible.value = false
      await loadTree()
    } else {
      ElMessage.error(res.msg || t('plugins.uni.loadFailed'))
    }
  } catch (e) {
    console.error('创建容器失败:', e)
  } finally {
    saving.value = false
  }
}

// ---- Create Item Dialog ----
const createItemVisible = ref(false)
const createItemTitle = ref(t('plugins.uni.menus.newMenuItem'))
const createItemParentContainerId = ref(0)
const createItemParentItemId = ref(null) // null = under container, value = under item
const createItemForm = ref({ name: {}, slug: '', sortOrder: 0 })
const createItemMeta = ref({ type: 'url', url: '', target: '_self', object_id: 0 })
const createItemName = computed({
  get() {
    const obj = createItemForm.value.name
    return (obj && typeof obj === 'object') ? (obj[cmsLocaleStore.activeLocale] || '') : ''
  },
  set(val) {
    if (!createItemForm.value.name || typeof createItemForm.value.name !== 'object') {
      createItemForm.value.name = {}
    }
    createItemForm.value.name[cmsLocaleStore.activeLocale] = val
  }
})

const handleAddItem = (containerNode) => {
  createItemTitle.value = t('plugins.uni.menus.menuItemPrefix', { name: getI18nText(containerNode.name) })
  createItemParentContainerId.value = containerNode.id
  createItemParentItemId.value = null
  createItemForm.value = { name: {}, slug: '', sortOrder: (containerNode.children || []).length }
  createItemMeta.value = { type: 'url', url: '', target: '_self', object_id: 0 }
  createItemVisible.value = true
}

const handleAddChild = (parentNode) => {
  createItemTitle.value = t('plugins.uni.menus.childMenuItemPrefix', { name: getI18nText(parentNode.name) })
  const containerId = findContainerId(parentNode.id)
  createItemParentContainerId.value = containerId || 0
  createItemParentItemId.value = parentNode.id
  createItemForm.value = { name: {}, slug: '', sortOrder: (parentNode.children || []).length }
  createItemMeta.value = { type: 'url', url: '', target: '_self', object_id: 0 }
  createItemVisible.value = true
}

const handleCreateItem = async () => {
  saving.value = true
  try {
    const data = {
      name: JSON.stringify(createItemForm.value.name),
      slug: createItemForm.value.slug,
      sortOrder: createItemForm.value.sortOrder,
      metaJson: JSON.stringify(createItemMeta.value)
    }
    if (createItemParentItemId.value != null) {
      // Creating under another item
      data.parentId = createItemParentItemId.value
    }
    const res = await createMenuItem(createItemParentContainerId.value, data)
    if (res.code === 0) {
      ElMessage.success(t('plugins.uni.createSuccess'))
      createItemVisible.value = false
      await loadTree()
    } else {
      ElMessage.error(res.msg || t('plugins.uni.loadFailed'))
    }
  } catch (e) {
    console.error('创建菜单项失败:', e)
  } finally {
    saving.value = false
  }
}

// ---- Delete ----
const handleDelete = async (data) => {
  try {
    let res
    if (data.isContainer) {
      res = await deleteMenuContainer(data.id)
    } else {
      res = await deleteMenuItem(data.id)
    }
    if (res.code === 0) {
      ElMessage.success(t('plugins.uni.deleteSuccess'))
      if (selectedId.value === data.id) {
        selectedId.value = null
      }
      await loadTree()
    } else {
      ElMessage.error(res.msg || t('plugins.uni.loadFailed'))
    }
  } catch (e) {
    console.error('删除失败:', e)
  }
}

onMounted(() => {
  loadTree()
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

.node-tag {
  font-size: 11px;
}

.node-url {
  color: var(--el-text-color-secondary, #909399);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
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
