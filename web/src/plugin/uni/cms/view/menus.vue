<template>
  <div>
    <LocaleSwitcher />

    <div class="gva-search-box">
      <div class="gva-table-box">
        <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0;">菜单管理</h2>
          <el-button type="primary" @click="openContainerDialog('create')">新增菜单容器</el-button>
        </div>

        <!-- 菜单容器列表 -->
        <el-table :data="containers" border style="width: 100%" v-loading="loading">
          <el-table-column label="名称" min-width="150">
            <template #default="{ row }">
              <span>{{ getI18nText(row.name) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="slug" label="Slug (渲染位置)" width="160" />
          <el-table-column prop="sortOrder" label="排序" width="80" />
          <el-table-column label="菜单项数" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ (row.items || []).length }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="openItemsDialog(row)">管理菜单项</el-button>
              <el-button type="primary" link @click="openContainerDialog('update', row)">编辑</el-button>
              <el-popconfirm title="确定删除此菜单容器？" @confirm="handleDeleteContainer(row)">
                <template #reference>
                  <el-button type="danger" link>删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 容器编辑对话框 -->
    <el-dialog
      v-model="containerDialogVisible"
      :title="containerDialogType === 'create' ? '新增菜单容器' : '编辑菜单容器'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="containerForm" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="containerI18n('name').value" placeholder="如：主导航、页脚链接" />
        </el-form-item>
        <el-form-item label="Slug" required>
          <el-input v-model="containerForm.slug" placeholder="如：main、footer、external" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="containerForm.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="containerDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveContainer">保存</el-button>
      </template>
    </el-dialog>

    <!-- 菜单项管理抽屉 -->
    <el-drawer
      v-model="itemsDrawerVisible"
      :title="`管理菜单项 - ${currentContainer ? getI18nText(currentContainer.name) : ''}`"
      size="60%"
      :close-on-click-modal="false"
    >
      <div style="margin-bottom: 12px;">
        <el-button type="primary" @click="openItemDialog('create')">新增菜单项</el-button>
      </div>

      <el-table :data="currentItems" border style="width: 100%" v-loading="itemsLoading" row-key="id">
        <el-table-column label="名称" min-width="150">
          <template #default="{ row }">
            <span>{{ getI18nText(row.name) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="slug" label="Slug" width="120" />
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ getItemMeta(row.metaJson).type || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="URL" min-width="150">
          <template #default="{ row }">
            <span>{{ getItemMeta(row.metaJson).url || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="70" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openItemDialog('update', row)">编辑</el-button>
            <el-popconfirm title="确定删除此菜单项？" @confirm="handleDeleteItem(row)">
              <template #reference>
                <el-button type="danger" link>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px;" v-if="currentItems.length > 1">
        <el-divider content-position="left">排序调整</el-divider>
        <p style="color: #909399; font-size: 12px;">拖动上方表格行调整顺序（或在下方手动输入 ID 顺序）</p>
        <div style="display: flex; gap: 8px; align-items: center;">
          <el-input v-model="reorderIdsStr" placeholder="输入 ID 顺序，逗号分隔，如: 3,1,2" />
          <el-button type="primary" @click="handleReorder">保存排序</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 菜单项编辑对话框 -->
    <el-dialog
      v-model="itemDialogVisible"
      :title="itemDialogType === 'create' ? '新增菜单项' : '编辑菜单项'"
      width="550px"
      :close-on-click-modal="false"
    >
      <el-form :model="itemForm" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="itemI18n('name').value" placeholder="菜单项显示名称" />
        </el-form-item>
        <el-form-item label="Slug" required>
          <el-input v-model="itemForm.slug" placeholder="URL slug" />
        </el-form-item>

        <el-divider content-position="left">链接配置</el-divider>

        <el-form-item label="类型">
          <el-select v-model="itemMeta.type" placeholder="选择类型">
            <el-option label="自定义URL" value="url" />
            <el-option label="页面" value="page" />
            <el-option label="文章" value="post" />
            <el-option label="分类" value="category" />
            <el-option label="标签" value="tag" />
          </el-select>
        </el-form-item>
        <el-form-item label="URL">
          <el-input v-model="itemMeta.url" placeholder="链接地址，如 /about" />
        </el-form-item>
        <el-form-item label="打开方式">
          <el-select v-model="itemMeta.target">
            <el-option label="当前窗口" value="_self" />
            <el-option label="新窗口" value="_blank" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="itemForm.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveItem">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import LocaleSwitcher from '../components/LocaleSwitcher.vue'
import {
  listMenuContainers, getMenuContainer, createMenuContainer, updateMenuContainer, deleteMenuContainer,
  createMenuItem, updateMenuItem, deleteMenuItem, reorderMenuItems
} from '../api/menu.js'
import { useCmsLocaleStore } from '../store/cmsLocale.js'

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

const i18nBind = (formRef, field) => {
  return {
    get value() {
      const obj = formRef.value[field]
      return (obj && typeof obj === 'object') ? (obj[cmsLocaleStore.activeLocale] || '') : ''
    },
    set value(val) {
      if (!formRef.value[field] || typeof formRef.value[field] !== 'object') {
        formRef.value[field] = {}
      }
      formRef.value[field][cmsLocaleStore.activeLocale] = val
    }
  }
}

// ---- Container List ----
const loading = ref(false)
const containers = ref([])

const loadContainers = async () => {
  loading.value = true
  try {
    const res = await listMenuContainers()
    if (res.code === 0) {
      containers.value = res.data.list || []
    }
  } catch (e) {
    console.error('加载菜单容器列表失败:', e)
  } finally {
    loading.value = false
  }
}

// ---- Container Dialog ----
const containerDialogVisible = ref(false)
const containerDialogType = ref('create')
const editingContainerId = ref(0)
const containerForm = ref({ name: {}, slug: '', sortOrder: 0 })
const containerI18n = (field) => i18nBind(containerForm, field)

const openContainerDialog = (type, row) => {
  containerDialogType.value = type
  editingContainerId.value = 0
  containerForm.value = { name: {}, slug: '', sortOrder: 0 }

  if (type === 'update' && row) {
    containerForm.value = {
      name: parseI18nField(row.name),
      slug: row.slug || '',
      sortOrder: row.sortOrder || 0
    }
    editingContainerId.value = row.id
  }
  containerDialogVisible.value = true
}

const handleSaveContainer = async () => {
  const data = {
    ...containerForm.value,
    name: JSON.stringify(containerForm.value.name)
  }
  try {
    let res
    if (containerDialogType.value === 'create') {
      res = await createMenuContainer(data)
    } else {
      res = await updateMenuContainer(editingContainerId.value, data)
    }
    if (res.code === 0) {
      ElMessage.success('保存成功')
      containerDialogVisible.value = false
      loadContainers()
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    console.error('保存容器失败:', e)
  }
}

const handleDeleteContainer = async (row) => {
  try {
    const res = await deleteMenuContainer(row.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      loadContainers()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (e) {
    console.error('删除容器失败:', e)
  }
}

// ---- Menu Items Drawer ----
const itemsDrawerVisible = ref(false)
const itemsLoading = ref(false)
const currentContainer = ref(null)
const currentItems = ref([])
const reorderIdsStr = ref('')

const openItemsDialog = async (container) => {
  currentContainer.value = container
  itemsDrawerVisible.value = true
  await loadItems(container.id)
}

const loadItems = async (containerId) => {
  itemsLoading.value = true
  try {
    const res = await getMenuContainer(containerId)
    if (res.code === 0) {
      currentItems.value = res.data.items || []
      reorderIdsStr.value = currentItems.value.map(i => i.id).join(',')
    }
  } catch (e) {
    console.error('加载菜单项失败:', e)
  } finally {
    itemsLoading.value = false
  }
}

const getItemMeta = (metaJson) => {
  if (!metaJson) return {}
  try { return JSON.parse(metaJson) } catch { return {} }
}

// ---- Item Dialog ----
const itemDialogVisible = ref(false)
const itemDialogType = ref('create')
const editingItemId = ref(0)
const itemForm = ref({ name: {}, slug: '', sortOrder: 0 })
const itemMeta = ref({ type: 'url', url: '', target: '_self', object_id: 0 })
const itemI18n = (field) => i18nBind(itemForm, field)

const openItemDialog = (type, row) => {
  itemDialogType.value = type
  editingItemId.value = 0
  itemForm.value = { name: {}, slug: '', sortOrder: 0 }
  itemMeta.value = { type: 'url', url: '', target: '_self', object_id: 0 }

  if (type === 'update' && row) {
    itemForm.value = {
      name: parseI18nField(row.name),
      slug: row.slug || '',
      sortOrder: row.sortOrder || 0
    }
    itemMeta.value = getItemMeta(row.metaJson)
    editingItemId.value = row.id
  }
  itemDialogVisible.value = true
}

const handleSaveItem = async () => {
  const data = {
    ...itemForm.value,
    name: JSON.stringify(itemForm.value.name),
    metaJson: JSON.stringify(itemMeta.value)
  }
  try {
    let res
    if (itemDialogType.value === 'create') {
      res = await createMenuItem(currentContainer.value.id, data)
    } else {
      res = await updateMenuItem(editingItemId.value, data)
    }
    if (res.code === 0) {
      ElMessage.success('保存成功')
      itemDialogVisible.value = false
      loadItems(currentContainer.value.id)
      loadContainers() // refresh container item count
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    console.error('保存菜单项失败:', e)
  }
}

const handleDeleteItem = async (row) => {
  try {
    const res = await deleteMenuItem(row.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      loadItems(currentContainer.value.id)
      loadContainers()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (e) {
    console.error('删除菜单项失败:', e)
  }
}

const handleReorder = async () => {
  const ids = reorderIdsStr.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
  if (ids.length === 0) {
    ElMessage.warning('请输入有效的 ID 顺序')
    return
  }
  try {
    const res = await reorderMenuItems(currentContainer.value.id, ids)
    if (res.code === 0) {
      ElMessage.success('排序已保存')
      loadItems(currentContainer.value.id)
    } else {
      ElMessage.error(res.msg || '排序失败')
    }
  } catch (e) {
    console.error('排序失败:', e)
  }
}

onMounted(() => {
  loadContainers()
  cmsLocaleStore.init()
})
</script>

<style scoped>
.gva-search-box {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
  margin-bottom: 10px;
}
.gva-table-box {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}
</style>
