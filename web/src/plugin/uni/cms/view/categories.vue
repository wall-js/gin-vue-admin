<template>
  <div>
    <LocaleSwitcher />

    <div class="gva-search-box">
      <div class="gva-table-box">
        <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0;">{{ typeLabel }}管理</h2>
          <el-button type="primary" @click="openDialog('create')">新增{{ typeLabel }}</el-button>
        </div>

        <el-table
          :data="treeData"
          border
          row-key="id"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          default-expand-all
          style="width: 100%"
          v-loading="loading"
        >
          <el-table-column label="名称" min-width="200">
            <template #default="{ row }">
              <span>{{ getI18nText(row.name) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="slug" label="Slug" width="160" />
          <el-table-column label="描述" min-width="180">
            <template #default="{ row }">
              <span>{{ getI18nText(row.description) || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="sortOrder" label="排序" width="80" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="openDialog('update', row)">编辑</el-button>
              <el-popconfirm title="确定删除此条目及其子项？" @confirm="handleDelete(row)">
                <template #reference>
                  <el-button type="danger" link>删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? `新增${typeLabel}` : `编辑${typeLabel}`"
      width="550px"
      :close-on-click-modal="false"
    >
      <el-form :model="formData" label-width="80px">
        <el-form-item label="父级">
          <CategoryTreeSelect
            v-model="formData.parentId"
            :type="props.termType"
            :exclude-id="editingId"
            placeholder="无（顶级）"
          />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="formI18n('name').value" :placeholder="`请输入${typeLabel}名称`" />
        </el-form-item>
        <el-form-item label="Slug" required>
          <el-input v-model="formData.slug" placeholder="URL slug，如 tech-news" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formI18n('description').value" type="textarea" :rows="3" placeholder="可选描述" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="formData.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import LocaleSwitcher from '../components/LocaleSwitcher.vue'
import CategoryTreeSelect from '../components/CategoryTreeSelect.vue'
import { listTerms, createTerm, updateTerm, deleteTerm } from '../api/term.js'
import { useCmsLocaleStore } from '../store/cmsLocale.js'

const props = defineProps({
  termType: { type: String, default: 'category' }
})

const cmsLocaleStore = useCmsLocaleStore()

const typeLabel = computed(() => props.termType === 'category' ? '分类' : '标签')

// ---- i18n helpers ----
const getI18nText = (val) => {
  if (!val) return ''
  const locale = cmsLocaleStore.activeLocale
  if (typeof val === 'string') {
    try {
      const obj = JSON.parse(val)
      return obj[locale] || obj.zh || obj.en || val
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

const formI18n = (field) => {
  return {
    get value() {
      const obj = formData.value[field]
      return (obj && typeof obj === 'object') ? (obj[cmsLocaleStore.activeLocale] || '') : ''
    },
    set value(val) {
      if (!formData.value[field] || typeof formData.value[field] !== 'object') {
        formData.value[field] = {}
      }
      formData.value[field][cmsLocaleStore.activeLocale] = val
    }
  }
}

// ---- Term List ----
const loading = ref(false)
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

// 将扁平列表构建为树
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
  // 标记 hasChildren
  const mark = (nodes) => {
    for (const n of nodes) {
      n.hasChildren = n.children.length > 0
      if (n.hasChildren) mark(n.children)
    }
  }
  mark(roots)
  return roots
})

// ---- Dialog ----
const dialogVisible = ref(false)
const dialogType = ref('create')
const editingId = ref(0)
const formData = ref({ parentId: 0, name: {}, slug: '', description: {}, sortOrder: 0 })

const openDialog = (type, row) => {
  dialogType.value = type
  editingId.value = 0
  formData.value = { parentId: 0, name: {}, slug: '', description: {}, sortOrder: 0 }

  if (type === 'update' && row) {
    formData.value = {
      parentId: row.parentId || 0,
      name: parseI18nField(row.name),
      slug: row.slug || '',
      description: parseI18nField(row.description),
      sortOrder: row.sortOrder || 0
    }
    editingId.value = row.id
  }
  dialogVisible.value = true
}

const handleSave = async () => {
  const data = {
    type: props.termType,
    ...formData.value,
    parentId: formData.value.parentId || 0,
    name: JSON.stringify(formData.value.name),
    description: JSON.stringify(formData.value.description)
  }
  try {
    let res
    if (dialogType.value === 'create') {
      res = await createTerm(data)
    } else {
      res = await updateTerm(editingId.value, data)
    }
    if (res.code === 0) {
      ElMessage.success('保存成功')
      dialogVisible.value = false
      loadTerms()
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    console.error('保存失败:', e)
  }
}

const handleDelete = async (row) => {
  try {
    const res = await deleteTerm(row.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      loadTerms()
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
  margin-bottom: 10px;
}
.gva-table-box {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}
</style>
